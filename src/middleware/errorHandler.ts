import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Log error
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: request.url,
    method: request.method,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return void reply.code(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Handle Fastify errors
  if ('statusCode' in error) {
    const statusCode = (error as FastifyError).statusCode || 500;
    return void reply.code(statusCode).send({
      success: false,
      error: {
        code: error.code || 'ERROR',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Handle generic errors
  return void reply.code(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    timestamp: new Date().toISOString(),
  });
}
