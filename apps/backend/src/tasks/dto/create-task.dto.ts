import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateTaskDto {
  @ApiProperty({ example: 'Rédiger le rapport' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  shortDescription!: string

  @ApiPropertyOptional({ example: 'Inclure les graphiques du T3' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  longDescription?: string

  @ApiProperty({ example: '2026-07-15T00:00:00.000Z' })
  @IsISO8601()
  dueDate!: string
}
