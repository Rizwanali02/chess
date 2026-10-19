import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

import type { AuthUser } from '../decorators/current-user.decorator.js';

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

interface JwtPayload {
  sub: string;
  email: string;
  role: 'COACH' | 'STUDENT';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const response = http.getResponse<Response>();

    const token = request.cookies?.['auth_token'];

    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(token);

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        !['COACH', 'STUDENT'].includes(payload.role)
      ) {
        throw new UnauthorizedException('Invalid token payload');
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch {
      response.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}