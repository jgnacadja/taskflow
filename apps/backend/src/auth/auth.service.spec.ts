import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'
import type { Mock } from 'vitest'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'

vi.mock('bcrypt', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
  compare: vi.fn()
}))

const mockUser = {
  id: 'uuid-1',
  firstname: 'John',
  lastname: 'Doe',
  email: 'john@example.com',
  password: '$2b$10$hashedpassword',
  createdAt: new Date()
}

const mockPrisma = { user: { create: vi.fn() } }
const mockUsersService = { findByEmail: vi.fn(), findById: vi.fn() }
const mockJwtService = { signAsync: vi.fn().mockResolvedValue('signed-token') }

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService }
      ]
    }).compile()

    service = module.get(AuthService)
    vi.clearAllMocks()
    mockJwtService.signAsync.mockResolvedValue('signed-token')
  })

  describe('register', () => {
    const dto = {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      confirmEmail: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    }

    it('creates user and returns tokens', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue(mockUser)

      const result = await service.register(dto)

      expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' })
      expect(mockPrisma.user.create).toHaveBeenCalledOnce()
    })

    it('throws if emails do not match', async () => {
      await expect(service.register({ ...dto, confirmEmail: 'other@example.com' })).rejects.toThrow(
        BadRequestException
      )
    })

    it('throws if passwords do not match', async () => {
      await expect(service.register({ ...dto, confirmPassword: 'differentpass' })).rejects.toThrow(
        BadRequestException
      )
    })

    it('throws if email already taken', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser)
      await expect(service.register(dto)).rejects.toThrow(BadRequestException)
    })
  })

  describe('login', () => {
    const dto = { email: 'john@example.com', password: 'password123' }

    it('returns tokens on valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser)
      ;(bcrypt.compare as unknown as Mock).mockResolvedValue(true)

      const result = await service.login(dto)
      expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' })
    })

    it('throws if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null)
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException)
    })

    it('throws if password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser)
      ;(bcrypt.compare as unknown as Mock).mockResolvedValue(false)
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('refresh', () => {
    it('returns new tokens for a valid user', async () => {
      const result = await service.refresh(mockUser as never)
      expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' })
    })
  })
})
