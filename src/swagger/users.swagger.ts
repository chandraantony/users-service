import {
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiParam,
  ApiQuery,
  ApiExtraModels,
  getSchemaPath,
  PartialType,
  ApiProperty,
  ApiBody,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { User } from '@entities/user.entity';
import { Role } from '@entities/role.entity';
import { CreateUserDto } from '@modules/users/dto/create-user.dto';

class UserSchema implements CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  full_name: string;

  @ApiProperty({ example: 'john@mail.com' })
  email: string;

  @ApiProperty({ example: '08123456789', required: false })
  phone?: string;

  @ApiProperty({
    type: [Number],
    example: [1, 2],
  })
  roles: number[];

  @ApiProperty({
    required: false,
    example: {
      street: 'Jl. Merdeka',
      city: 'Jakarta',
    },
  })
  address?: any;
}

class UpdateUserSchema extends PartialType(UserSchema) {}

@ApiExtraModels(User, Role)
export class UsersSwagger {}

export function ApiCreateUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Create user' }),
    ApiBody({ type: UserSchema }),
    ApiResponse({
      status: 201,
      description: 'User created',
      schema: { $ref: getSchemaPath(User) },
    }),
    ApiBadRequestResponse({ description: 'Invalid request body' }),
    ApiConflictResponse({ description: 'Email already exists' }),
    ApiInternalServerErrorResponse({ description: 'Server error' })
  );
}

export function ApiFindAllUsers() {
  return applyDecorators(
    ApiOperation({ summary: 'Get paginated users' }),
    ApiQuery({ name: 'page', required: false }),
    ApiQuery({ name: 'limit', required: false }),
    ApiResponse({
      status: 200,
      schema: {
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(User) } },
          total: { type: 'number' },
          page: { type: 'number' },
          lastPage: { type: 'number' },
        },
      },
    }),
    ApiInternalServerErrorResponse({ description: 'Server error' })
  );
}

export function ApiFindOneUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user by id' }),
    ApiParam({ name: 'id', type: Number }),
    ApiQuery({ name: 'includeAddress', required: false }),
    ApiQuery({ name: 'includeRoles', required: false }),
    ApiResponse({
      status: 200,
      description: 'Conditional user result',
      schema: {
        oneOf: [
          { $ref: getSchemaPath(User) },
          {
            allOf: [
              { $ref: getSchemaPath(User) },
              {
                properties: {
                  address: { type: 'object' },
                  roles: {
                    type: 'array',
                    items: { $ref: getSchemaPath(Role) },
                  },
                },
              },
            ],
          },
        ],
      },
    }),
    ApiNotFoundResponse({ description: 'User not found' }),
    ApiInternalServerErrorResponse({ description: 'Server error' })
  );
}

export function ApiUpdateUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user' }),
    ApiParam({ name: 'id', type: Number }),
    ApiBody({ type: UpdateUserSchema }),
    ApiResponse({
      status: 200,
      description: 'User updated',
      schema: { $ref: getSchemaPath(User) },
    }),
    ApiBadRequestResponse({ description: 'Invalid request body' }),
    ApiNotFoundResponse({ description: 'User not found' }),
    ApiInternalServerErrorResponse({ description: 'Server error' })
  );
}

export function ApiDeleteUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Soft delete user' }),
    ApiParam({ name: 'id', type: Number }),
    ApiResponse({
      status: 200,
      schema: { example: { success: true } },
    }),
    ApiNotFoundResponse({ description: 'User not found' }),
    ApiInternalServerErrorResponse({ description: 'Server error' })
  );
}
