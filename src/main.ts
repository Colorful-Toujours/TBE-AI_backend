import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
    exposedHeaders: ['Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
    setupSwagger(app);
  }

  const port = Number(process.env.PORT ?? 8888);
  await app.listen(port);
  console.info(`AI Ledger API listening on http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
    console.info(`Swagger UI: http://localhost:${port}/docs`);
  }
}

bootstrap().catch((error) => {
  console.error('Nest application failed to start:', error);
  process.exit(1);
});
