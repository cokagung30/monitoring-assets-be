import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true,
    disableErrorMessages: false,
    validationError: {
      target: false,
      value: false,
    },
  }));
  
  await app.listen(process.env.PORT ?? 8080);
}

// For Vercel serverless deployment
export default async function handler(req: any, res: any) {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true,
    disableErrorMessages: false,
    validationError: {
      target: false,
      value: false,
    },
  }));

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}

// Only run bootstrap in development
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}
