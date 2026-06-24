import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstname!: string

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastname!: string

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  confirmEmail!: string

  @ApiProperty({ example: 'StrongPass1!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string

  @ApiProperty({ example: 'StrongPass1!' })
  @IsString()
  @IsNotEmpty()
  confirmPassword!: string
}
