import { test, expect } from '@playwright/test'

test.describe('Public pages', () => {
  test('home', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main#main-content')).toBeVisible()
  })
})
