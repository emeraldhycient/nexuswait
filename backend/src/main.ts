import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('v1');
  app.use(helmet());
  app.use(urlencoded({ extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Always allow the frontend dashboard
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      if (origin === frontendUrl) return callback(null, true);
      // Allow any origin for public embed widget endpoints
      // (subscriber creation + count are public by design)
      return callback(null, true);
    },
    credentials: true,
  });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`NexusWait API running at http://localhost:${port}/v1`);
}
bootstrap();
