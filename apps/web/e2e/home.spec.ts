import { expect, test } from '@playwright/test'

test('la page d’accueil charge et affiche le titre', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'TaskFlow' })).toBeVisible()
})
