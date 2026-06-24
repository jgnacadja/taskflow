import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger'
import { List, User } from '@prisma/client'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { CreateListDto } from './dto/create-list.dto'
import { ListsService } from './lists.service'

@ApiTags('lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une liste' })
  @ApiCreatedResponse({ description: 'Liste créée' })
  @ApiConflictResponse({ description: 'Nom déjà utilisé' })
  create(@CurrentUser() user: User, @Body() dto: CreateListDto): Promise<List> {
    return this.listsService.create(user.id, dto)
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer mes listes' })
  @ApiOkResponse({ description: "Listes de l'utilisateur connecté" })
  findAll(@CurrentUser() user: User): Promise<List[]> {
    return this.listsService.findAll(user.id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une liste (cascade tâches)' })
  @ApiNoContentResponse({ description: 'Liste supprimée' })
  @ApiNotFoundResponse({ description: 'Liste introuvable' })
  @ApiForbiddenResponse({ description: 'Accès refusé' })
  remove(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    return this.listsService.remove(user.id, id)
  }
}
