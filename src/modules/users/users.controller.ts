/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { UsersService } from '@modules/users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreateUser,
  ApiFindAllUsers,
  ApiFindOneUser,
  ApiUpdateUser,
  ApiDeleteUser,
} from '@swagger/users.swagger';

@ApiTags('Users')
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiCreateUser()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiFindAllUsers()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.usersService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiFindOneUser()
  findOne(
    @Param('id') id: number,
    @Query('includeAddress') includeAddress?: string,
    @Query('includeRoles') includeRoles?: string
  ) {
    return this.usersService.findOne(id, includeAddress === 'true', includeRoles === 'true');
  }

  @Put(':id')
  @ApiUpdateUser()
  update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiDeleteUser()
  softDelete(@Param('id') id: number) {
    return this.usersService.softDelete(id);
  }
}
