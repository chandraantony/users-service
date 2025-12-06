/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '@modules/users/users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ----------------------------------------------------------
  // CREATE USER
  // ----------------------------------------------------------
  it('should create a user', async () => {
    const dto: CreateUserDto = {
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '123',
      address: null,
      roles: [1],
    };

    const result = { id: 1, ...dto };

    mockUsersService.create.mockResolvedValue(result);

    expect(await controller.create(dto)).toEqual(result);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  // ----------------------------------------------------------
  // FIND ALL USERS
  // ----------------------------------------------------------
  it('should return paginated users', async () => {
    const result = {
      data: [{ id: 1, full_name: 'User 1' }],
      total: 1,
    };

    mockUsersService.findAll.mockResolvedValue(result);

    expect(await controller.findAll(1, 10)).toEqual(result);
    expect(service.findAll).toHaveBeenCalledWith(1, 10);
  });

  // ----------------------------------------------------------
  // FIND ONE
  // ----------------------------------------------------------
  it('should return user detail', async () => {
    const result = { id: 1, full_name: 'John' };

    mockUsersService.findOne.mockResolvedValue(result);

    expect(await controller.findOne(1, 'true', 'false')).toEqual(result);

    expect(service.findOne).toHaveBeenCalledWith(1, true, false);
  });

  // ----------------------------------------------------------
  // UPDATE USER
  // ----------------------------------------------------------
  it('should update user', async () => {
    const dto: UpdateUserDto = { full_name: 'Updated User' };
    const result = { id: 1, ...dto };

    mockUsersService.update.mockResolvedValue(result);

    expect(await controller.update(1, dto)).toEqual(result);
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  // ----------------------------------------------------------
  // DELETE USER
  // ----------------------------------------------------------
  it('should soft delete user', async () => {
    const result = { message: 'deleted' };

    mockUsersService.softDelete.mockResolvedValue(result);

    expect(await controller.softDelete(1)).toEqual(result);
    expect(service.softDelete).toHaveBeenCalledWith(1);
  });
});
