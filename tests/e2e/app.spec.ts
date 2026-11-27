import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Win = { __map: { getCenter(): { lng: number }; project(ll: [number, number]): { x: number; y: number }; loaded(): boolean; isMoving(): boolean } };

async function open(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Top 10 mondial' })).toBeVisible();
}
async function waitGlobe(page: Page) {
  await page.waitForFunction(() => (window as unknown as Win).__map?.loaded());
}
const left = (page: Page) => page.getByRole('complementary', { name: 'Classement des besoins' });
const sheet = (page: Page) => page.getByRole('complementary', { name: 'Fiche du besoin' });
const rows = (page: Page) => left(page).locator('.need-row');

test('mention démo visible, aucun indicateur LIVE', async ({ page }) => {
  await open(page);
  await expect(page.getByText('DÉMO : données fictives')).toBeVisible();
  await expect(page.getByText(/\bLIVE\b/i)).toHaveCount(0);
});

test('top 10 mondial puis liste complète sans toucher au globe', async ({ page }) => {
  await open(page);
  await expect(rows(page)).toHaveCount(10);
  await left(page).getByRole('button', { name: /Voir les 22 autres besoins/ }).click();
  await expect(rows(page)).toHaveCount(32);
});

test('les chiffres de la liste et de la fiche concordent', async ({ page }) => {
  await open(page);
  const first = rows(page).first();
  const score = (await first.locator('.score-pill').textContent())!.match(/\d+/)![0];
  const volume = (await first.locator('.need-meta').textContent())!.split(' demandes')[0].trim();
  await first.click();
  const fiche = sheet(page);
  await expect(fiche.locator('.kpi-value').first()).toContainText(score);
  await expect(fiche.locator('.kpi-value').nth(1)).toHaveText(volume);
  await expect(fiche.getByText(/somme des contributions/i)).toBeVisible();
  await expect(fiche.locator('.fictif').first()).toHaveText('Fictif');
});

test('choisir un pays met à jour la liste et la fiche', async ({ page }) => {
  await open(page);
  await left(page).getByRole('button', { name: 'Japon', exact: true }).click();
  await expect(left(page).getByRole('heading', { name: 'Top 10 · Japon' })).toBeVisible();
  const first = rows(page).first();
  const volume = (await first.locator('.need-meta').textContent())!.split(' demandes')[0].trim();
  await first.click();
  await expect(sheet(page).getByText('Zone : Japon')).toBeVisible();
  await expect(sheet(page).locator('.kpi-value').nth(1)).toHaveText(volume);
});

test('filtres catégorie et période', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Catégorie :/ }).click();
  await page.getByRole('option', { name: 'Santé' }).click();
  await expect(rows(page)).toHaveCount(4);
  await expect(left(page).getByText('30 derniers jours · Santé')).toBeVisible();
  await page.getByRole('group', { name: 'Période analysée' }).getByRole('button', { name: '7 j' }).click();
  await expect(left(page).getByText('7 derniers jours · Santé')).toBeVisible();
  await rows(page).first().click();
  await expect(sheet(page).getByText('Demandes (7 j)')).toBeVisible();
  await expect(page.locator('.legend-title')).toHaveText('Demandes pour ce besoin (7 j)');
});

test('recherche d’un besoin et d’un pays sans données', async ({ page }) => {
  await open(page);
  const search = page.getByRole('combobox', { name: 'Rechercher un besoin ou un pays' });
  await search.fill('devis');
  await page.keyboard.press('Enter');
  await expect(sheet(page).getByRole('heading', { name: 'Comparer des devis de travaux' })).toBeVisible();
  await page.keyboard.press('Control+k');
  await expect(search).toBeFocused();
  await search.fill('canada');
  await page.getByRole('option', { name: /Canada/ }).click();
  await expect(left(page).getByText('Données insuffisantes pour Canada')).toBeVisible();
});

test('globe : survol, clic et arrêt de la rotation', async ({ page }) => {
  await open(page);
  await waitGlobe(page);
  const lng1 = await page.evaluate(() => (window as unknown as Win).__map.getCenter().lng);
  await page.waitForTimeout(1500);
  const lng2 = await page.evaluate(() => (window as unknown as Win).__map.getCenter().lng);
  expect(Math.abs(lng2 - lng1)).toBeGreaterThan(0.5); // rotation automatique

  // Première interaction : la rotation s'arrête
  const box = (await page.locator('.globe').boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(300);
  const lng3 = await page.evaluate(() => (window as unknown as Win).__map.getCenter().lng);
  await page.waitForTimeout(1200);
  const lng4 = await page.evaluate(() => (window as unknown as Win).__map.getCenter().lng);
  expect(Math.abs(lng4 - lng3)).toBeLessThan(0.01);

  // Survol de la France
  await page.getByRole('button', { name: 'Vue monde' }).click();
  await page.waitForFunction(() => !(window as unknown as Win).__map.isMoving());
  const fr = await page.evaluate(() => (window as unknown as Win).__map.project([2.4, 46.6]));
  await page.mouse.move(box.x + fr.x, box.y + fr.y);
  const tip = page.locator('.tooltip');
  await expect(tip).toContainText('France');
  await expect(tip).toContainText('demandes sur 30 jours');
  await expect(tip).toContainText('Besoin le plus demandé');

  // Clic : top 10 du pays
  await page.mouse.click(box.x + fr.x, box.y + fr.y);
  await expect(left(page).getByRole('heading', { name: 'Top 10 · France' })).toBeVisible();
  await page.getByRole('button', { name: 'Vue monde' }).click();
  await expect(left(page).getByRole('heading', { name: 'Top 10 mondial' })).toBeVisible();
});

test('prefers-reduced-motion : pas de rotation automatique', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  await open(page);
  await waitGlobe(page);
  const a = await page.evaluate(() => (window as unknown as Win).__map.getCenter().lng);
  await page.waitForTimeout(1500);
  const b = await page.evaluate(() => (window as unknown as Win).__map.getCenter().lng);
  expect(a).toBe(b);
  await ctx.close();
});

test('WebGL indisponible : message clair et liste utilisable', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error surcharge de test
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      return type.startsWith('webgl') ? null : orig.call(this, type, ...(rest as []));
    };
  });
  await open(page);
  await expect(page.getByText('Le globe 3D ne peut pas s’afficher')).toBeVisible();
  await rows(page).first().click();
  await expect(sheet(page).getByText('Détail du score')).toBeVisible();
});

test('accessibilité : aucune violation axe', async ({ page }) => {
  await open(page);
  await waitGlobe(page);
  let r = await new AxeBuilder({ page: page as never }).exclude('.maplibregl-canvas').analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  await rows(page).first().click();
  r = await new AxeBuilder({ page: page as never }).exclude('.maplibregl-canvas').analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
});

test('mobile : la fiche s’ouvre en feuille et se ferme', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await open(page);
  await expect(page.getByText('DÉMO : données fictives')).toBeVisible();
  await rows(page).first().click();
  const fiche = sheet(page);
  await expect(fiche).toHaveClass(/open/);
  await fiche.getByRole('button', { name: 'Fermer la fiche' }).click();
  await expect(fiche).not.toHaveClass(/open/);
  await ctx.close();
});
