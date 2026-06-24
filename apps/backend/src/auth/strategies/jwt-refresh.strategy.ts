import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { User } from '@prisma/client'
import { Request } from 'express'
import { Strategy } from 'passport-jwt'
import { UsersService } from '../../users/users.service'

interface JwtRefreshPayload {
  sub: string
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: (req: Request) => req.cookies?.refresh_token ?? null,
      secretOrKey: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
      ignoreExpiration: false,
      passReqToCallback: false
    })
  }

  async validate(payload: JwtRefreshPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub)
    if (!user) throw new UnauthorizedException()
    return user
  }
}
