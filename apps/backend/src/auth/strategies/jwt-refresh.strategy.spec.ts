import { UnauthorizedException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from '../../users/users.service'
import { JwtRefreshStrategy } from './jwt-refresh.strategy'

const mockUsersService = { findById: vi.fn() }

const mockUser = {
  id: 'uuid-1',
  email: 'john@example.com',
  firstname: 'John',
  lastname: 'Doe',
  password: 'hashed',
  createdAt: new Date()
}

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtRefreshStrategy, { provide: UsersService, useValue: mockUsersService }]
    }).compile()

    strategy = module.get(JwtRefreshStrategy)
    vi.clearAllMocks()
  })

  it('returns user when found', async () => {
    mockUsersService.findById.mockResolvedValue(mockUser)

    const result = await strategy.validate({ sub: 'uuid-1' })

    expect(result).toBe(mockUser)
    expect(mockUsersService.findById).toHaveBeenCalledWith('uuid-1')
  })

  it('throws UnauthorizedException when user not found', async () => {
    mockUsersService.findById.mockResolvedValue(null)

    await expect(strategy.validate({ sub: 'uuid-1' })).rejects.toThrow(UnauthorizedException)
  })
})
