import { test, expect } from '@playwright/test'

test.describe('UI components (preview)', () => {
  test('preview shell renders', async ({ page }) => {
    await page.goto('/preview')
    await expect(page.getByText('Components', { exact: true })).toBeVisible()
  })
})
