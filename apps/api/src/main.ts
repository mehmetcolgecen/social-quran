import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  app.enableCors({ origin: true, credentials: false });

  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Sosyal Kur’an API')
      .setDescription('Yorum ve profil servisleri — Kur’an içeriği apps/web tarafından servis edilir')
      .setVersion('0.1')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('docs', app, doc);

  await app.listen(config.port);
  console.log(`API hazır: http://localhost:${config.port} (OpenAPI: /docs) — OIDC issuer: ${config.oidcIssuer}`);
}

void bootstrap();
