import { test, expect } from '@playwright/test'

test('launch plays the splash timeline, then the first-launch welcome, then reveals the dashboard', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('MY TRACKER', { exact: true })).toBeVisible()
  await expect(page.getByText('Train. Track. Progress.')).toBeVisible()

  await expect(page.getByText(/Preparing your workout/i)).toBeVisible()
  await expect(page.getByText('Train. Track. Progress.')).toHaveCount(0)

  await expect(page.getByText('MY TRACKER', { exact: true })).toHaveCount(0, { timeout: 8000 })

  await expect(page.getByText('Welcome to My Tracker')).toBeVisible({ timeout: 8000 })
  await expect(page.getByText("Let's build your best physique.")).toBeVisible()

  await expect(page.getByText('Welcome to My Tracker')).toHaveCount(0, { timeout: 8000 })
  await expect(page.getByText("Today's Focus")).toBeVisible()
})
