import {
  BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode,
  NotFoundException, Param, Post, Patch, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, OptionalAuth, type AuthUser } from './auth';
import { pool } from './db';
import { validateTarget, type TargetType } from './limits';
import { containsProfanity } from './wordfilter';

const TARGET_TYPES: TargetType[] = ['word', 'ayah', 'page', 'surah'];
// meParam: beğeni bilgisi için mevcut kullanıcı parametresinin ($N) konumu
const SELECT_FULL = (meParam: string) => `
  SELECT c.id, c.target_type, c.target_key, c.body, c.visibility, c.parent_id, c.quote_id,
    c.created_at, c.updated_at, u.username, u.display_name,
    (SELECT COUNT(*)::int FROM reactions r WHERE r.comment_id = c.id) AS like_count,
    EXISTS(SELECT 1 FROM reactions r WHERE r.comment_id = c.id AND r.user_id = ${meParam}) AS liked
  FROM comments c JOIN users u ON u.id = c.user_id`;
// Görünür yorum: silinmemiş + moderasyonla gizlenmemiş
const VISIBLE = "c.deleted_at IS NULL AND c.hidden_at IS NULL";

// Basit istek sınırı (Faz 4'te Redis'e taşınır): kullanıcı başına dakikada 10 yorum
const recentPosts = new Map<string, number[]>();
function checkRateLimit(sub: string): void {
  const now = Date.now();
  const times = (recentPosts.get(sub) ?? []).filter((t) => now - t < 60_000);
  if (times.length >= 10) throw new BadRequestException('Çok hızlı yorum yapıyorsunuz; biraz bekleyin');
  times.push(now);
  recentPosts.set(sub, times);
}

function parseTarget(type: string, key: string): { type: TargetType; key: string } {
  if (!TARGET_TYPES.includes(type as TargetType)) throw new BadRequestException('Geçersiz hedef tipi');
  const normalized = validateTarget(type as TargetType, key);
  if (!normalized) throw new BadRequestException('Geçersiz hedef anahtarı');
  return { type: type as TargetType, key: normalized };
}

function validateBody(text: string): string {
  const t = text.trim();
  if (t.length < 1 || t.length > 2000) throw new BadRequestException('Yorum 1-2000 karakter olmalı');
  if (containsProfanity(t)) throw new BadRequestException('Yorum uygunsuz ifade içeriyor');
  return t;
}

