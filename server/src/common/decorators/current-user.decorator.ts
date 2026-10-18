import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  role: 'COACH' | 'STUDENT';
}

type AuthenticatedRequest = Request & {
  user: AuthUser;
};

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthUser => {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  },
);