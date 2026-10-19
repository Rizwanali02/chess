import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

import { DatabaseService } from '../../database/database.service.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { users } from '../../database/schema/users.schema.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser> {
    const normalizedEmail = email.trim().toLowerCase();

    const [user] = await this.database.db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async login(user: AuthUser) {
    const authToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      authToken,
      user,
    };
  }
}