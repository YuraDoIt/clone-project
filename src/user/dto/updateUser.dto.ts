import { IsEmail, MinLength } from 'class-validator';

export class UpdateUserDto {
  readonly username: string;

  @IsEmail()
  readonly email: string;

  @MinLength(4, { message: 'min length of bio should be 4' })
  readonly bio: string;

  readonly image: string;
}
