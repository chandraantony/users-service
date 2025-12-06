import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsers } from './user.type';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class UsersService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,

    private readonly dataSource: DataSource
  ) {}

  async clearUserCache(userId: number): Promise<void> {
    const pattern = `USER_DETAIL:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return;
    await this.redis.del(...keys);
  }

  makeResponse<T>(message: string, data: T | null = null) {
    return {
      message,
      result: data,
      statusCode: 200,
    };
  }

  async create(dto: CreateUserDto) {
    try {
      const data = await this.dataSource.query<CreateUserDto[]>(
        `CALL create_user($1, $2, $3, $4, $5, NULL, NULL, NULL)`,
        [
          dto.full_name,
          dto.email,
          dto.phone,
          JSON.stringify(dto.address),
          dto.roles ? `{${dto.roles.join(',')}}` : null,
        ]
      );

      return this.makeResponse('success', data);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Unexpected database error');
    }
  }

  async findOne(id: number, includeAddress = false, includeRoles = false) {
    const key = `USER_DETAIL:${id}:A${includeAddress ? 1 : 0}:R${includeRoles ? 1 : 0}`;
    try {
      const cached = await this.redis.get(key);
      if (cached) return this.makeResponse('success', JSON.parse(cached));

      const result = await this.dataSource.query<CreateUserDto[]>(
        `CALL get_user($1, $2, $3, NULL, NULL, NULL, NULL, NULL, NULL )`,
        [id, includeAddress, includeRoles]
      );

      if (!includeAddress) delete result[0].address;
      if (!includeRoles) delete result[0].roles;

      if (!result || !result[0]) throw new Error('User not found');

      const user = result[0];

      if (!includeAddress) delete user.address;
      if (!includeRoles) delete user.roles;

      await this.redis.set(key, JSON.stringify(user), 'EX', 60);

      return this.makeResponse('success', user);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Unexpected database error');
    }
  }

  async findAll(page = 1, limit = 10) {
    try {
      const datas = await this.dataSource.query<GetUsers[]>(`CALL get_users($1, $2, NULL, NULL)`, [
        page,
        limit,
      ]);
      const { data, total } = datas[0];
      const result = {
        data,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
      return this.makeResponse('success', result);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Unexpected database error');
    }
  }

  async update(id: number, dto: UpdateUserDto) {
    try {
      const data = await this.dataSource.query<CreateUserDto[]>(
        `CALL update_user($1, $2, $3, $4, $5, $6)`,
        [
          id,
          dto.full_name,
          dto.email,
          dto.phone,
          dto.address ? JSON.stringify(dto.address) : null,
          dto.roles ? `{${dto.roles.join(',')}}` : null,
        ]
      );

      await this.clearUserCache(id);

      return this.makeResponse('success', data);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Unexpected database error');
    }
  }

  async softDelete(id: number) {
    try {
      const result = await this.dataSource.query<CreateUserDto[]>(
        `CALL delete_user($1, NULL, NULL, NULL, NULL)`,
        [id]
      );

      await this.clearUserCache(id);

      if (result && result[0]) return this.makeResponse('success', result[0]);
      else throw new Error('User not found');
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Unexpected database error');
    }
  }
}
