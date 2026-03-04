import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RegisterBotDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  botToken: string;
}

export class UnregisterBotDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}

export class TelegramSendMessageDto {
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

export class LinkTelegramUserDto {
  @IsString()
  @IsNotEmpty()
  telegramId: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  tenantId?: string;
}
