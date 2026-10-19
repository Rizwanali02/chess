
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { parse } from 'cookie';
import { MatchesService } from './matches.service.js';
import { Interval } from '@nestjs/schedule';

type SocketUser = {
    id: string;
    email: string;
    role: 'COACH' | 'STUDENT';
};

@WebSocketGateway({
    namespace: '/matches',
    cors: {
        origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
        credentials: true,
    },
})
export class MatchesGateway implements OnGatewayConnection {
    private readonly logger = new Logger(MatchesGateway.name);

    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly matchesService: MatchesService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const cookieHeader = client.handshake.headers.cookie;

            if (!cookieHeader) throw new Error('Missing cookie');

            const token = parse(cookieHeader).auth_token;

            if (!token) throw new Error('Missing access token');

            const payload = await this.jwtService.verifyAsync(token);

            if (
                typeof payload.sub !== 'string' ||
                typeof payload.email !== 'string' ||
                !['COACH', 'STUDENT'].includes(payload.role)
            ) {
                throw new Error('Invalid token');
            }

            client.data.user = {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
            } satisfies SocketUser;

            await client.join(`user:${payload.sub}`);

            client.emit('socket:ready', { userId: payload.sub });
        } catch {
            client.disconnect(true);
        }
    }

    @SubscribeMessage('match:join')
    async joinMatch(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { matchId?: string },
    ) {
        const user = client.data.user as SocketUser | undefined;

        if (!user) throw new WsException('Authentication required');

        if (
            typeof body?.matchId !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                body.matchId,
            )
        ) {
            throw new WsException('Valid matchId is required');
        }

        const state = await this.matchesService.getMatch(
            body.matchId,
            user.id,
        );

        await client.join(`match:${body.matchId}`);

        client.emit('match:state', state);

        return { status: 'JOINED', matchId: body.matchId };
    }

    @SubscribeMessage('move:submit')
    async submitMove(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        body: {
            matchId?: string;
            from?: string;
            to?: string;
            promotion?: 'q' | 'r' | 'b' | 'n';
        },
    ) {
        const user = client.data.user as SocketUser | undefined;

        if (!user) throw new WsException('Authentication required');

        if (
            typeof body?.matchId !== 'string' ||
            typeof body.from !== 'string' ||
            typeof body.to !== 'string'
        ) {
            throw new WsException('matchId, from and to are required');
        }

        const result = await this.matchesService.submitMove(
            body.matchId,
            user.id,
            {
                from: body.from,
                to: body.to,
                promotion: body.promotion,
            },
        );

        if (result.status === 'COMPLETED') {
            this.server.to(`match:${body.matchId}`).emit('match:finished', {
                matchId: body.matchId,
                result: result.result,
                reason: result.reason ?? 'GAME_OVER',
                fen: result.fen,
                pgn: result.pgn,
            });
        } else {
            this.server.to(`match:${body.matchId}`).emit('move:accepted', result);
        }
        return { status: 'ACCEPTED', matchId: body.matchId };
    }


    @Interval(1000)
    async syncClocks() {
        const completed = await this.matchesService.processExpiredClocks();

        for (const match of completed) {
            this.server.to(`match:${match.matchId}`).emit('match:finished', {
                matchId: match.matchId,
                result: match.result,
                reason: 'TIMEOUT',
            });
        }

    }


    @SubscribeMessage('match:resign')
    async resignMatch(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { matchId?: string },
    ) {
        const user = client.data.user as SocketUser | undefined;

        if (!user) {
            throw new WsException('Authentication required');
        }

        if (
            typeof body?.matchId !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                body.matchId,
            )
        ) {
            throw new WsException('Valid matchId is required');
        }

        const result = await this.matchesService.resignMatch(
            body.matchId,
            user.id,
        );

        this.server
            .to(`match:${body.matchId}`)
            .emit('match:finished', result);

        return result;
    }

}
