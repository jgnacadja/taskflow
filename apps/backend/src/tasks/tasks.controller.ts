import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger'
import { Task, User } from '@prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { CreateTaskDto } from './dto/create-task.dto'
import { TasksService } from './tasks.service'

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('lists/:listId/tasks')
  @ApiOperation({ summary: 'Créer une tâche dans une liste' })
  @ApiCreatedResponse({ description: 'Tâche créée' })
  @ApiForbiddenResponse({ description: 'Accès refusé' })
  @ApiNotFoundResponse({ description: 'Liste introuvable' })
  create(
    @CurrentUser() user: User,
    @Param('listId') listId: string,
    @Body() dto: CreateTaskDto
  ): Promise<Task> {
    return this.tasksService.create(user.id, listId, dto)
  }

  @Get('lists/:listId/tasks')
  @ApiOperation({ summary: "Lister les tâches d'une liste" })
  @ApiOkResponse({ description: 'Tâches de la liste' })
  @ApiForbiddenResponse({ description: 'Accès refusé' })
  @ApiNotFoundResponse({ description: 'Liste introuvable' })
  findAll(@CurrentUser() user: User, @Param('listId') listId: string): Promise<Task[]> {
    return this.tasksService.findAll(user.id, listId)
  }

  @Patch('tasks/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marquer une tâche comme terminée' })
  @ApiOkResponse({ description: 'Tâche terminée' })
  @ApiForbiddenResponse({ description: 'Accès refusé' })
  @ApiNotFoundResponse({ description: 'Tâche introuvable' })
  complete(@CurrentUser() user: User, @Param('id') id: string): Promise<Task> {
    return this.tasksService.complete(user.id, id)
  }

  @Patch('tasks/:id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réactiver une tâche terminée' })
  @ApiOkResponse({ description: 'Tâche réactivée' })
  @ApiForbiddenResponse({ description: 'Accès refusé' })
  @ApiNotFoundResponse({ description: 'Tâche introuvable' })
  reactivate(@CurrentUser() user: User, @Param('id') id: string): Promise<Task> {
    return this.tasksService.reactivate(user.id, id)
  }
}
