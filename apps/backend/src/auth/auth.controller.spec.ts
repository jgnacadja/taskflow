import { Test, TestingModule } from '@nestjs/testing'
import { User } from '@prisma/client'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn()
}

const mockRes = {
  cookie: vi.fn(),
  clearCookie: vi.fn()
} as never

const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' }

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }]
    }).compile()

    controller = module.get(AuthController)
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('sets refresh cookie and returns accessToken', async () => {
      mockAuthService.register.mockResolvedValue(tokens)
      const dto: RegisterDto = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        confirmEmail: 'john@example.com',
        password: 'pass1234',
        confirmPassword: 'pass1234'
      }

      const result = await controller.register(dto, mockRes)

      expect(result).toEqual({ accessToken: 'access-token' })
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        expect.any(Object)
      )
    })
  })

  describe('login', () => {
    it('sets refresh cookie and returns accessToken', async () => {
      mockAuthService.login.mockResolvedValue(tokens)
      const dto: LoginDto = { email: 'john@example.com', password: 'pass1234' }

      const result = await controller.login(dto, mockRes)

      expect(result).toEqual({ accessToken: 'access-token' })
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        expect.any(Object)
      )
    })
  })

  describe('refresh', () => {
    it('sets refresh cookie and returns accessToken', async () => {
      mockAuthService.refresh.mockResolvedValue(tokens)
      const user = { id: 'uuid-1', email: 'john@example.com' } as User

      const result = await controller.refresh(user, mockRes)

      expect(result).toEqual({ accessToken: 'access-token' })
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        expect.any(Object)
      )
    })
  })

  describe('logout', () => {
    it('clears refresh cookie and returns message', () => {
      const result = controller.logout(mockRes)

      expect(result).toEqual({ message: 'Déconnecté' })
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object))
    })
  })
})
