import { test, expect, type ConsoleMessage, type Page } from '@playwright/test'

const ROUTES = [
  { path: '/', label: 'Home' },
  { path: '/muscles/chest', label: 'MusclePage' },
  { path: '/exercise/bench-press', label: 'ExercisePage' },
  { path: '/workout', label: 'WorkoutPage' },
  { path: '/body', label: 'BodyMap' },
  { path: '/measurements', label: 'BodyMeasurements' },
  { path: '/goals', label: 'Goals' },
  { path: '/weekly-goals', label: 'WeeklyGoals' },
  { path: '/records', label: 'PersonalRecords' },
  { path: '/statistics', label: 'Statistics' },
  { path: '/search', label: 'Search' },
  { path: '/settings', label: 'Settings' },
  { path: '/custom-cards', label: 'CustomCards' },
]

function trackErrors(page: Page) {
  const pageErrors: Error[] = []
  const consoleErrors: ConsoleMessage[] = []
  page.on('pageerror', err => pageErrors.push(err))
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg)
  })
  return { pageErrors, consoleErrors }
}

test('home loads with no runtime errors', async ({ page }) => {
  const { pageErrors, consoleErrors } = trackErrors(page)

  await page.goto('/')
  await expect(page.locator('nav')).toBeVisible()

  expect(pageErrors).toEqual([])
  for (const msg of consoleErrors) {
    if (!msg.text().includes('404')) {
      expect.soft(msg.text()).toBe('')
    }
  }
})

for (const route of ROUTES.slice(1)) {
  test(`${route.label} renders without crashing`, async ({ page }) => {
    const { pageErrors } = trackErrors(page)

    await page.goto(route.path)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)

    expect(pageErrors).toEqual([])
  })
}

test('PWA service worker registers', async ({ page }) => {
  await page.goto('/')
  const registered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false
    return navigator.serviceWorker
      .ready
      .then(() => true)
      .catch(() => false)
  })
  expect(registered).toBe(true)
})
