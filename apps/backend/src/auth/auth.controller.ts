import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { User } from '@prisma/client'
import { Response } from 'express'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtRefreshGuard } from './guards/jwt-refresh.guard'

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un compte' })
  @ApiOkResponse({ schema: { properties: { accessToken: { type: 'string' } } } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = await this.authService.register(dto)
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS)
    return { accessToken }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter' })
  @ApiOkResponse({ schema: { properties: { accessToken: { type: 'string' } } } })
  @ApiUnauthorizedResponse({ description: 'Identifiants invalides' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = await this.authService.login(dto)
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS)
    return { accessToken }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: "Renouveler le token d'accès" })
  @ApiOkResponse({ schema: { properties: { accessToken: { type: 'string' } } } })
  async refresh(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } = await this.authService.refresh(user)
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS)
    return { accessToken }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se déconnecter' })
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    })
    return { message: 'Déconnecté' }
  }
}
