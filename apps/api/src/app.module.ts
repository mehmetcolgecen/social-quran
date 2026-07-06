import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, Public } from './auth';
import { CommentsController } from './comments';
import { ModerationController } from './moderation';
import { UsersController } from './users';
import { Controller, Get } from '@nestjs/common';

@Controller()
class HealthController {
  @Get('health')
  @Public()
  health() {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [HealthController, UsersController, CommentsController, ModerationController],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
