// src/common/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    
    // Log รายละเอียดข้อผิดพลาด
    this.logger.error(`Exception on ${request.method} ${request.url}`);
    
    if (exception instanceof Error) {
      this.logger.error(`Error message: ${exception.message}`);
      this.logger.error(`Stack trace: ${exception.stack}`);
    } else {
      this.logger.error(`Unknown exception:`, exception);
    }
    
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: exception instanceof HttpException ? exception.message : 'Internal Server Error',
      details: exception instanceof Error ? exception.message : null,
    });
  }
}