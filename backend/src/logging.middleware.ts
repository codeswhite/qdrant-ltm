import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // Log request start
    console.log(`[${timestamp}] ${method} ${originalUrl} from ${ip}`);

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      
      // Log completed request
      console.log(`[${timestamp}] ${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
      
      if (statusCode >= 400) {
        console.error('Request body:', req.body);
        console.error('Response:', res.statusMessage);
      }
    });

    next();
  }
}
