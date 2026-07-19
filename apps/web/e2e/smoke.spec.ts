// Duman testleri: ana akışlar her deploy öncesi ayakta mı?
// Ses çalma test edilmez (CI'da mp3 yok); DOM/etkileşim düzeyinde doğrulama yapılır.
import { expect, test } from '@playwright/test';

test('ana sayfa: 114 sure kartı ve marka', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.brand')).toContainText('Sosyal Kur’an');
  await expect(page.locator('.surah-card')).toHaveCount(114);
  await expect(page.locator('.ogren-hero')).toBeVisible();
});

test('sure görünümü: Arapça kelimeler ve meal', async ({ page }) => {
  await page.goto('/sure/1');
  await expect(page.locator('.w .ar').first()).toBeVisible();
  expect(await page.locator('.w .ar').count()).toBeGreaterThan(20);
  await expect(page.locator('.meta')).toContainText('Fâtiha');
});

test('sayfa görünümü: navigasyon ve üst bar düğmeleri', async ({ page }) => {
  await page.goto('/sayfa/1');
  await expect(page.locator('.nav b').first()).toContainText('1 / 604');
  // Okuyucu düğme grubu üst bardaki yuvaya portallanır
  await expect(page.locator('#header-orta .reader-head')).toBeVisible();
  await expect(page.locator('#header-orta')).toContainText('Dinle');
});

test('ayarlar çekmecesi: imla anahtarı metni değiştirir', async ({ page }) => {
  await page.goto('/sure/1');
  // 1:4'ün ilk kelimesi iki imlâda farklıdır: مَالِكِ (Türkiye) ↔ مَـٰلِكِ (Medine)
  const firstWord = page.locator('#ayet-1-4 .w .ar').first();
  const imlaei = await firstWord.textContent();
  await page.locator('.hmenu-btn').click();
  // İmlâ seçicisini etikete göre bul
  const drawer = page.locator('.hmenu-drawer');
  await expect(drawer).toBeVisible();
  const select = drawer.locator('label:has(.hset-label:text-is("İmlâ")) select');
  await select.selectOption('medine');
  await expect(firstWord).not.toHaveText(imlaei ?? '');
  await select.selectOption('turkiye');
  await expect(firstWord).toHaveText(imlaei ?? '');
});

test('öğren: alfabe tablosu 28 harf ve çini çerçeve', async ({ page }) => {
  await page.goto('/ogren');
  await expect(page.locator('.alfabe-harf')).toHaveCount(28);
  await expect(page.locator('.ogren-frame')).toBeVisible();
  await expect(page.locator('.ogren-band')).toBeVisible();
});

test('dil anahtarı: EN seçince arayüz İngilizceye döner', async ({ page }) => {
  await page.goto('/');
  await page.locator('.lang-select').selectOption('en');
  await expect(page.locator('.brand')).toContainText('Social Quran');
  await expect(page.locator('.ogren-hero')).toContainText('Learn');
});

test('arama sayfası açılır', async ({ page }) => {
  await page.goto('/ara?q=rahmet');
  await expect(page.locator('main')).toBeVisible();
});
