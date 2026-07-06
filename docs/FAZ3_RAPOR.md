# Faz 3 Raporu — Sosyal Etkileşim (2026-07-06)

**Sonuç: TAMAMLANDI ✅** — GOAL.md kabul kriteri: "Beğeni eşiği geçince profil rozeti oluşur" → **e2e 46/46 geçti** (Faz 2 senaryoları dahil, regresyon yok).

## Ne eklendi

### Beğeni & Yıldız/Ödül Sistemi
- `reactions` tablosu; `POST/DELETE /comments/:id/like` (idempotent). Kendi yorumunu beğenme engelli (yıldız farming'e karşı).
- Yorum listelerinde `like_count` + `liked`; web'de ♥ düğmesi (girişsiz salt görüntüleme).
- **Yıldız eşikleri:** 1 / 10 / 50 / 200 / 1000 beğeni → 1-5 ★ (`apps/api/src/stars.ts`). Yalnızca görünür public yorumların beğenileri sayılır.
- Profilde: ★ göstergesi + toplam beğeni + **en beğenilen 3 yorum** (GOAL: "yorumu çok like alanların profilinde bu bilgiler gözükecek").

### Moderasyon
- **Şikâyet:** `POST /comments/:id/report` (gerekçeli, kullanıcı+yorum başına tek); web'de "Bildir" düğmesi.
- **Moderatör paneli** (`/moderasyon`): açık şikâyetler; "Yorumu gizle" (hidden_at — soft delete'ten ayrı, iz kalır) / "Şikâyeti reddet". Gizlenen yorum tüm listelerden/sayımlardan düşer; sahibi profilinde "moderasyon tarafından gizlendi" görür.
- **Roller Keycloak formatında:** JWT `realm_access.roles` claim'inden okunur (dev issuer aynı formatı üretir; giriş formunda dev-only rol seçimi). Moderasyon uçları 401/403 korumalı.
- **Kelime filtresi:** TR/EN token-bazlı dar küfür listesi; eşleşen yorum 400 (yanlış pozitif riskine karşı bilinçli dar; prod'da genişletilebilir — `wordfilter.ts`).

### UX
- Ayet rozetinde **hover önizleme**: 300ms bekleyip ilk 2 yorumu tooltip'te gösterir (önbellekli) — GOAL'deki "rakam + hover'da belirginleşme" artık içerik önizlemesiyle.

## Kanıtlar (e2e — `npm run -w apps/api test:e2e`)
```
Beğeni & yıldız: kendi yorumu 400 ✓ · beğeni 200 ✓ · idempotent ✓ · like_count/liked ✓
  KABUL: eşik geçilince profil yıldızı ✓ (stars=1, likes=1) · en beğenilenler ✓ · geri alma ✓
Kelime filtresi: küfürlü yorum 400 ✓
Moderasyon: misafir 401 ✓ · üye 403 ✓ · şikâyet 201 ✓ · moderatör görür ✓
  gizleme ✓ · misafir listesinde yok ✓ · sahibi 'gizlendi' görür ✓
Faz 2 regresyonu: 31/31 hâlâ geçiyor ✓  |  tsc: api + web temiz
```

## Notlar / sonraya kalanlar
- Bildirimler (yanıt/beğeni bildirimi) kapsam dışı bırakıldı — Faz 4 sonrası polish adayı.
- Rol ataması prod'da Keycloak realm rollerinden gelir; dev issuer'daki rol seçimi yalnızca yerel geliştirme içindir.
- `users.role` kolonu şemada hazır (DB-tabanlı atama istenirse) ama etkin rol şu an token claim'inden okunuyor.
- Beğeni sayıları anlık sorgulanıyor; ölçek gerektirirse Faz 4'te Redis cache/materialized sayaç.

**Sıradaki:** Faz 4 — K3S production deploy (Helm/manifests, CNPG, Redis, Keycloak, Traefik + cert-manager, CI/CD).
