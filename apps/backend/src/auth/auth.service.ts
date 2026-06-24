import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

interface TokenPair {
  accessToken: string
  refreshToken: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    if (dto.email !== dto.confirmEmail) {
      throw new BadRequestException('Les adresses email ne correspondent pas')
    }
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas')
    }

    const existing = await this.usersService.findByEmail(dto.email)
    if (existing) throw new BadRequestException('Cet email est déjà utilisé')

    const hashed = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: {
        firstname: dto.firstname,
        lastname: dto.lastname,
        email: dto.email,
        password: hashed
      }
    })

    return this.signTokens(user.id, user.email)
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(dto.email)
    if (!user) throw new UnauthorizedException('Identifiants invalides')

    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) throw new UnauthorizedException('Identifiants invalides')

    return this.signTokens(user.id, user.email)
  }

  refresh(user: User): Promise<TokenPair> {
    return this.signTokens(user.id, user.email)
  }

  private async signTokens(userId: string, email: string): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: process.env.JWT_SECRET ?? 'change-me', expiresIn: '15m' }
      ),
      this.jwtService.signAsync(
        { sub: userId },
        { secret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh', expiresIn: '7d' }
      )
    ])
    return { accessToken, refreshToken }
  }
}
