import { test, expect, type Page } from '@playwright/test'

async function startWorkoutWithExercise(page: Page) {
  await page.goto('/workout')
  await page.getByRole('button', { name: /Start Workout/i }).click()
  await page.getByRole('button', { name: /Add Exercise/i }).click()
  await page.locator('select').nth(0).selectOption('chest')
  await page.locator('select').nth(1).selectOption('bench-press')
  await page.getByRole('button', { name: 'Add Exercise', exact: true }).click()
  await expect(page.locator('select')).toHaveCount(0)
}

test('stats bar appears after logging a set and finishing shows the summary', async ({ page }) => {
  await startWorkoutWithExercise(page)

  await expect(page.getByText('Finish Workout')).toHaveCount(0)

  await page.getByPlaceholder(/Wt \(kg\)/i).fill('60')
  await page.getByPlaceholder(/Reps/i).fill('10')
  await page.getByRole('button', { name: 'Set', exact: true }).click()

  await expect(page.getByText('Finish Workout')).toBeVisible()
  await expect(page.getByText('Sets', { exact: true })).toBeVisible()
  await expect(page.getByText('600', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /Finish Workout/i }).click()
  const dialog = page.getByRole('dialog', { name: /Workout Complete/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('600 kg')).toBeVisible()

  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
})
