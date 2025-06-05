import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as session from 'express-session';
import { ReviewsModule } from './reviews/reviews.module';

async function bootstrap() {
  // Load .env ก่อนที่จะสร้าง app
  dotenv.config();
  
  const logger = new Logger('Bootstrap');
  logger.log('Environment variables:');
  logger.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
  logger.log(`- JWT_SECRET exists: ${!!process.env.JWT_SECRET}`);
  
  const app = await NestFactory.create(AppModule);
  
  // เพิ่ม session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 3600000, // 1 hour
        secure: process.env.NODE_ENV === 'production', // ใช้ HTTPS ในโหมด production
      }
    })
  );
  
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  logger.log('Starting application with full logging');
  await app.listen(3000);
}
bootstrap();