async function getById(id: number) {
  const { rows } = await pool.query(
    `SELECT id, user_id, target_type, target_key, parent_id, visibility FROM comments c
     WHERE id = $1 AND ${VISIBLE}`, [id],
  );
  return rows[0] ?? null;
}

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  // Sure görünümü için toplu sayım: sure + içindeki ayet/kelime hedefleri (yalnızca public)
  @Get('counts')
  @OptionalAuth()
  async counts(@Query('surah') surah?: string, @Query('page') page?: string) {
    if (surah) {
      const s = validateTarget('surah', surah);
      if (!s) throw new BadRequestException('Geçersiz sure');
      const { rows } = await pool.query(
        `SELECT target_type, target_key, COUNT(*)::int AS n FROM comments c
         WHERE ${VISIBLE} AND visibility = 'public' AND (
           (target_type = 'surah' AND target_key = $1) OR
           (target_type IN ('ayah', 'word') AND target_key LIKE $1 || ':%')
         ) GROUP BY 1, 2`,
        [s],
      );
      const out = { surah: 0, ayahs: {} as Record<string, number>, words: {} as Record<string, number> };
      for (const r of rows) {
        if (r.target_type === 'surah') out.surah = r.n;
        else if (r.target_type === 'ayah') out.ayahs[r.target_key.split(':')[1]] = r.n;
        else out.words[r.target_key] = r.n;
      }
      return out;
    }
    if (page) {
      const p = validateTarget('page', page);
      if (!p) throw new BadRequestException('Geçersiz sayfa');
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS n FROM comments c
         WHERE ${VISIBLE} AND visibility = 'public' AND target_type = 'page' AND target_key = $1`,
        [p],
      );
      return { page: rows[0].n };
    }
    throw new BadRequestException('surah veya page parametresi gerekli');
  }

  // Misafir dahil herkes okur; girişliyse kendi private yorumları da gelir
  @Get()
  @OptionalAuth()
  async list(@Query('type') type: string, @Query('key') key: string, @CurrentUser() user: AuthUser | null) {
    const t = parseTarget(type, key);
    const { rows } = await pool.query(
      `${SELECT_FULL('$3')}
       WHERE c.target_type = $1 AND c.target_key = $2 AND ${VISIBLE}
         AND (c.visibility = 'public' OR c.user_id = $3)
       ORDER BY c.created_at ASC LIMIT 200`,
      [t.type, t.key, user?.sub ?? null],
    );
    return rows;
  }

  @Post()
  @ApiBearerAuth()
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() body: {
    target_type: string; target_key: string; body: string;
    visibility?: string; parent_id?: number; quote_id?: number;
  }) {
    const t = parseTarget(body.target_type, String(body.target_key ?? ''));
    const text = validateBody(String(body.body ?? ''));
    const visibility = body.visibility ?? 'public';
    if (!['public', 'private'].includes(visibility)) throw new BadRequestException('Geçersiz görünürlük');
    checkRateLimit(user.sub);

    if (body.parent_id != null) {
      const parent = await getById(Number(body.parent_id));
      if (!parent || (parent.visibility === 'private' && parent.user_id !== user.sub)) {
        throw new NotFoundException('Yanıtlanan yorum bulunamadı');
      }
      if (parent.target_type !== t.type || parent.target_key !== t.key) {
        throw new BadRequestException('Yanıt aynı hedefte olmalı');
      }
      if (parent.parent_id != null) throw new BadRequestException('Yanıta yanıt verilemez (tek seviye)');
    }
    if (body.quote_id != null) {
      const quoted = await getById(Number(body.quote_id));
      if (!quoted || (quoted.visibility === 'private' && quoted.user_id !== user.sub)) {
        throw new NotFoundException('Alıntılanan yorum bulunamadı');
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO comments (user_id, target_type, target_key, body, visibility, parent_id, quote_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [user.sub, t.type, t.key, text, visibility, body.parent_id ?? null, body.quote_id ?? null],
    );
    const { rows: created } = await pool.query(`${SELECT_FULL('$2')} WHERE c.id = $1`, [rows[0].id, user.sub]);
    return created[0];
  }

  @Patch(':id')
  @ApiBearerAuth()
  async update(@CurrentUser() user: AuthUser, @Param('id') id: string,
    @Body() body: { body?: string; visibility?: string }) {
    const text = body.body !== undefined ? validateBody(String(body.body)) : undefined;
    if (body.visibility !== undefined && !['public', 'private'].includes(body.visibility)) {
      throw new BadRequestException('Geçersiz görünürlük');
    }
    const existing = await getById(Number(id));
    if (!existing) throw new NotFoundException('Yorum bulunamadı');
    if (existing.user_id !== user.sub) throw new ForbiddenException('Yalnızca kendi yorumunuzu düzenleyebilirsiniz');
    await pool.query(
      `UPDATE comments SET body = COALESCE($2, body), visibility = COALESCE($3, visibility), updated_at = now()
       WHERE id = $1`,
      [Number(id), text ?? null, body.visibility ?? null],
    );
    const { rows } = await pool.query(`${SELECT_FULL('$2')} WHERE c.id = $1`, [Number(id), user.sub]);
    return rows[0];
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const existing = await getById(Number(id));
    if (!existing) throw new NotFoundException('Yorum bulunamadı');
    if (existing.user_id !== user.sub) throw new ForbiddenException('Yalnızca kendi yorumunuzu silebilirsiniz');
    await pool.query('UPDATE comments SET deleted_at = now() WHERE id = $1', [Number(id)]);
  }

  // ---- Beğeni ----

  @Post(':id/like')
  @ApiBearerAuth()
  @HttpCode(200)
  async like(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const c = await getById(Number(id));
    if (!c || (c.visibility === 'private' && c.user_id !== user.sub)) throw new NotFoundException('Yorum bulunamadı');
    if (c.user_id === user.sub) throw new BadRequestException('Kendi yorumunuzu beğenemezsiniz');
    await pool.query(
      'INSERT INTO reactions (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [Number(id), user.sub],
    );
    return this.likeState(Number(id), true);
  }

  @Delete(':id/like')
  @ApiBearerAuth()
  @HttpCode(200)
  async unlike(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await pool.query('DELETE FROM reactions WHERE comment_id = $1 AND user_id = $2', [Number(id), user.sub]);
    return this.likeState(Number(id), false);
  }

  private async likeState(id: number, liked: boolean) {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM reactions WHERE comment_id = $1', [id]);
    return { likes: rows[0].n, liked };
  }

  // ---- Şikâyet ----

  @Post(':id/report')
  @ApiBearerAuth()
  @HttpCode(201)
  async report(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { reason?: string }) {
    const reason = String(body.reason ?? '').trim();
    if (reason.length < 1 || reason.length > 500) throw new BadRequestException('Gerekçe 1-500 karakter olmalı');
    const c = await getById(Number(id));
    if (!c || c.visibility === 'private') throw new NotFoundException('Yorum bulunamadı');
    await pool.query(
      `INSERT INTO reports (comment_id, reporter_id, reason) VALUES ($1, $2, $3)
       ON CONFLICT (comment_id, reporter_id) DO NOTHING`,
      [Number(id), user.sub, reason],
    );
    return { ok: true };
  }
}
