import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ListsService } from '../lists/lists.service'
import { PrismaService } from '../prisma/prisma.service'
import { TasksService } from './tasks.service'

const USER_ID = 'user-uuid-1'
const OTHER_USER_ID = 'user-uuid-2'
const LIST_ID = 'list-uuid-1'
const TASK_ID = 'task-uuid-1'

const mockList = { id: LIST_ID, name: 'Ma liste', userId: USER_ID, createdAt: new Date() }

const mockTask = {
  id: TASK_ID,
  shortDescription: 'Ma tâche',
  longDescription: null,
  dueDate: new Date('2026-07-15'),
  completedAt: null,
  listId: LIST_ID,
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockTaskWithList = { ...mockTask, list: mockList }

const mockPrisma = {
  task: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}

const mockListsService = { findOne: vi.fn() }
const mockEventEmitter = { emit: vi.fn() }

describe('TasksService', () => {
  let service: TasksService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ListsService, useValue: mockListsService },
        { provide: EventEmitter2, useValue: mockEventEmitter }
      ]
    }).compile()

    service = module.get(TasksService)
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('create an task item and emit  task.created', async () => {
      mockListsService.findOne.mockResolvedValue(mockList)
      mockPrisma.task.create.mockResolvedValue(mockTask)

      const result = await service.create(USER_ID, LIST_ID, {
        shortDescription: 'Ma tâche',
        dueDate: '2026-07-15T00:00:00.000Z'
      })

      expect(result).toEqual(mockTask)
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          shortDescription: 'Ma tâche',
          longDescription: null,
          dueDate: new Date('2026-07-15T00:00:00.000Z'),
          listId: LIST_ID
        }
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('task.created', {
        listId: LIST_ID,
        task: mockTask
      })
    })

    it('propagates ForbiddenException if the list belongs to another user', async () => {
      mockListsService.findOne.mockRejectedValue(new ForbiddenException())

      await expect(
        service.create(OTHER_USER_ID, LIST_ID, {
          shortDescription: 'Ma tâche',
          dueDate: '2026-07-15T00:00:00.000Z'
        })
      ).rejects.toThrow(ForbiddenException)
      expect(mockPrisma.task.create).not.toHaveBeenCalled()
    })

    it('propagates NotFoundException if the list is not found', async () => {
      mockListsService.findOne.mockRejectedValue(new NotFoundException())

      await expect(
        service.create(USER_ID, 'unknown-list', {
          shortDescription: 'Ma tâche',
          dueDate: '2026-07-15T00:00:00.000Z'
        })
      ).rejects.toThrow(NotFoundException)
      expect(mockPrisma.task.create).not.toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    it('returns all tasks in the list', async () => {
      mockListsService.findOne.mockResolvedValue(mockList)
      mockPrisma.task.findMany.mockResolvedValue([mockTask])

      const result = await service.findAll(USER_ID, LIST_ID)

      expect(result).toEqual([mockTask])
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { listId: LIST_ID },
        orderBy: { dueDate: 'asc' }
      })
    })

    it('returns an empty array if no tasks', async () => {
      mockListsService.findOne.mockResolvedValue(mockList)
      mockPrisma.task.findMany.mockResolvedValue([])

      expect(await service.findAll(USER_ID, LIST_ID)).toEqual([])
    })

    it('propagates ForbiddenException if access is denied', async () => {
      mockListsService.findOne.mockRejectedValue(new ForbiddenException())

      await expect(service.findAll(OTHER_USER_ID, LIST_ID)).rejects.toThrow(ForbiddenException)
      expect(mockPrisma.task.findMany).not.toHaveBeenCalled()
    })
  })

  describe('complete', () => {
    it('marks the task as completed and emits task.updated', async () => {
      const completed = { ...mockTask, completedAt: new Date() }
      mockPrisma.task.findUnique.mockResolvedValue(mockTaskWithList)
      mockPrisma.task.update.mockResolvedValue(completed)

      const result = await service.complete(USER_ID, TASK_ID)

      expect(result.completedAt).not.toBeNull()
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: TASK_ID },
        data: expect.objectContaining({ completedAt: expect.any(Date) })
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('task.updated', {
        listId: LIST_ID,
        task: completed
      })
    })

    it('throws NotFoundException if the task is not found', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)

      await expect(service.complete(USER_ID, 'unknown')).rejects.toThrow(NotFoundException)
      expect(mockPrisma.task.update).not.toHaveBeenCalled()
    })

    it('throws ForbiddenException if the task belongs to another user', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTaskWithList)

      await expect(service.complete(OTHER_USER_ID, TASK_ID)).rejects.toThrow(ForbiddenException)
      expect(mockPrisma.task.update).not.toHaveBeenCalled()
    })
  })

  describe('reactivate', () => {
    it('reactivates the task and emits task.updated', async () => {
      const completedTask = { ...mockTaskWithList, completedAt: new Date() }
      const reactivated = { ...mockTask, completedAt: null }
      mockPrisma.task.findUnique.mockResolvedValue(completedTask)
      mockPrisma.task.update.mockResolvedValue(reactivated)

      const result = await service.reactivate(USER_ID, TASK_ID)

      expect(result.completedAt).toBeNull()
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: TASK_ID },
        data: { completedAt: null }
      })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('task.updated', {
        listId: LIST_ID,
        task: reactivated
      })
    })

    it('throws NotFoundException if the task is not found', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)

      await expect(service.reactivate(USER_ID, 'unknown')).rejects.toThrow(NotFoundException)
      expect(mockPrisma.task.update).not.toHaveBeenCalled()
    })

    it('throws ForbiddenException if the task belongs to another user', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTaskWithList)

      await expect(service.reactivate(OTHER_USER_ID, TASK_ID)).rejects.toThrow(ForbiddenException)
      expect(mockPrisma.task.update).not.toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    it('returns the task without the list relation if the owner', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTaskWithList)

      const result = await service.findOne(USER_ID, TASK_ID)

      expect(result).toEqual(mockTask)
      expect(result).not.toHaveProperty('list')
      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id: TASK_ID },
        include: { list: true }
      })
    })

    it('throws NotFoundException if the task is not found', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)

      await expect(service.findOne(USER_ID, 'unknown')).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException if the task belongs to another user', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTaskWithList)

      await expect(service.findOne(OTHER_USER_ID, TASK_ID)).rejects.toThrow(ForbiddenException)
    })
  })

  describe('remove', () => {
    it('deletes the task and emits task.deleted', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTaskWithList)
      mockPrisma.task.delete.mockResolvedValue(mockTask)

      await service.remove(USER_ID, TASK_ID)

      expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: TASK_ID } })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('task.deleted', {
        listId: LIST_ID,
        taskId: TASK_ID
      })
    })

    it('throws NotFoundException if the task is not found', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)

      await expect(service.remove(USER_ID, 'unknown')).rejects.toThrow(NotFoundException)
      expect(mockPrisma.task.delete).not.toHaveBeenCalled()
    })

    it('throws ForbiddenException if the task belongs to another user', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTaskWithList)

      await expect(service.remove(OTHER_USER_ID, TASK_ID)).rejects.toThrow(ForbiddenException)
      expect(mockPrisma.task.delete).not.toHaveBeenCalled()
    })
  })
})
