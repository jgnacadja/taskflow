import { Test, TestingModule } from '@nestjs/testing'
import { Task, User } from '@prisma/client'
import { CreateTaskDto } from './dto/create-task.dto'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'

const USER_ID = 'user-uuid-1'
const LIST_ID = 'list-uuid-1'
const TASK_ID = 'task-uuid-1'

const mockUser = { id: USER_ID } as User

const mockTask: Task = {
  id: TASK_ID,
  shortDescription: 'Ma tâche',
  longDescription: null,
  dueDate: new Date('2026-07-15'),
  completedAt: null,
  listId: LIST_ID,
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockTasksService = {
  create: vi.fn(),
  findAll: vi.fn(),
  complete: vi.fn(),
  reactivate: vi.fn()
}

describe('TasksController', () => {
  let controller: TasksController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasksService }]
    }).compile()

    controller = module.get(TasksController)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('délègue à TasksService.create avec userId, listId et dto', async () => {
      mockTasksService.create.mockResolvedValue(mockTask)
      const dto: CreateTaskDto = {
        shortDescription: 'Ma tâche',
        dueDate: '2026-07-15T00:00:00.000Z'
      }

      const result = await controller.create(mockUser, LIST_ID, dto)

      expect(result).toEqual(mockTask)
      expect(mockTasksService.create).toHaveBeenCalledWith(USER_ID, LIST_ID, dto)
    })
  })

  describe('findAll', () => {
    it('délègue à TasksService.findAll avec userId et listId', async () => {
      mockTasksService.findAll.mockResolvedValue([mockTask])

      const result = await controller.findAll(mockUser, LIST_ID)

      expect(result).toEqual([mockTask])
      expect(mockTasksService.findAll).toHaveBeenCalledWith(USER_ID, LIST_ID)
    })
  })

  describe('complete', () => {
    it('délègue à TasksService.complete avec userId et taskId', async () => {
      const completed = { ...mockTask, completedAt: new Date() }
      mockTasksService.complete.mockResolvedValue(completed)

      const result = await controller.complete(mockUser, TASK_ID)

      expect(result).toEqual(completed)
      expect(mockTasksService.complete).toHaveBeenCalledWith(USER_ID, TASK_ID)
    })
  })

  describe('reactivate', () => {
    it('délègue à TasksService.reactivate avec userId et taskId', async () => {
      mockTasksService.reactivate.mockResolvedValue(mockTask)

      const result = await controller.reactivate(mockUser, TASK_ID)

      expect(result).toEqual(mockTask)
      expect(mockTasksService.reactivate).toHaveBeenCalledWith(USER_ID, TASK_ID)
    })
  })
})
