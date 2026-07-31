import { test, expect, type ConsoleMessage, type Page } from '@playwright/test'

function trackErrors(page: Page) {
  const pageErrors: Error[] = []
  const consoleErrors: ConsoleMessage[] = []
  page.on('pageerror', err => pageErrors.push(err))
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg)
  })
  return { pageErrors, consoleErrors }
}

async function createExercise(page: Page, name: string) {
  await page.getByRole('button', { name: /Add Exercise/i }).click()
  await page.getByPlaceholder('Exercise name').fill(name)
  await page.getByRole('button', { name: /Create Exercise/i }).click()
  await expect(page.getByPlaceholder('Exercise name')).toHaveCount(0)
}

const MOBILE_VIEWPORTS: Array<[string, number, number]> = [
  ['iPhone SE', 375, 667],
  ['iPhone 14 Pro', 393, 852],
  ['Pixel 7', 412, 915],
  ['Galaxy S23', 360, 780],
]

for (const [name, width, height] of MOBILE_VIEWPORTS) {
  test.describe(`${name} — exercise list menu delete`, () => {
    test.use({ viewport: { width, height }, hasTouch: true })

    test('newest exercise appears first; three-dot menu deletes via confirmation; stays on muscle page', async ({ page }) => {
      const { pageErrors, consoleErrors } = trackErrors(page)

      await page.goto('/muscles/forearms')
      await createExercise(page, 'New Forearm Curl')

      const rows = page.getByTestId('available-exercise')
      await expect(rows).toHaveCount(4)
      await expect(rows.nth(0)).toContainText('New Forearm Curl')

      const trigger = page.getByRole('button', { name: /Actions for Wrist Curl/i })
      await expect(trigger).toBeVisible()
      await trigger.click()
      await page.getByRole('menuitem', { name: /Delete/i }).click()
      await expect(page.getByRole('dialog', { name: /Delete Exercise/i })).toBeVisible()
      await page.getByRole('button', { name: 'Delete', exact: true }).click()

      await expect(page).toHaveURL(/\/muscles\/forearms$/)
      await expect(page.getByText('Wrist Curl')).toHaveCount(0)
      await expect(page.getByText('New Forearm Curl')).toBeVisible()

      await page.reload()
      await expect(page.getByText('Wrist Curl')).toHaveCount(0)
      await page.reload()
      await expect(page.getByText('Wrist Curl')).toHaveCount(0)
      await expect(page.getByText('New Forearm Curl')).toBeVisible()

      expect(pageErrors).toEqual([])
      for (const msg of consoleErrors) {
        expect.soft(msg.text()).toBe('')
      }
    })
  })
}

test.describe('Desktop — exercise list menu delete', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('menu deletes Wrist Curl, stays on muscle page, list refreshes without reload', async ({ page }) => {
    const { pageErrors } = trackErrors(page)

    await page.goto('/muscles/forearms')
    const row = page.getByTestId('available-exercise').filter({ hasText: 'Wrist Curl' })
    await expect(row).toHaveCount(1)
    await row.hover()
    await row.getByRole('button', { name: /Actions for Wrist Curl/i }).click()
    await page.getByRole('menuitem', { name: /Delete/i }).click()
    await expect(page.getByRole('dialog', { name: /Delete Exercise/i })).toBeVisible()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(page).toHaveURL(/\/muscles\/forearms$/)
    await expect(page.getByText('Wrist Curl')).toHaveCount(0)
    await expect(page.getByText('Farmer Walk')).toBeVisible()

    await page.reload()
    await expect(page.getByText('Wrist Curl')).toHaveCount(0)
    await page.reload()
    await expect(page.getByText('Wrist Curl')).toHaveCount(0)

    expect(pageErrors).toEqual([])
  })

  test('deleting from the exercise detail page returns to the muscle page, not Home', async ({ page }) => {
    await page.goto('/exercise/wrist-curl')
    await expect(page.getByRole('heading', { name: 'Wrist Curl' })).toBeVisible()

    await page.getByRole('button', { name: /Actions for Wrist Curl/i }).click()
    await page.getByRole('menuitem', { name: /Delete/i }).click()
    await expect(page.getByRole('dialog', { name: /Delete Exercise/i })).toBeVisible()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(page).toHaveURL(/\/muscles\/forearms$/)
    await expect(page.getByText('Wrist Curl')).toHaveCount(0)

    await page.reload()
    await expect(page.getByText('Wrist Curl')).toHaveCount(0)
  })
})
