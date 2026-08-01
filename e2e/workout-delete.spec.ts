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

async function startWorkout(page: Page) {
  await page.goto('/workout')
  await page.getByRole('button', { name: /Start Workout/i }).click()
  await expect(page.getByRole('button', { name: /Add Exercise/i })).toBeVisible()
}

async function addExercise(page: Page, muscleId: string, exerciseId: string) {
  await page.getByRole('button', { name: /Add Exercise/i }).click()
  await page.locator('select').nth(0).selectOption(muscleId)
  await page.locator('select').nth(1).selectOption(exerciseId)
  await page.getByRole('button', { name: 'Add Exercise', exact: true }).click()
  await expect(page.locator('select')).toHaveCount(0)
}

test.describe('Mobile — three-dot menu', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('three-dot menu deletes the correct exercise via confirmation dialog', async ({ page }) => {
    const { pageErrors, consoleErrors } = trackErrors(page)
    await startWorkout(page)
    await addExercise(page, 'chest', 'bench-press')
    await addExercise(page, 'chest', 'incline-bench')

    const trigger = page.getByRole('button', { name: /Actions for Bench Press/i })
    await expect(trigger).toBeVisible()
    await trigger.click()
    await page.getByRole('menuitem', { name: /Delete Exercise/i }).click()
    await expect(page.getByRole('dialog', { name: /Delete Exercise/i })).toBeVisible()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(page.getByRole('heading', { name: 'Bench Press', exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Incline Bench Press', exact: true })).toBeVisible()

    expect(pageErrors).toEqual([])
    for (const msg of consoleErrors) {
      expect.soft(msg.text()).toBe('')
    }
  })
})

test.describe('iPad (tablet) — overflow menu', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('shows the three-dot menu on each exercise card', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'chest', 'bench-press')

    await expect(page.getByRole('button', { name: /Actions for Bench Press/i })).toBeVisible()
  })
})

test.describe('Desktop — overflow menu', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('three-dot menu deletes the correct exercise via confirmation dialog', async ({ page }) => {
    const { pageErrors } = trackErrors(page)
    await startWorkout(page)
    await addExercise(page, 'chest', 'bench-press')
    await addExercise(page, 'chest', 'incline-bench')

    const trigger = page.getByRole('button', { name: /Actions for Bench Press/i })
    await expect(trigger).toBeVisible()

    await trigger.click()
    await page.getByRole('menuitem', { name: /Delete Exercise/i }).click()
    await expect(page.getByRole('dialog', { name: /Delete Exercise/i })).toBeVisible()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()

    await expect(page.getByRole('heading', { name: 'Bench Press', exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Incline Bench Press', exact: true })).toBeVisible()

    expect(pageErrors).toEqual([])
  })

  test('menu is keyboard accessible (arrows + enter + escape)', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'chest', 'bench-press')

    const trigger = page.getByRole('button', { name: /Actions for Bench Press/i })
    await trigger.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /Edit Exercise/i })).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menuitem', { name: /Delete Exercise/i })).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: /Delete Exercise/i })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})
