import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { ListsService } from './lists.service'

const USER_ID = 'user-uuid-1'
const OTHER_USER_ID = 'user-uuid-2'
const LIST_ID = 'list-uuid-1'

const mockList = {
  id: LIST_ID,
  name: 'Ma liste',
  userId: USER_ID,
  createdAt: new Date()
}

const mockPrisma = {
  list: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn()
  }
}

function makePrismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('mock', { code, clientVersion: '6.0.0' })
}

describe('ListsService', () => {
  let service: ListsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ListsService, { provide: PrismaService, useValue: mockPrisma }]
    }).compile()

    service = module.get(ListsService)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('crée une liste quand le nom est unique', async () => {
      mockPrisma.list.create.mockResolvedValue(mockList)

      const result = await service.create(USER_ID, { name: 'Ma liste' })

      expect(result).toEqual(mockList)
      expect(mockPrisma.list.create).toHaveBeenCalledWith({
        data: { name: 'Ma liste', userId: USER_ID }
      })
    })

    it('lève ConflictException sur violation P2002 (doublon)', async () => {
      mockPrisma.list.create.mockRejectedValue(makePrismaError('P2002'))

      await expect(service.create(USER_ID, { name: 'Ma liste' })).rejects.toThrow(ConflictException)
    })

    it('relaie les autres erreurs Prisma telles quelles', async () => {
      const err = makePrismaError('P2003')
      mockPrisma.list.create.mockRejectedValue(err)

      await expect(service.create(USER_ID, { name: 'Ma liste' })).rejects.toBe(err)
    })
  })

  describe('findAll', () => {
    it("retourne toutes les listes de l'utilisateur", async () => {
      mockPrisma.list.findMany.mockResolvedValue([mockList])

      const result = await service.findAll(USER_ID)

      expect(result).toEqual([mockList])
      expect(mockPrisma.list.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        orderBy: { createdAt: 'desc' }
      })
    })

    it('retourne un tableau vide si aucune liste', async () => {
      mockPrisma.list.findMany.mockResolvedValue([])

      expect(await service.findAll(USER_ID)).toEqual([])
    })
  })

  describe('findOne', () => {
    it("retourne la liste si elle appartient à l'utilisateur", async () => {
      mockPrisma.list.findUnique.mockResolvedValue(mockList)

      const result = await service.findOne(USER_ID, LIST_ID)

      expect(result).toEqual(mockList)
    })

    it("lève NotFoundException si la liste n'existe pas", async () => {
      mockPrisma.list.findUnique.mockResolvedValue(null)

      await expect(service.findOne(USER_ID, 'unknown')).rejects.toThrow(NotFoundException)
    })

    it('lève ForbiddenException si la liste appartient à un autre utilisateur', async () => {
      mockPrisma.list.findUnique.mockResolvedValue(mockList)

      await expect(service.findOne(OTHER_USER_ID, LIST_ID)).rejects.toThrow(ForbiddenException)
    })
  })

  describe('remove', () => {
    it("supprime la liste si l'utilisateur en est propriétaire", async () => {
      mockPrisma.list.findUnique.mockResolvedValue(mockList)
      mockPrisma.list.delete.mockResolvedValue(mockList)

      await service.remove(USER_ID, LIST_ID)

      expect(mockPrisma.list.delete).toHaveBeenCalledWith({ where: { id: LIST_ID } })
    })

    it("lève NotFoundException si la liste n'existe pas", async () => {
      mockPrisma.list.findUnique.mockResolvedValue(null)

      await expect(service.remove(USER_ID, 'unknown')).rejects.toThrow(NotFoundException)
      expect(mockPrisma.list.delete).not.toHaveBeenCalled()
    })

    it("lève ForbiddenException si l'utilisateur n'est pas propriétaire", async () => {
      mockPrisma.list.findUnique.mockResolvedValue(mockList)

      await expect(service.remove(OTHER_USER_ID, LIST_ID)).rejects.toThrow(ForbiddenException)
      expect(mockPrisma.list.delete).not.toHaveBeenCalled()
    })

    it('lève NotFoundException sur P2025 (suppression concurrente)', async () => {
      mockPrisma.list.findUnique.mockResolvedValue(mockList)
      mockPrisma.list.delete.mockRejectedValue(makePrismaError('P2025'))

      await expect(service.remove(USER_ID, LIST_ID)).rejects.toThrow(NotFoundException)
    })

    it('relaie les autres erreurs Prisma telles quelles', async () => {
      mockPrisma.list.findUnique.mockResolvedValue(mockList)
      const err = makePrismaError('P2003')
      mockPrisma.list.delete.mockRejectedValue(err)

      await expect(service.remove(USER_ID, LIST_ID)).rejects.toBe(err)
    })
  })
})
