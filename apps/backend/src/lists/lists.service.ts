import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { Prisma, List } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateListDto } from './dto/create-list.dto'

@Injectable()
export class ListsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateListDto): Promise<List> {
    try {
      return await this.prisma.list.create({ data: { name: dto.name, userId } })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Une liste avec ce nom existe déjà')
      }
      throw e
    }
  }

  findAll(userId: string): Promise<List[]> {
    return this.prisma.list.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findOne(userId: string, listId: string): Promise<List> {
    const list = await this.prisma.list.findUnique({ where: { id: listId } })
    if (!list) throw new NotFoundException('Liste introuvable')
    if (list.userId !== userId) throw new ForbiddenException('Accès refusé')
    return list
  }

  async remove(userId: string, listId: string): Promise<void> {
    await this.findOne(userId, listId)
    try {
      await this.prisma.list.delete({ where: { id: listId } })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Liste introuvable')
      }
      throw e
    }
  }
}
