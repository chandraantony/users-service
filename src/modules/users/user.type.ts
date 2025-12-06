import { CreateUserDto } from './dto/create-user.dto';

export type GetUsers = {
  data: CreateUserDto[];
  total: number;
};
