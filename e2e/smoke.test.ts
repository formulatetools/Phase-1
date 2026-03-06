import { test, expect } from '@playwright/test'

test.describe('Smoke tests', () => {
  test('landing page loads and has correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Formulate/)
  })

  test('landing page has hero CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Get Started Free' }).first()).toBeVisible()
  })

  test('pricing section is visible', async ({ page }) => {
    await page.goto('/')
    const pricing = page.locator('#pricing')
    await pricing.scrollIntoViewIfNeeded()
    await expect(pricing).toBeVisible()
  })

  test('worksheet library page loads', async ({ page }) => {
    await page.goto('/worksheets')
    await expect(page).toHaveTitle(/Formulate/)
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('signup page loads', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading')).toBeVisible()
  })

  test('blog page loads', async ({ page }) => {
    await page.goto('/blog')
    await expect(page).toHaveTitle(/Formulate/)
  })

  test('skip-to-content link exists on marketing pages', async ({ page }) => {
    await page.goto('/')
    // The skip link should be in the DOM but visually hidden
    const skipLink = page.getByText('Skip to main content')
    await expect(skipLink).toBeAttached()
  })

  test('mobile nav toggle has aria-expanded', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    const toggle = page.getByLabel('Toggle menu')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})
