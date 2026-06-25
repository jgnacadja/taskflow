import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Prisma, Task } from '@prisma/client'
import { ListsService } from '../lists/lists.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTaskDto } from './dto/create-task.dto'

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly listsService: ListsService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(userId: string, listId: string, dto: CreateTaskDto): Promise<Task> {
    await this.listsService.findOne(userId, listId)
    try {
      const task = await this.prisma.task.create({
        data: {
          shortDescription: dto.shortDescription,
          longDescription: dto.longDescription ?? null,
          dueDate: new Date(dto.dueDate),
          listId
        }
      })
      this.eventEmitter.emit('task.created', { listId, task })
      return task
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new NotFoundException('Liste introuvable')
      }
      throw e
    }
  }

  async findAll(userId: string, listId: string): Promise<Task[]> {
    await this.listsService.findOne(userId, listId)
    return this.prisma.task.findMany({
      where: { listId },
      orderBy: { dueDate: 'asc' }
    })
  }

  async complete(userId: string, taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { list: true }
    })
    if (!task) throw new NotFoundException('Tâche introuvable')
    if (task.list.userId !== userId) throw new ForbiddenException('Accès refusé')
    try {
      const updated = await this.prisma.task.update({
        where: { id: taskId },
        data: { completedAt: new Date() }
      })
      this.eventEmitter.emit('task.updated', { listId: task.listId, task: updated })
      return updated
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Tâche introuvable')
      }
      throw e
    }
  }

  async reactivate(userId: string, taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { list: true }
    })
    if (!task) throw new NotFoundException('Tâche introuvable')
    if (task.list.userId !== userId) throw new ForbiddenException('Accès refusé')
    try {
      const updated = await this.prisma.task.update({
        where: { id: taskId },
        data: { completedAt: null }
      })
      this.eventEmitter.emit('task.updated', { listId: task.listId, task: updated })
      return updated
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Tâche introuvable')
      }
      throw e
    }
  }
}
