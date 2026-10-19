import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthService } from './auth.service.js';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(
      dto.email,
      dto.password,
    );

    const result = await this.authService.login(user);

    response.cookie('auth_token', result.authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      data: { user: result.user, authToken: result.authToken },
    };
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return {
      success: true,
      data: user,
      meta: null,
    };
  }
}