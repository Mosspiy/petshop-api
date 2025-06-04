import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';

@Catch(BadRequestException) //  จับเฉพาะ BadRequestException จาก ValidationPipe
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const validationErrors = exception.getResponse() as any;

    if (request.file) {
      const filePath = `./uploads/${request.file.filename}`;
      fs.unlink(filePath, () => {});
    }

    response.status(400).json({
      statusCode: 400,
      message: validationErrors.message || validationErrors,
      error: 'Bad Request',
    });
  }
}
