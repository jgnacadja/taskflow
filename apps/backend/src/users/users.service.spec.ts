import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from './users.service'

const mockUser = {
  id: 'uuid-1',
  firstname: 'John',
  lastname: 'Doe',
  email: 'john@example.com',
  password: 'hashed',
  createdAt: new Date()
}

const mockPrisma = {
  user: {
    findUnique: vi.fn()
  }
}

describe('UsersService', () => {
  let service: UsersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }]
    }).compile()

    service = module.get(UsersService)
    vi.clearAllMocks()
  })

  describe('findById', () => {
    it('returns user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      expect(await service.findById('uuid-1')).toEqual(mockUser)
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'uuid-1' } })
    })

    it('returns null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      expect(await service.findById('unknown')).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      expect(await service.findByEmail('john@example.com')).toEqual(mockUser)
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' }
      })
    })

    it('returns null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      expect(await service.findByEmail('unknown@example.com')).toBeNull()
    })
  })
})
