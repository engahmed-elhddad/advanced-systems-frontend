/**
 * Admin "Add Product" — live E2E test suite
 *
 * Tests the full create flow against a real backend (no mocks):
 *   Login → /admin/products → /admin/products/new → fill form → upload image
 *   → submit → verify redirect → verify product in list
 *
 * Required env (frontend/.env.local):
 *   ADMIN_LOGIN_EMAIL=admin@example.com
 *   ADMIN_LOGIN_PASSWORD=secret
 *
 * Design notes
 * ────────────
 * • Selectors are derived from actual component source:
 *     - Input component renders <label htmlFor> → getByLabel() works
 *     - Select (Radix) renders role="combobox" with label association → getByRole('combobox', {name})
 *     - Description textarea has no htmlFor → use getByPlaceholder()
 *     - Image input is hidden with aria-label → setInputFiles() bypasses visibility
 * • window.confirm() is fired by ProductForm when recommended fields are missing.
 *   Registered handler accepts it as a safety net (all fields are filled).
 * • Product ID is captured from the create API response so afterEach can clean
 *   up via DELETE even when the test fails mid-flow.
 * • Brand / category: picks the first available option from the list.
 *   Falls back to creating one inline (via the "+ Add new" modal) if empty.
 */

import { expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test'
import { test } from './fixtures/live-e2e'
import { cleanupTrackedAndTaggedOrphans } from './e2e-cleanup'
import { ensureAdminSession } from './e2e-session'
import { E2E_FAIL, e2eLog, newE2EProductBundle, readSuiteRunId, uniquePartNumber, uniqueProductName } from './e2e-isolation'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A 1×1 white pixel PNG (base64-encoded).
 * Self-contained — no fixtures directory or filesystem access required.
 */
const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQ' +
  'AABjkB6QAAAABJRU5ErkJggg=='

// ─────────────────────────────────────────────────────────────────────────────
// Fixture — mirrors the console/network capture pattern in admin-login.spec.ts
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Radix UI Select interaction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Selects an option from a Radix Select component by accessible label.
 *
 * Radix Select renders:
 *   • Trigger  → role="combobox"  (linked to label via htmlFor)
 *   • Content  → role="listbox"   (portalled to document.body)
 *   • Item     → role="option"
 *
 * @param optionText  Exact option text to click. Omit to pick the first option.
 * @returns           The text content of the option that was selected.
 */
async function selectRadixOption(
  page: Page,
  comboboxLabel: string,
  optionText?: string,
): Promise<string> {
  const trigger = page.getByRole('combobox', { name: comboboxLabel })
  await expect(trigger, `"${comboboxLabel}" combobox must be visible`).toBeVisible({
    timeout: 15_000,
  })
  await trigger.click()

  // Content is portalled to document.body; Playwright searches the full DOM.
  const listbox = page.getByRole('listbox')
  await expect(listbox, `Listbox for "${comboboxLabel}" must open after click`).toBeVisible({
    timeout: 10_000,
  })

  if (optionText) {
    const option = page.getByRole('option', { name: optionText })
    await expect(option, `Option "${optionText}" must exist in "${comboboxLabel}" list`).toBeVisible(
      { timeout: 8_000 },
    )
    await option.click()
    await expect(listbox).not.toBeVisible({ timeout: 5_000 })
    return optionText
  }

  // Pick the first option; wait up to 6 s for slow API responses.
  const firstOption = listbox.getByRole('option').first()
  await expect(
    firstOption,
    `At least one option must appear in the "${comboboxLabel}" list`,
  ).toBeVisible({ timeout: 6_000 })
  const text = ((await firstOption.textContent()) ?? '').trim()
  await firstOption.click()
  await expect(listbox).not.toBeVisible({ timeout: 5_000 })
  return text
}

/**
 * When no options exist in a Select, clicks "+ Add new …" inside the open
 * dropdown, fills the creation modal, and submits it.
 *
 * The Select component automatically selects the newly-created value after
 * the modal closes (ProductForm patches form state via setState).
 */
async function createOptionViaModal(
  page: Page,
  selectLabel: string,
  addNewPattern: RegExp,
  inputLabel: string,
  newName: string,
): Promise<void> {
  // Trigger must already be clicked (listbox open) before calling this.
  const addNewBtn = page.getByRole('button', { name: addNewPattern })
  await expect(
    addNewBtn,
    `"Add new" button for "${selectLabel}" must be visible inside the open dropdown`,
  ).toBeVisible({ timeout: 8_000 })
  await addNewBtn.click()

  // Radix closes the dropdown and ProductForm opens a Modal.
  const dialog = page.getByRole('dialog')
  await expect(dialog, `Creation dialog for "${selectLabel}" must appear`).toBeVisible({
    timeout: 10_000,
  })

  // Input component renders <label htmlFor> — getByLabel works.
  await dialog.getByLabel(inputLabel).fill(newName)
  await dialog.getByRole('button', { name: 'Create' }).click()

  await expect(dialog, `Creation dialog must close after "Create" is clicked`).not.toBeVisible({
    timeout: 20_000,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Brand / Category selection with inline-create fallback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tries to select the first available option from a brand/category Select.
 * When the list is empty (fresh environment), creates a new item via the
 * inline "+ Add new" modal.
 *
 * @returns true if an existing option was picked; false if one was created.
 */
async function selectOrCreate(
  page: Page,
  opts: {
    selectLabel: string
    addNewPattern: RegExp
    inputLabel: string
    fallbackName: string
    /** Milliseconds to wait for API-loaded options before falling back. */
    optionLoadTimeout?: number
  },
): Promise<boolean> {
  const { selectLabel, addNewPattern, inputLabel, fallbackName, optionLoadTimeout = 6_000 } = opts

  const trigger = page.getByRole('combobox', { name: selectLabel })
  await expect(trigger).toBeVisible({ timeout: 15_000 })
  await trigger.click()

  const listbox = page.getByRole('listbox')
  await expect(listbox).toBeVisible({ timeout: 10_000 })

  // Wait for options to arrive from the API (may still be loading).
  const hasOptions = await listbox
    .getByRole('option')
    .first()
    .isVisible({ timeout: optionLoadTimeout })
    .catch(() => false)

  if (hasOptions) {
    await listbox.getByRole('option').first().click()
    await expect(listbox).not.toBeVisible({ timeout: 5_000 })
    return true
  }

  // No options — create one inline via the "+ Add new" modal.
  await createOptionViaModal(page, selectLabel, addNewPattern, inputLabel, fallbackName)
  return false
}

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Admin: Add Product (live E2E)', () => {
  // Populated by the create test; used by afterEach to clean up.
  let createdProductId: number | undefined

  // ── afterEach ──────────────────────────────────────────────────────────────

  test.afterEach(async ({ page, request }, testInfo) => {
    const tracked = createdProductId != null ? [createdProductId] : []
    createdProductId = undefined
    const { deleted } = await cleanupTrackedAndTaggedOrphans(page, request, testInfo, tracked)
    e2eLog(testInfo, `afterEach: cleanup deleted=${deleted} (tracked + [E2E] tag fallback)`)

    // ② Emit structured context to CI logs on failure.
    if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
      const currentUrl = page.url()
      const alertTexts = await page
        .getByRole('alert')
        .allTextContents()
        .catch(() => [])
      const statusTexts = await page
        .locator('[role="status"]')
        .allTextContents()
        .catch(() => [])

      console.error('[E2E add-product] ── failure context ──────────────────────')
      console.error('  URL    :', currentUrl)
      console.error('  alerts :', alertTexts.filter(Boolean))
      console.error('  toasts :', statusTexts.filter(Boolean))
      console.error('  error  :', testInfo.error?.message ?? String(testInfo.error ?? ''))
      console.error('[E2E add-product] ─────────────────────────────────────────')
    }
  })

  // ── Main test ──────────────────────────────────────────────────────────────

  test(
    'creates a product with all fields and verifies it in the products list',
    async ({ page, context }, testInfo) => {
      const { runId, partNumber: PART_NUMBER, productName: PRODUCT_NAME } = newE2EProductBundle('ADD')
      e2eLog(
        testInfo,
        `isolation: new product bundle runId=${runId} part_number=${PART_NUMBER} name=${PRODUCT_NAME}`,
      )

      // ── 1. Authenticate ────────────────────────────────────────────────────
      await ensureAdminSession(page, context)

      // ── 2. Navigate via the Products list → Add Product ────────────────────
      await page.goto('/admin/products', { waitUntil: 'load' })

      await expect(
        page.getByRole('heading', { name: 'Products', level: 1 }),
        `${E2E_FAIL.UI} Products list heading confirms /admin/products loaded`,
      ).toBeVisible({ timeout: 20_000 })

      // Clicking the "Add Product" link (rendered by the products list page)
      // is a more realistic user path than navigating directly.
      await page.getByRole('link', { name: 'Add Product' }).click()
      await page.waitForURL(/\/admin\/products\/new\b/, { timeout: 30_000 })

      await expect(
        page.getByTestId('admin-create-product-heading'),
        `${E2E_FAIL.UI} Create product page heading must appear on /admin/products/new`,
      ).toBeVisible({ timeout: 20_000 })

      // ── 3. Wait for brand/category API calls to settle ─────────────────────
      // The page issues GET /api/v1/brands/ and /api/v1/categories/ on mount.
      // We wait for the comboboxes to be visible (rendered after data arrives)
      // instead of waitForLoadState('networkidle'), which is brittle with
      // background polling.
      await expect(
        page.getByRole('combobox', { name: 'Brand' }),
        `${E2E_FAIL.NETWORK} Brand combobox must render (catalog GET /brands must succeed)`,
      ).toBeVisible({ timeout: 15_000 })

      // ── 4. Name ────────────────────────────────────────────────────────────
      // Input component: <label htmlFor={autoId}>{label}</label> + <input id={autoId}>
      // getByLabel() resolves via the htmlFor association.
      await page.getByLabel('Name').fill(PRODUCT_NAME)

      // ── 5. Part number ─────────────────────────────────────────────────────
      // Explicit value gives a deterministic search string for list verification.
      const partNumberInput = page.getByLabel('Part number')
      await partNumberInput.clear()
      await partNumberInput.fill(PART_NUMBER)
      await partNumberInput.blur() // dismiss any auto-complete hint

      // ── 6. Brand ───────────────────────────────────────────────────────────
      await selectOrCreate(page, {
        selectLabel: 'Brand',
        addNewPattern: /add new brand/i,
        inputLabel: 'Brand name',
        fallbackName: `[E2E][${readSuiteRunId()}] Brand ${runId}`.slice(0, 200),
      })

      // ── 7. Category ────────────────────────────────────────────────────────
      await selectOrCreate(page, {
        selectLabel: 'Category',
        addNewPattern: /add new category/i,
        inputLabel: 'Category name',
        fallbackName: `[E2E][${readSuiteRunId()}] Category ${runId}`.slice(0, 200),
      })

      // ── 8. Description ─────────────────────────────────────────────────────
      // ProductForm renders a <textarea> with no htmlFor association.
      // Selector: getByPlaceholder() is the most stable identifier available.
      const descriptionTextarea = page.getByPlaceholder('Write a concise product description...')
      await expect(descriptionTextarea, 'Description textarea must be visible').toBeVisible()
      await descriptionTextarea.fill(
        `Automated E2E test. Run ID: ${runId}. Safe to delete immediately.`,
      )

      // ── 9. Image upload ────────────────────────────────────────────────────
      // The real <input type="file"> is hidden (className="hidden") but carries
      // aria-label="Upload product image". Playwright's setInputFiles() works
      // on hidden inputs — it dispatches the change event which fires React's
      // onChange handler → URL.createObjectURL() → preview image updates.
      const imageInput = page.locator(
        'input[type="file"][aria-label="Upload product image"]',
      )
      await expect(
        imageInput,
        'Hidden file input with aria-label="Upload product image" must be present in DOM',
      ).toBeAttached()

      await imageInput.setInputFiles({
        name: `e2e-product-${runId}.png`,
        mimeType: 'image/png',
        buffer: Buffer.from(MINIMAL_PNG_BASE64, 'base64'),
      })

      // After the file is picked, ProductForm calls URL.createObjectURL(file)
      // and sets it as the <img alt="Product preview"> src, replacing the
      // "placehold.co" placeholder.
      await expect(
        page.locator('img[alt="Product preview"]'),
        'Preview image src must change away from placeholder after file selection',
      ).not.toHaveAttribute('src', /placehold\.co/, { timeout: 8_000 })

      // ── 10. Intercept the product-create API response ──────────────────────
      // Must be registered BEFORE clicking submit to avoid a race condition.
      // Matches POST /api/v1/admin/products exactly (not /products/{id}/images).
      const createApiResponsePromise = page.waitForResponse(
        (res) => {
          const isPost = res.request().method() === 'POST'
          // Regex: path ends at "products", no further segments (e.g. no /{id}/images)
          const isCreateEndpoint = /\/api\/v1\/admin\/products\/?(?:\?.*)?$/.test(res.url())
          return isPost && isCreateEndpoint
        },
        { timeout: 60_000 },
      )

      // Also intercept image upload to verify it succeeded independently.
      const imageUploadResponsePromise = page.waitForResponse(
        (res) =>
          res.request().method() === 'POST' &&
          /\/api\/v1\/admin\/products\/\d+\/images/.test(res.url()),
        { timeout: 60_000 },
      )

      // ── 11. Guard against the "missing fields" warning dialog ──────────────
      // ProductForm calls window.confirm() if brand/category/image/description
      // are missing. We filled everything, but this handler prevents the test
      // from hanging if the guard fires unexpectedly.
      page.once('dialog', (dialog) => {
        console.info(
          `[E2E add-product] window.confirm intercepted — message: ` +
            `"${dialog.message().slice(0, 160)}" — accepting.`,
        )
        void dialog.accept()
      })

      // ── 12. Submit ─────────────────────────────────────────────────────────
      const submitButton = page.getByTestId('admin-product-save')
      await expect(
        submitButton,
        '"Save Product" button must be enabled before submit',
      ).toBeEnabled({ timeout: 5_000 })

      await submitButton.click()

      // ── 13. Assert no instant validation error ─────────────────────────────
      // Synchronous validation (e.g. required field empty) renders role="alert"
      // inline under the field. Give a 1.5 s window to catch it.
      const inlineErrors = page.getByRole('alert')
      await page
        .waitForTimeout(1_500) // intentional: catch sync validation only
        .then(async () => {
          const texts = await inlineErrors.allTextContents().catch(() => [])
          const real = texts.map((t) => t.trim()).filter(Boolean)
          if (real.length > 0) {
            throw new Error(
              `Unexpected form validation error(s) after submit: ${real.join(' | ')}`,
            )
          }
        })

      // ── 14. Verify product-create API succeeded ────────────────────────────
      const createResponse = await createApiResponsePromise

      if (!createResponse.ok()) {
        const errorBody = await createResponse.text().catch(() => '(unreadable)')
        const domain =
          createResponse.status() === 401 || createResponse.status() === 403
            ? E2E_FAIL.AUTH
            : createResponse.status() === 409
              ? E2E_FAIL.DATA_CONFLICT
              : E2E_FAIL.NETWORK
        throw new Error(
          `${domain} Product create API HTTP ${createResponse.status()}.\n` +
            `Body: ${errorBody.slice(0, 500)}`,
        )
      }

      // Capture the created product ID for afterEach cleanup.
      const responseBody: Record<string, unknown> = await createResponse
        .json()
        .catch(() => ({}))
      const rawId = responseBody?.id ?? (responseBody?.data as Record<string, unknown>)?.id
      if (typeof rawId === 'number') {
        createdProductId = rawId
        e2eLog(
          testInfo,
          `API: product created id=${rawId} part_number=${PART_NUMBER} (tracked for cleanup)`,
        )
      } else {
        e2eLog(
          testInfo,
          `${E2E_FAIL.BUG} Could not parse product id from create response — cleanup may miss orphan: ${JSON.stringify(responseBody).slice(0, 400)}`,
        )
      }

      // ── 15. Verify image upload succeeded ──────────────────────────────────
      // Image upload is the second POST call; it fires after product create.
      const imageUploadResponse = await imageUploadResponsePromise

      if (!imageUploadResponse.ok()) {
        const errorBody = await imageUploadResponse.text().catch(() => '(unreadable)')
        throw new Error(
          `${E2E_FAIL.NETWORK} Image upload API HTTP ${imageUploadResponse.status()}.\n` +
            `Body: ${errorBody.slice(0, 500)}\n` +
            `Check CPR-03 fix: backend expects integer productId in the URL.`,
        )
      }

      console.info(
        `[E2E add-product] ✓ Image upload succeeded ` +
          `(HTTP ${imageUploadResponse.status()}).`,
      )

      // ── 16. Wait for redirect to the products list ─────────────────────────
      // NewAdminProductPage calls router.push('/admin/products') on success.
      await page.waitForURL(/\/admin\/products\/?$/, { timeout: 60_000 })

      await expect(
        page.getByRole('heading', { name: 'Products', level: 1 }),
        'Products list heading must appear after successful create + redirect',
      ).toBeVisible({ timeout: 20_000 })

      // ── 17. Search for the new product in the list ─────────────────────────
      // The Input on the products page has aria-label="Search products".
      const searchInput = page.getByRole('textbox', { name: /search products/i })
      await expect(
        searchInput,
        'Search input must be visible on the products list',
      ).toBeVisible({ timeout: 15_000 })

      await searchInput.fill(PART_NUMBER)

      // Debounce is 300 ms (useDebouncedValue). Wait for the resulting GET
      // request so we don't assert before the filtered list arrives.
      await page.waitForResponse(
        (res) =>
          res.url().includes('/api/v1/admin/products') && res.request().method() === 'GET',
        { timeout: 20_000 },
      )

      // ── 18. Assert the product row is visible ──────────────────────────────
      // DataTable renders product names in <td> cells with font-medium text-white.
      // Two locator strategies with .or() — semantic first, attribute fallback.
      const productNameCell = page
        .getByRole('cell', { name: PRODUCT_NAME })
        .or(page.locator('td').filter({ hasText: PRODUCT_NAME }))

      await expect(
        productNameCell,
        `${E2E_FAIL.BUG} Product "${PRODUCT_NAME}" (${PART_NUMBER}) must appear in the list after creation`,
      ).toBeVisible({ timeout: 20_000 })

      // ── 19. Assert no error toast is present ───────────────────────────────
      // react-hot-toast renders live region items. Error toasts indicate a
      // partial failure (e.g. rollback triggered, image upload failed silently).
      const errorToasts = page.locator('[role="status"]').filter({
        hasText: /error|failed|could not|invalid/i,
      })
      await expect(
        errorToasts,
        `${E2E_FAIL.BUG} No error toasts should be visible after a successful product creation`,
      ).toHaveCount(0, { timeout: 3_000 })

      e2eLog(
        testInfo,
        `PASS: product "${PART_NUMBER}" created and verified in admin products list`,
      )
    },
  )

  // ── Edge-case: duplicate part number ──────────────────────────────────────

  test(
    'shows a validation error (and stays on the form) when part number already exists',
    async ({ page, context, request }, testInfo) => {
      // This test creates a product via the API first, then tries to submit the
      // same part number through the UI — expecting a 409 and an inline error.

      const dupPartNumber = uniquePartNumber('DUPSEED')
      const dupSeedName = uniqueProductName('DupSeed')
      let seedProductId: number | undefined

      try {
        e2eLog(
          testInfo,
          `isolation: duplicate test seed part_number=${dupPartNumber} seed_name=${dupSeedName}`,
        )

        // ── Step A: seed a product via API ───────────────────────────────────
        await ensureAdminSession(page, context)

        const token: string | null = await page.evaluate(() =>
          window.localStorage.getItem('admin_token'),
        )
        expect(token, `${E2E_FAIL.AUTH} Admin token must be present after login`).toBeTruthy()

        const seedRes = await page.request.post('/api/v1/admin/products', {
          data: {
            part_number: dupPartNumber,
            name: dupSeedName,
            stock_quantity: 1,
            is_active: false,
            availability: 'draft',
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        expect(
          seedRes.ok(),
          `${E2E_FAIL.NETWORK} Seed product create must succeed (HTTP ${seedRes.status()})`,
        ).toBeTruthy()

        const seedBody: Record<string, unknown> = await seedRes.json().catch(() => ({}))
        const rawId = seedBody?.id
        if (typeof rawId === 'number') {
          seedProductId = rawId
          e2eLog(testInfo, `API: seed product created id=${rawId} part_number=${dupPartNumber}`)
        }

        // ── Step B: navigate to the Create Product form ──────────────────────
        await page.goto('/admin/products/new', { waitUntil: 'load' })
        await expect(page.getByTestId('admin-create-product-heading')).toBeVisible({
          timeout: 20_000,
        })

        // ── Step C: fill the form with the duplicate part number ─────────────
        await page.getByLabel('Name').fill(uniqueProductName('DupAttempt'))
        await page.getByLabel('Part number').fill(dupPartNumber)

        // Accept the "missing fields" warning (brand/category/image not filled).
        page.once('dialog', (dialog) => void dialog.accept())

        // ── Step D: submit ────────────────────────────────────────────────────
        await page.getByTestId('admin-product-save').click()

        // ── Step E: assert the form shows a part number error and no redirect ─
        // On 409, ProductForm sets partNumberError → Input renders role="alert"
        // with text "Part number already exists".
        const partNumError = page
          .getByRole('alert')
          .filter({ hasText: /part number already exists/i })

        await expect(
          partNumError,
          `${E2E_FAIL.DATA_CONFLICT} "Part number already exists" must appear after intentional duplicate submit`,
        ).toBeVisible({ timeout: 15_000 })

        // Confirm the URL did NOT change to /admin/products (no redirect on error).
        expect(
          page.url(),
          `${E2E_FAIL.BUG} URL must remain on create form — no redirect on duplicate error`,
        ).toMatch(/\/admin\/products\/new\b/)

        e2eLog(testInfo, 'PASS: duplicate part number correctly rejected with inline alert')
      } finally {
        if (seedProductId != null) {
          e2eLog(testInfo, `finally: purging seed + tagged orphans (tracked id=${seedProductId})`)
          await cleanupTrackedAndTaggedOrphans(page, request, testInfo, [seedProductId])
        }
      }
    },
  )
})
