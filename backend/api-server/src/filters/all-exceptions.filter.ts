import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | object;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : exceptionResponse;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      this.logger.error(
        `[AllExceptionsFilter] Unexpected error:`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    // Log the error details
    this.logger.error(
      `[AllExceptionsFilter] ${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
    );

    // Sanitize error messages for production
    const sanitizeMessage = (msg: string | object): string => {
      // Don't expose internal details, stack traces, or sensitive information
      const sensitivePatterns = [
        /stack:/gi,
        /at \w+\./gi,
        /\/src\//gi,
        /node_modules/gi,
        /undefined/gi,
        /null/gi,
        /Column.*error/gi,
        /SQL/gi,
        /duplicate/gi,
        /constraint/gi,
      ];

      let sanitizedMsg = typeof msg === 'string' ? msg : JSON.stringify(msg);
      
      // For production, use generic messages
      if (process.env.NODE_ENV !== 'production') {
        return sanitizedMsg;
      }

      // Check if message contains sensitive information
      for (const pattern of sensitivePatterns) {
        if (pattern.test(sanitizedMsg)) {
          return 'An error occurred. Please try again.';
        }
      }

      // Map common errors to user-friendly messages
      const errorMappings: Record<string, string> = {
        'invalid credentials': 'Invalid email or password',
        'email or password': 'Invalid email or password',
        'user not found': 'User not found',
        'email already registered': 'Email already registered',
        'phone already registered': 'Phone number already registered',
        'unauthorized': 'You are not authorized to perform this action',
        'forbidden': 'Access denied',
        'validation failed': 'Please check your input and try again',
        'duplicate entry': 'This record already exists',
        'unique constraint': 'This value already exists',
        'not found': 'Resource not found',
        'bad request': 'Invalid request',
      };

      const lowerMsg = sanitizedMsg.toLowerCase();
      for (const [key, value] of Object.entries(errorMappings)) {
        if (lowerMsg.includes(key)) {
          return value;
        }
      }

      return 'An error occurred. Please try again.';
    };

    // Return the sanitized error message
    const sanitizedMessage = sanitizeMessage(message);
    
    const errorResponse =
      process.env.NODE_ENV !== 'production'
        ? {
            statusCode: status,
            message: sanitizedMessage,
            timestamp: new Date().toISOString(),
            path: request.url,
          }
        : {
            statusCode: status,
            message: sanitizedMessage,
          };

    response.status(status).json(errorResponse);
  }
}
