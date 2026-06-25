import { Test, TestingModule } from '@nestjs/testing'
import { List, User } from '@prisma/client'
import { CreateListDto } from './dto/create-list.dto'
import { ListsController } from './lists.controller'
import { ListsService } from './lists.service'

const USER_ID = 'user-uuid-1'
const LIST_ID = 'list-uuid-1'

const mockUser = { id: USER_ID } as User

const mockList: List = {
  id: LIST_ID,
  name: 'Ma liste',
  userId: USER_ID,
  createdAt: new Date()
}

const mockListsService = {
  create: vi.fn(),
  findAll: vi.fn(),
  remove: vi.fn()
}

describe('ListsController', () => {
  let controller: ListsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListsController],
      providers: [{ provide: ListsService, useValue: mockListsService }]
    }).compile()

    controller = module.get(ListsController)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('délègue à ListsService.create et retourne la liste créée', async () => {
      mockListsService.create.mockResolvedValue(mockList)
      const dto: CreateListDto = { name: 'Ma liste' }

      const result = await controller.create(mockUser, dto)

      expect(result).toEqual(mockList)
      expect(mockListsService.create).toHaveBeenCalledWith(USER_ID, dto)
    })
  })

  describe('findAll', () => {
    it("délègue à ListsService.findAll et retourne les listes de l'utilisateur", async () => {
      mockListsService.findAll.mockResolvedValue([mockList])

      const result = await controller.findAll(mockUser)

      expect(result).toEqual([mockList])
      expect(mockListsService.findAll).toHaveBeenCalledWith(USER_ID)
    })
  })

  describe('remove', () => {
    it("délègue à ListsService.remove avec l'id utilisateur et l'id de la liste", async () => {
      mockListsService.remove.mockResolvedValue(undefined)

      await controller.remove(mockUser, LIST_ID)

      expect(mockListsService.remove).toHaveBeenCalledWith(USER_ID, LIST_ID)
    })
  })
})
