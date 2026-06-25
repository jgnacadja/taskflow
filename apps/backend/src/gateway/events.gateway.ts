import { Logger, UsePipes, UseGuards, ValidationPipe } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { IsNotEmpty, IsString } from 'class-validator'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException
} from '@nestjs/websockets'
import { JwtService } from '@nestjs/jwt'
import { Server, Socket } from 'socket.io'
import { ListsService } from '../lists/lists.service'
import { WsJwtGuard } from './ws-jwt.guard'

class JoinPayload {
  @IsString()
  @IsNotEmpty()
  listId!: string
}

const WS_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

@WebSocketGateway({
  cors: { origin: WS_ORIGINS, credentials: true }
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Server

  private readonly logger = new Logger(EventsGateway.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly listsService: ListsService
  ) {}

  handleConnection(client: Socket): void {
    const token =
      (client.handshake.auth as Record<string, string>)?.token ??
      client.handshake.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      this.logger.warn(`[WS] connexion refusée — token manquant (${client.id})`)
      client.disconnect(true)
      return
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(token)
      client.data.user = payload
      this.logger.log(`[WS] connecté : ${payload.email} (${client.id})`)
    } catch {
      this.logger.warn(`[WS] connexion refusée — token invalide (${client.id})`)
      client.disconnect(true)
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`[WS] déconnecté : ${client.id}`)
  }

  @UseGuards(WsJwtGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @SubscribeMessage('join-list')
  async handleJoinList(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload
  ): Promise<void> {
    const userId = (client.data.user as { sub: string }).sub
    try {
      await this.listsService.findOne(userId, payload.listId)
    } catch {
      throw new WsException('Liste introuvable ou accès refusé')
    }
    client.join(`list:${payload.listId}`)
    this.logger.log(`[WS] ${client.id} a rejoint list:${payload.listId}`)
  }

  @UseGuards(WsJwtGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @SubscribeMessage('leave-list')
  handleLeaveList(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinPayload): void {
    client.leave(`list:${payload.listId}`)
    this.logger.log(`[WS] ${client.id} a quitté list:${payload.listId}`)
  }

  @OnEvent('task.created')
  onTaskCreated(payload: { listId: string; task: unknown }): void {
    this.server.to(`list:${payload.listId}`).emit('task:created', payload.task)
  }

  @OnEvent('task.updated')
  onTaskUpdated(payload: { listId: string; task: unknown }): void {
    this.server.to(`list:${payload.listId}`).emit('task:updated', payload.task)
  }

  @OnEvent('task.deleted')
  onTaskDeleted(payload: { listId: string; taskId: string }): void {
    this.server.to(`list:${payload.listId}`).emit('task:deleted', { id: payload.taskId })
  }
}
