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
  await page.getByRole('button', { name: /Add Exercise/i }).click()
  await expect(page.locator('select')).toHaveCount(0)
}

async function swipeLeft(page: Page, box: { x: number; y: number; width: number }) {
  const cdp = await page.context().newCDPSession(page)
  const y = box.y + 30
  let x = box.x + box.width - 40
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  for (; x > box.x + 20; x -= 15) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

const MOBILE_VIEWPORTS: Array<[string, number, number]> = [
  ['iPhone SE', 375, 667],
  ['iPhone 14 Pro', 393, 852],
  ['Pixel 7', 412, 915],
  ['Galaxy S23', 360, 780],
]

for (const [name, width, height] of MOBILE_VIEWPORTS) {
  test.describe(`${name} — swipe-to-delete`, () => {
    test.use({ viewport: { width, height }, hasTouch: true })

    test('swipe reveals delete, confirmation removes only the correct exercise', async ({ page }) => {
      const { pageErrors, consoleErrors } = trackErrors(page)
      await startWorkout(page)
      await addExercise(page, 'chest', 'bench-press')
      await addExercise(page, 'chest', 'incline-bench')

      const surfaces = page.getByTestId('swipe-surface')
      await expect(surfaces).toHaveCount(2)
      await expect(page.getByRole('button', { name: /Actions for Bench Press/i })).toHaveCount(0)

      const box = (await surfaces.nth(0).boundingBox())!
      await swipeLeft(page, box)

      await expect(surfaces.nth(0)).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -112, 0)')

      await page.getByRole('button', { name: 'Delete exercise' }).first().click()
      await expect(page.getByRole('dialog', { name: /Delete Exercise/i })).toBeVisible()
      await page.getByRole('button', { name: 'Delete', exact: true }).click()

      await expect(surfaces).toHaveCount(1)
      await expect(page.getByRole('heading', { name: 'Incline Bench Press', exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Bench Press', exact: true })).toHaveCount(0)

      expect(pageErrors).toEqual([])
      for (const msg of consoleErrors) {
        expect.soft(msg.text()).toBe('')
      }
    })

    test('a short swipe does not reveal delete (no accidental deletion)', async ({ page }) => {
      await startWorkout(page)
      await addExercise(page, 'chest', 'bench-press')

      const surface = page.getByTestId('swipe-surface')
      const box = (await surface.boundingBox())!
      const cdp = await page.context().newCDPSession(page)
      const y = box.y + 30
      const startX = box.x + box.width - 40
      const endX = startX - 30
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y }] })
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: endX, y }] })
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })

      await expect(surface).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
      await expect(page.getByRole('button', { name: 'Delete exercise' })).toHaveCount(1)
    })
  })
}

test.describe('iPad (tablet) — overflow menu', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('shows the three-dot menu instead of swipe', async ({ page }) => {
    await startWorkout(page)
    await addExercise(page, 'chest', 'bench-press')

    await expect(page.getByTestId('swipe-surface')).toHaveCount(0)
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

    await expect(page.getByTestId('swipe-surface')).toHaveCount(0)
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
