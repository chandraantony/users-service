/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
};

const mockDataSource = {
  query: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // clearUserCache
  // ---------------------------------------------------------------------------
  it('should clear user cache keys', async () => {
    mockRedis.keys.mockResolvedValue(['USER_DETAIL:1:A0:R0']);
    mockRedis.del.mockResolvedValue(1);

    await service.clearUserCache(1);

    expect(mockRedis.keys).toHaveBeenCalledWith('USER_DETAIL:1:*');
    expect(mockRedis.del).toHaveBeenCalledWith('USER_DETAIL:1:A0:R0');
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  it('should create a user', async () => {
    const dto = {
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '111',
      address: { city: 'Jakarta', street: 'Pindang', postal_code: '123123' },
      roles: [1, 2],
    };

    const dbResult = [{ id: 1, ...dto }];
    mockDataSource.query.mockResolvedValue(dbResult);

    const result = await service.create(dto);

    expect(result).toEqual({
      message: 'success',
      result: dbResult,
      statusCode: 200,
    });

    expect(mockDataSource.query).toHaveBeenCalled();
  });

  it('should throw BadRequestException on create error', async () => {
    mockDataSource.query.mockRejectedValue(new Error('DB error'));

    await expect(service.create({} as any)).rejects.toThrow(BadRequestException);
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  it('should return cached user if exists', async () => {
    const cached = { id: 1, full_name: 'Cached User' };
    mockRedis.get.mockResolvedValue(JSON.stringify(cached));

    const result = await service.findOne(1, false, false);

    expect(result.result).toEqual(cached);
    expect(mockRedis.get).toHaveBeenCalled();
    expect(mockDataSource.query).not.toHaveBeenCalled();
  });

  it('should fetch user from DB if not in cache', async () => {
    mockRedis.get.mockResolvedValue(null);

    const dbUser = [{ id: 1, full_name: 'John Doe', address: {}, roles: [] }];
    mockDataSource.query.mockResolvedValue(dbUser);

    const result = await service.findOne(1, true, true);

    expect(mockDataSource.query).toHaveBeenCalled();
    expect(mockRedis.set).toHaveBeenCalled();
    expect(result.result).toEqual(dbUser[0]);
  });

  it('should throw BadRequestException if user not found', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockDataSource.query.mockResolvedValue([]);

    await expect(service.findOne(1)).rejects.toThrow(BadRequestException);
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  it('should return paginated users', async () => {
    const datas = [
      {
        data: [{ id: 1 }],
        total: 10,
      },
    ];

    mockDataSource.query.mockResolvedValue(datas);

    const result = await service.findAll(1, 10);

    expect(result.result).toEqual({
      data: [{ id: 1 }],
      total: 10,
      page: 1,
      lastPage: 1,
    });

    expect(mockDataSource.query).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  it('should update user and clear cache', async () => {
    const dbResult = [{ id: 1 }];
    mockDataSource.query.mockResolvedValue(dbResult);
    mockRedis.keys.mockResolvedValue([]);

    const result = await service.update(1, { full_name: 'Updated' } as any);

    expect(result.result).toEqual(dbResult);
    expect(mockDataSource.query).toHaveBeenCalled();
    expect(mockRedis.keys).toHaveBeenCalledWith('USER_DETAIL:1:*');
  });

  // ---------------------------------------------------------------------------
  // softDelete
  // ---------------------------------------------------------------------------
  it('should delete user and clear cache', async () => {
    const dbResult = [{ id: 1 }];
    mockDataSource.query.mockResolvedValue(dbResult);
    mockRedis.keys.mockResolvedValue([]);

    const result = await service.softDelete(1);

    expect(result.result).toEqual(dbResult[0]);
    expect(mockRedis.keys).toHaveBeenCalledWith('USER_DETAIL:1:*');
  });

  it('should throw BadRequestException if delete_user NOT found', async () => {
    mockDataSource.query.mockResolvedValue([]);
    mockRedis.keys.mockResolvedValue([]);

    await expect(service.softDelete(99)).rejects.toThrow(BadRequestException);
  });
});
