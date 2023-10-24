import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';
import { UserResponseInterface } from './types/userResponse.interface';
import { UserService } from './user.service';
import { Request, Response } from 'express';
import { UserDecorator } from './decorators/user.decorator';
import { UserEntity } from './user.entity';
import { AuthGuard } from './guards/auth.guard';
import { UpdateUserDto } from './dto/updateUser.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('registration')
  @UsePipes(new ValidationPipe())
  async createUser(
    @Body('user') createUserDto: CreateUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.creteUser(createUserDto);
    return this.userService.buildUserResponse(user);
  }

  @Post('login')
  @UsePipes(new ValidationPipe())
  async loginUser(
    @Body('user') loginUserDto: LoginUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.loginUser(loginUserDto);
    return this.userService.buildUserResponse(user);
  }

  @Get('user')
  @UseGuards(AuthGuard)
  async currentUser(
    // @Req() request: ExpressRequestInterface,
    @UserDecorator() user: UserEntity,
    @UserDecorator('id') currentUserId: number,
  ): Promise<UserResponseInterface> {
    // console.log('request', request.user);
    console.log(currentUserId);
    return this.userService.buildUserResponse(user);
  }

  @Put('update')
  @UseGuards(AuthGuard)
  async updateUser(
    @UserDecorator('id') currentUserId: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseInterface> {
    // console.log(currentUserId);
    const userCurrent = await this.userService.changeUser(
      currentUserId,
      updateUserDto,
    );
    return this.userService.buildUserResponse(userCurrent);
  }
}
