import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { WsException } from '@nestjs/websockets'
import { Socket } from 'socket.io'

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient<Socket>()
    const token =
      (client.handshake.auth as Record<string, string>)?.token ??
      client.handshake.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      client.disconnect(true)
      throw new WsException('Token manquant')
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(token, {
        secret: process.env.JWT_SECRET ?? 'change-me'
      })
      client.data.user = payload
      return true
    } catch {
      client.disconnect(true)
      throw new WsException('Token invalide')
    }
  }
}
