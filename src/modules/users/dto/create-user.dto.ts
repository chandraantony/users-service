import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ArrayMinSize,
  IsNumber,
  ValidateNested,
  IsNotEmptyObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsString()
  @IsNotEmpty({ message: 'street is required' })
  street: string;

  @IsString()
  @IsNotEmpty({ message: 'city is required' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'postalCode is required' })
  postal_code: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'full_name is required' })
  @MaxLength(150)
  full_name: string;

  @IsEmail({}, { message: 'email must be valid' })
  @IsNotEmpty({ message: 'email is required' })
  @MaxLength(100)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsArray()
  @IsOptional()
  @ArrayMinSize(1, { message: 'roleIds must contain at least one role id' })
  @IsNumber({}, { each: true, message: 'roleIds must be numbers' })
  roles?: number[];

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  @IsNotEmptyObject()
  address?: AddressDto;
}
