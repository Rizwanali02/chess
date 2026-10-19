
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { parse } from 'cookie';
import { MatchmakingService } from './matchmaking.service.js';

type SocketUser = {
  id: string;
  email: string;
  role: 'COACH' | 'STUDENT';
};

@WebSocketGateway({
  namespace: '/matchmaking',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class MatchmakingGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MatchmakingGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly matchmakingService: MatchmakingService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const cookieHeader = client.handshake.headers.cookie;

      if (!cookieHeader) {
        throw new Error('Missing authentication cookie');
      }

      const cookies = parse(cookieHeader);
      const token = cookies['auth_token'];

      if (!token) {
        throw new Error('Missing access token');
      }

      const payload = await this.jwtService.verifyAsync(token);

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        !['COACH', 'STUDENT'].includes(payload.role)
      ) {
        throw new Error('Invalid token payload');
      }

      const user: SocketUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      client.data.user = user;

      // All active tabs/devices for this user receive their events.
      await client.join(`user:${user.id}`);

      this.logger.log(`Authenticated socket for user ${user.id}`);
      client.emit('socket:ready', { userId: user.id });
    } catch {
      client.emit('socket:error', {
        message: 'Authentication failed. Please log in again.',
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as SocketUser | undefined;

    if (user) {
      this.logger.log(`Socket disconnected for user ${user.id}`);
    }
  }

  @SubscribeMessage('matchmaking:join')
  async joinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { tournamentId?: string },
  ) {
    const user = client.data.user as SocketUser | undefined;

    if (!user || user.role !== 'STUDENT') {
      throw new WsException('Authenticated students only');
    }

    if (
      typeof body?.tournamentId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.tournamentId,
      )
    ) {
      throw new WsException('Valid tournamentId is required');
    }

    const result = await this.matchmakingService.joinQueue(
      user.id,
      body.tournamentId,
    );

    if (result.status === 'MATCHED') {
      const { match } = result;

      const event = {
        matchId: match.id,
        tournamentId: match.tournamentId,
        whitePlayerId: match.whitePlayerId,
        blackPlayerId: match.blackPlayerId,
        status: match.status,
      };

      this.server.to(`user:${match.whitePlayerId}`).emit(
        'matchmaking:matched',
        event,
      );

      this.server.to(`user:${match.blackPlayerId}`).emit(
        'matchmaking:matched',
        event,
      );

      return { status: 'MATCHED', matchId: match.id };
    }

    return { status: 'QUEUED' };
  }

  @SubscribeMessage('matchmaking:leave')
  async leaveQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { tournamentId?: string },
  ) {
    const user = client.data.user as SocketUser | undefined;

    if (!user || user.role !== 'STUDENT') {
      throw new WsException('Authenticated students only');
    }

    if (
      typeof body?.tournamentId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.tournamentId,
      )
    ) {
      throw new WsException('Valid tournamentId is required');
    }

    return this.matchmakingService.leaveQueue(
      user.id,
      body.tournamentId,
    );
  }
}
