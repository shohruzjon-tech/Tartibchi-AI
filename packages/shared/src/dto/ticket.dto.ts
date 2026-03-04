import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  queueId: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerTelegramId?: string;

  @IsNumber()
  @IsOptional()
  priority?: number;
}

export class TicketStatusDto {
  @IsString()
  @IsNotEmpty()
  publicId: string;
}
