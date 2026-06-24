import { UnauthorizedException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from '../../users/users.service'
import { JwtStrategy } from './jwt.strategy'

const mockUsersService = { findById: vi.fn() }

const mockUser = {
  id: 'uuid-1',
  email: 'john@example.com',
  firstname: 'John',
  lastname: 'Doe',
  password: 'hashed',
  createdAt: new Date()
}

describe('JwtStrategy', () => {
  let strategy: JwtStrategy

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy, { provide: UsersService, useValue: mockUsersService }]
    }).compile()

    strategy = module.get(JwtStrategy)
    vi.clearAllMocks()
  })

  it('returns user when found', async () => {
    mockUsersService.findById.mockResolvedValue(mockUser)

    const result = await strategy.validate({ sub: 'uuid-1', email: 'john@example.com' })

    expect(result).toBe(mockUser)
    expect(mockUsersService.findById).toHaveBeenCalledWith('uuid-1')
  })

  it('throws UnauthorizedException when user not found', async () => {
    mockUsersService.findById.mockResolvedValue(null)

    await expect(strategy.validate({ sub: 'uuid-1', email: 'john@example.com' })).rejects.toThrow(
      UnauthorizedException
    )
  })
})
