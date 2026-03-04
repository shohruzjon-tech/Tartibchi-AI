import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class SendTelegramDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class TicketApproachingDto {
  @IsString()
  @IsNotEmpty()
  ticketId: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  position: number;
  estimatedWaitMinutes: number;
}
