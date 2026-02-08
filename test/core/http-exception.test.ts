import { expect, test, describe } from 'bun:test';
import {
  HttpException,
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  Conflict,
  TooManyRequests,
  InternalServerError,
} from '../../src/core/http-exception';

describe('HttpException', () => {
  test('should create HttpException with message and status', () => {
    const error = new HttpException('Test error', 400);
    expect(error.message).toBe('Test error');
    expect(error.status).toBe(400);
    expect(error.name).toBe('HttpException');
    expect(error.data).toBeUndefined();
  });

  test('should create HttpException with optional data', () => {
    const error = new HttpException('Validation failed', 422, {
      field: 'email',
      reason: 'invalid format',
    });
    expect(error.status).toBe(422);
    expect(error.data).toEqual({ field: 'email', reason: 'invalid format' });
  });

  test('should default status to 500', () => {
    const error = new HttpException('Server error');
    expect(error.status).toBe(500);
  });

  test('toJSON should return correct structure', () => {
    const error = new HttpException('Not found', 404, { id: 123 });
    const json = error.toJSON();
    expect(json).toEqual({
      error: 'HttpException',
      message: 'Not found',
      status: 404,
      data: { id: 123 },
    });
  });

  test('toJSON without data should not include data key', () => {
    const error = new HttpException('Bad request', 400);
    const json = error.toJSON();
    expect(json).toEqual({
      error: 'HttpException',
      message: 'Bad request',
      status: 400,
    });
    expect('data' in json).toBe(false);
  });

  test('toResponse should return valid Response', async () => {
    const error = new HttpException('Forbidden', 403);
    const response = error.toResponse();
    expect(response.status).toBe(403);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    const body = await response.json();
    expect(body.message).toBe('Forbidden');
  });
});

describe('HttpException Factory Functions', () => {
  test('BadRequest creates 400 error', () => {
    const error = BadRequest('Invalid input');
    expect(error.status).toBe(400);
    expect(error.message).toBe('Invalid input');
  });

  test('Unauthorized creates 401 error', () => {
    const error = Unauthorized();
    expect(error.status).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });

  test('Forbidden creates 403 error', () => {
    const error = Forbidden('Access denied');
    expect(error.status).toBe(403);
  });

  test('NotFound creates 404 error', () => {
    const error = NotFound('User not found', { userId: 123 });
    expect(error.status).toBe(404);
    expect(error.data).toEqual({ userId: 123 });
  });

  test('Conflict creates 409 error', () => {
    const error = Conflict('Resource already exists');
    expect(error.status).toBe(409);
  });

  test('TooManyRequests creates 429 error', () => {
    const error = TooManyRequests();
    expect(error.status).toBe(429);
  });

  test('InternalServerError creates 500 error', () => {
    const error = InternalServerError('Database connection failed');
    expect(error.status).toBe(500);
  });
});
