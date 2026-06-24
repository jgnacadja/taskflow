import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateListDto {
  @ApiProperty({ example: 'Projets perso' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string
}
