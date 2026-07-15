// Moderasyon uçları — yalnızca moderator/admin rolü (Keycloak realm rolü) erişir.
import {
  BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, Param, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from './auth';
import { pool } from './db';

function requireModerator(user: AuthUser): void {
  if (user.role !== 'moderator' && user.role !== 'admin') {
    throw new ForbiddenException('Moderatör yetkisi gerekli');
  }
}

@ApiTags('moderation')
@ApiBearerAuth()
@Controller('moderation')
export class ModerationController {
  @Get('reports')
  async reports(@CurrentUser() user: AuthUser, @Query('status') status = 'open') {
    requireModerator(user);
    if (!['open', 'resolved', 'dismissed'].includes(status)) throw new BadRequestException('Geçersiz durum');
    const { rows } = await pool.query(
      `SELECT r.id, r.reason, r.status, r.created_at,
         ru.username AS reporter_username,
         c.id AS comment_id, c.body AS comment_body, c.target_type, c.target_key,
         c.hidden_at, cu.username AS author_username, cu.display_name AS author_display_name
       FROM reports r
       JOIN comments c ON c.id = r.comment_id
       JOIN users cu ON cu.id = c.user_id
       JOIN users ru ON ru.id = r.reporter_id
       WHERE r.status = $1
       ORDER BY r.created_at ASC LIMIT 100`,
      [status],
    );
    return rows;
  }

  // Genel bakış: toplam sayılar + kullanıcı başına istatistik tablosu
  @Get('overview')
  async overview(@CurrentUser() user: AuthUser) {
    requireModerator(user);
    const totals = (await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM users) AS users,
         (SELECT COUNT(*)::int FROM comments WHERE deleted_at IS NULL) AS comments,
         (SELECT COUNT(*)::int FROM comments WHERE deleted_at IS NULL AND hidden_at IS NOT NULL) AS hidden_comments,
         (SELECT COUNT(*)::int FROM comments WHERE deleted_at IS NULL AND created_at > now() - interval '7 days') AS comments_7d,
         (SELECT COUNT(*)::int FROM reactions) AS likes,
         (SELECT COUNT(*)::int FROM reports WHERE status = 'open') AS open_reports`,
    )).rows[0];
    const { rows: users } = await pool.query(
      `SELECT u.username, u.display_name, u.created_at,
         COUNT(c.id) FILTER (WHERE c.deleted_at IS NULL)::int AS comment_count,
         COUNT(c.id) FILTER (WHERE c.deleted_at IS NULL AND c.hidden_at IS NOT NULL)::int AS hidden_count,
         MAX(c.created_at) FILTER (WHERE c.deleted_at IS NULL) AS last_comment_at,
         (SELECT COUNT(*)::int FROM reactions r JOIN comments c2 ON c2.id = r.comment_id WHERE c2.user_id = u.id) AS likes_received,
         (SELECT COUNT(*)::int FROM reports rp JOIN comments c3 ON c3.id = rp.comment_id WHERE c3.user_id = u.id) AS reports_received
       FROM users u
       LEFT JOIN comments c ON c.user_id = u.id
       GROUP BY u.id
       ORDER BY comment_count DESC, u.created_at DESC
       LIMIT 500`,
    );
    return { totals, users };
  }

  // Tüm public yorumlar (moderasyonla gizlenenler dahil; private hâşiyeler kişiseldir, listelenmez)
  @Get('comments')
  async comments(
    @CurrentUser() user: AuthUser,
    @Query('q') q?: string,
    @Query('username') username?: string,
    @Query('status') status = 'all',
    @Query('offset') offset = '0',
  ) {
    requireModerator(user);
    if (!['all', 'visible', 'hidden'].includes(status)) throw new BadRequestException('Geçersiz durum');
    const params: unknown[] = [];
    const where = ["c.deleted_at IS NULL", "c.visibility = 'public'"];
    if (status === 'visible') where.push('c.hidden_at IS NULL');
    if (status === 'hidden') where.push('c.hidden_at IS NOT NULL');
    if (q?.trim()) { params.push(`%${q.trim()}%`); where.push(`c.body ILIKE $${params.length}`); }
    if (username?.trim()) { params.push(username.trim()); where.push(`u.username = $${params.length}`); }
    params.push(Math.max(0, Number(offset) || 0));
    const { rows } = await pool.query(
      `SELECT c.id, c.target_type, c.target_key, c.body, c.created_at, c.hidden_at,
         u.username, u.display_name,
         (SELECT COUNT(*)::int FROM reactions r WHERE r.comment_id = c.id) AS like_count,
         (SELECT COUNT(*)::int FROM reports rp WHERE rp.comment_id = c.id) AS report_count
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE ${where.join(' AND ')}
       ORDER BY c.created_at DESC
       LIMIT 51 OFFSET $${params.length}`,
      params,
    );
    return { items: rows.slice(0, 50), has_more: rows.length > 50 };
  }

  // action: 'hide' → gizle, 'unhide' → geri göster, 'delete' → sil (soft delete, geri alınamaz).
  // Gizleme/silme o yorumun açık şikâyetlerini de kapatır.
  @Post('comments/:id')
  @HttpCode(200)
  async commentAction(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { action?: string }) {
    requireModerator(user);
    const action = body.action ?? '';
    if (!['hide', 'unhide', 'delete'].includes(action)) {
      throw new BadRequestException("action 'hide', 'unhide' veya 'delete' olmalı");
    }
    const cid = Number(id);
    const { rows } = await pool.query('SELECT id FROM comments WHERE id = $1 AND deleted_at IS NULL', [cid]);
    if (!rows[0]) throw new BadRequestException('Yorum bulunamadı');
    if (action === 'hide') await pool.query('UPDATE comments SET hidden_at = now() WHERE id = $1', [cid]);
    if (action === 'unhide') await pool.query('UPDATE comments SET hidden_at = NULL WHERE id = $1', [cid]);
    if (action === 'delete') await pool.query('UPDATE comments SET deleted_at = now() WHERE id = $1', [cid]);
    if (action !== 'unhide') {
      await pool.query(
        `UPDATE reports SET status = 'resolved', resolved_at = now(), resolved_by = $2
         WHERE comment_id = $1 AND status = 'open'`,
        [cid, user.sub],
      );
    }
    return { ok: true, action };
  }

  // action: 'hide' → yorum gizlenir + rapor çözülür; 'dismiss' → yalnızca rapor kapatılır
  @Post('reports/:id')
  @HttpCode(200)
  async resolve(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: { action?: string }) {
    requireModerator(user);
    if (!['hide', 'dismiss'].includes(body.action ?? '')) throw new BadRequestException("action 'hide' veya 'dismiss' olmalı");
    const { rows } = await pool.query("SELECT comment_id FROM reports WHERE id = $1 AND status = 'open'", [Number(id)]);
    if (!rows[0]) throw new BadRequestException('Açık rapor bulunamadı');
    if (body.action === 'hide') {
      await pool.query('UPDATE comments SET hidden_at = now() WHERE id = $1', [rows[0].comment_id]);
    }
    await pool.query(
      `UPDATE reports SET status = $2, resolved_at = now(), resolved_by = $3 WHERE id = $1`,
      [Number(id), body.action === 'hide' ? 'resolved' : 'dismissed', user.sub],
    );
    return { ok: true, action: body.action };
  }
}
