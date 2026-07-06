# Faz 2 Raporu — Auth & Yorum Sistemi (2026-07-06)

**Sonuç: TAMAMLANDI ✅** — GOAL.md kabul kriteri: "Misafir okur, üye yazar; e2e test geçer" → **31/31 e2e testi geçti.**

## Mimari kararlar

**Keycloak konumlandırması:** Bu makinede docker olmadığından Keycloak yerelde çalıştırılamıyor. API ve web **standart OIDC** (discovery + authorization code + PKCE + JWKS imza doğrulaması) konuşur; yerelde aynı uçları sunan minik bir dev issuer (`packages/devstack/scripts/dev-oidc.mjs`) kullanılır. Prod'da `OIDC_ISSUER` env'i Keycloak realm URL'ine çevrilir — **kod değişikliği sıfır**. Keycloak pod'u Faz 4'te K3S ile gelir.

**Veritabanı:** `embedded-postgres` ile **gerçek PostgreSQL 18** kullanıcı alanında çalışır (root/docker gerekmez, port 5433). Sosyal şema (`users`, `comments`) prod CNPG'ye migrasyon dosyasıyla birebir taşınır.

**Hedef doğrulama:** Kur'an verisi değişmez olduğundan sure/ayet/kelime limitleri statik dosyadan yüklenir (`target-limits.json`, build-db üretir) — API'nin Kur'an DB'sine bağımlılığı yok.

**Token güvenliği:** Access token tarayıcıya sızmaz; şifreli httpOnly çerezde (jose A256GCM) durur, `/api/social` proxy'si Bearer'ı sunucu tarafında ekler.

## Bileşenler

| Bileşen | İçerik |
|---|---|
| `apps/api` (NestJS, :4000) | OIDC JWT guard (JWKS), JIT kullanıcı, yorum CRUD, sayımlar, profiller, OpenAPI `/docs`, dakikada 10 yorum rate limit |
| `packages/devstack` | Embedded PG (:5433) + migrasyonlar; dev OIDC issuer (:7788) |
| `apps/web` | Login/callback/logout/me route'ları, session, proxy, yorum rozetleri + panel + form, profil sayfaları |

## Özellik durumu (GOAL gereksinimleri)

- ✅ Misafir her şeyi okur; yorum + profil için login (kabul kriterinin kendisi)
- ✅ 4 hedef tipi: kelime (`2:255:3`), ayet (`2:255`), sayfa (`42`), sure (`2`) — geçersiz hedefler 400
- ✅ Public/private görünürlük: private yalnızca sahibine görünür (misafir, diğer üye, public profil hiçbirinde sızmaz)
- ✅ Yanıt (tek seviye) + alıntı; başkasının private'ı alıntılanamaz
- ✅ Rakam rozetleri: ayet yanında soluk sayı (kelime yorumları dahil), hover'da belirginleşir; "Yorumlar" ayarıyla tamamen kapanır
- ✅ Panel: ayetten açılınca kelime seçici (ayetin tamamı / n. kelime); düzenle/sil yalnızca sahibinde
- ✅ Profil: görünen ad + biyografi düzenleme, kendi yorumları (private dahil); public profil `/kullanici/[username]`

## Kanıtlar

```
e2e (npm run -w apps/api test:e2e): 31 geçti, 0 kaldı
  misafir: okur ✓, 401 yazamaz ✓ | üye: 201 yazar ✓ (4 hedef tipi)
  geçersiz hedefler 400 ✓ | private görünürlük 4 senaryoda sızdırmaz ✓
  yanıt/alıntı ✓ | sahiplik 403 ✓ | sayımlar yansır ✓ | JIT profil ✓

Web akışı (curl, çerez kavanozu):
  /api/auth/login → issuer authorize → callback → /sure/2 (session çerezi) ✓
  /api/auth/me → kullanıcı ✓ | proxy POST yorum → 201 ✓ | misafir okur ✓
  /sure/1 SSR: 7 ayet rozeti ✓ | /kullanici/demo_kullanici: public yorum görünür ✓
  tsc --noEmit: temiz (web + api)
```

## Bilinen sınırlar / Faz 3+
- Beğeni, yıldız/rozet, bildirim, moderasyon → Faz 3 (şema `parent_id/quote_id` ile hazır).
- Hover'da yorum önizleme tooltip'i → Faz 3 polish (şimdilik hover belirginleştirme + panel).
- Refresh token yok; oturum access token ömrü kadar (1 saat) — Keycloak entegrasyonunda ele alınacak.
- Rate limit bellek-içi; Faz 4'te Redis'e taşınır.
- Kelime rozetleri ayet rozetine toplanır (77k ayrı rozet DOM'u şişirirdi); kelime hedefi panel seçicisinden.

**Dev yığını komutları:** `npm run -w packages/devstack db` + `oidc` + `npm run dev -w apps/api` + `npm run dev -w apps/web`

**Sıradaki:** Faz 3 — beğeni, yıldız/ödül sistemi, alıntı zenginleştirme, moderasyon.
