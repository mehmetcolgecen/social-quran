import {
  BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode,
  NotFoundException, Param, Post, Patch, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, OptionalAuth, type AuthUser } from './auth';
import { pool } from './db';
import { validateTarget, type TargetType } from './limits';

const TARGET_TYPES: TargetType[] = ['word', 'ayah', 'page', 'surah'];
const AUTHOR_JOIN = `SELECT c.id, c.target_type, c.target_key, c.body, c.visibility, c.parent_id, c.quote_id,
  c.created_at, c.updated_at, u.username, u.display_name
  FROM comments c JOIN users u ON u.id = c.user_id`;

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
        `SELECT target_type, target_key, COUNT(*)::int AS n FROM comments
         WHERE deleted_at IS NULL AND visibility = 'public' AND (
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
        `SELECT COUNT(*)::int AS n FROM comments
         WHERE deleted_at IS NULL AND visibility = 'public' AND target_type = 'page' AND target_key = $1`,
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
      `${AUTHOR_JOIN}
       WHERE c.target_type = $1 AND c.target_key = $2 AND c.deleted_at IS NULL
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
    const text = String(body.body ?? '').trim();
    if (text.length < 1 || text.length > 2000) throw new BadRequestException('Yorum 1-2000 karakter olmalı');
    const visibility = body.visibility ?? 'public';
    if (!['public', 'private'].includes(visibility)) throw new BadRequestException('Geçersiz görünürlük');
    checkRateLimit(user.sub);

    if (body.parent_id != null) {
      const { rows } = await pool.query(
        'SELECT target_type, target_key, parent_id, visibility, user_id FROM comments WHERE id = $1 AND deleted_at IS NULL',
        [body.parent_id],
      );
      const parent = rows[0];
      if (!parent || (parent.visibility === 'private' && parent.user_id !== user.sub)) {
        throw new NotFoundException('Yanıtlanan yorum bulunamadı');
      }
      if (parent.target_type !== t.type || parent.target_key !== t.key) {
        throw new BadRequestException('Yanıt aynı hedefte olmalı');
      }
      if (parent.parent_id != null) throw new BadRequestException('Yanıta yanıt verilemez (tek seviye)');
    }
    if (body.quote_id != null) {
      const { rows } = await pool.query(
        'SELECT visibility, user_id FROM comments WHERE id = $1 AND deleted_at IS NULL',
        [body.quote_id],
      );
      if (!rows[0] || (rows[0].visibility === 'private' && rows[0].user_id !== user.sub)) {
        throw new NotFoundException('Alıntılanan yorum bulunamadı');
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO comments (user_id, target_type, target_key, body, visibility, parent_id, quote_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [user.sub, t.type, t.key, text, visibility, body.parent_id ?? null, body.quote_id ?? null],
    );
    const { rows: created } = await pool.query(`${AUTHOR_JOIN} WHERE c.id = $1`, [rows[0].id]);
    return created[0];
  }

  @Patch(':id')
  @ApiBearerAuth()
  async update(@CurrentUser() user: AuthUser, @Param('id') id: string,
    @Body() body: { body?: string; visibility?: string }) {
    const text = body.body?.trim();
    if (text !== undefined && (text.length < 1 || text.length > 2000)) {
      throw new BadRequestException('Yorum 1-2000 karakter olmalı');
    }
    if (body.visibility !== undefined && !['public', 'private'].includes(body.visibility)) {
      throw new BadRequestException('Geçersiz görünürlük');
    }
    const { rows } = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1 AND deleted_at IS NULL', [Number(id)],
    );
    if (!rows[0]) throw new NotFoundException('Yorum bulunamadı');
    if (rows[0].user_id !== user.sub) throw new ForbiddenException('Yalnızca kendi yorumunuzu düzenleyebilirsiniz');
    const { rows: updated } = await pool.query(
      `UPDATE comments SET body = COALESCE($2, body), visibility = COALESCE($3, visibility), updated_at = now()
       WHERE id = $1 RETURNING id`,
      [Number(id), text ?? null, body.visibility ?? null],
    );
    const { rows: full } = await pool.query(`${AUTHOR_JOIN} WHERE c.id = $1`, [updated[0].id]);
    return full[0];
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const { rows } = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1 AND deleted_at IS NULL', [Number(id)],
    );
    if (!rows[0]) throw new NotFoundException('Yorum bulunamadı');
    if (rows[0].user_id !== user.sub) throw new ForbiddenException('Yalnızca kendi yorumunuzu silebilirsiniz');
    await pool.query('UPDATE comments SET deleted_at = now() WHERE id = $1', [Number(id)]);
  }
}
