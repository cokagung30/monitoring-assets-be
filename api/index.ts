import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// Cached app instance for serverless
let cachedApp: express.Express;

// Serverless handler for Vercel
export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
    
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
    cachedApp = expressApp;
  }
  
  cachedApp(req, res);
}