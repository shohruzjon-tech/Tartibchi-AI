import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { QueueStrategy } from "../enums/queue-strategy.enum";

export class CreateQueueDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  prefix: string;

  @IsEnum(QueueStrategy)
  @IsOptional()
  strategy?: QueueStrategy;
}

export class UpdateQueueDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  prefix?: string;

  @IsEnum(QueueStrategy)
  @IsOptional()
  strategy?: QueueStrategy;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
