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
