import {
  BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, OptionalAuth, type AuthUser } from './auth';
import { pool } from './db';

const PROFILE_COLS = 'id, username, display_name, bio, created_at';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get('me')
  @ApiBearerAuth()
  async me(@CurrentUser() user: AuthUser) {
    const { rows } = await pool.query(`SELECT ${PROFILE_COLS} FROM users WHERE id = $1`, [user.sub]);
    return rows[0];
  }

  @Patch('me')
  @ApiBearerAuth()
  async updateMe(@CurrentUser() user: AuthUser, @Body() body: { display_name?: string; bio?: string }) {
    const displayName = body.display_name?.trim();
    const bio = body.bio?.trim();
    if (displayName !== undefined && (displayName.length < 1 || displayName.length > 50)) {
      throw new BadRequestException('Görünen ad 1-50 karakter olmalı');
    }
    if (bio !== undefined && bio.length > 500) throw new BadRequestException('Biyografi en fazla 500 karakter');
    const { rows } = await pool.query(
      `UPDATE users SET display_name = COALESCE($2, display_name), bio = COALESCE($3, bio)
       WHERE id = $1 RETURNING ${PROFILE_COLS}`,
      [user.sub, displayName ?? null, bio ?? null],
    );
    return rows[0];
  }

  @Get('me/comments')
  @ApiBearerAuth()
  async myComments(@CurrentUser() user: AuthUser) {
    const { rows } = await pool.query(
      `SELECT c.id, c.target_type, c.target_key, c.body, c.visibility, c.parent_id, c.quote_id, c.created_at
       FROM comments c WHERE c.user_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC LIMIT 200`,
      [user.sub],
    );
    return rows;
  }

  @Get(':username')
  @OptionalAuth()
  async profile(@Param('username') username: string) {
    const { rows } = await pool.query(`SELECT ${PROFILE_COLS} FROM users WHERE username = $1`, [username]);
    if (!rows[0]) throw new NotFoundException('Kullanıcı bulunamadı');
    const { rows: comments } = await pool.query(
      `SELECT c.id, c.target_type, c.target_key, c.body, c.created_at
       FROM comments c WHERE c.user_id = $1 AND c.visibility = 'public' AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC LIMIT 100`,
      [rows[0].id],
    );
    return { ...rows[0], comments };
  }
}
