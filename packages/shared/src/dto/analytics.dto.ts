import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { TicketEventType } from "../enums/ticket-event-type.enum";

export class RecordEventDto {
  @IsString()
  @IsNotEmpty()
  ticketId: string;

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
  counterId?: string;

  @IsString()
  @IsOptional()
  staffId?: string;

  type: TicketEventType;

  metadata?: Record<string, any>;
}

export class DateRangeQueryDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}

export class QueueStatsQueryDto extends DateRangeQueryDto {
  @IsString()
  @IsOptional()
  queueId?: string;
}

export class CounterStatsQueryDto extends DateRangeQueryDto {
  @IsString()
  @IsOptional()
  counterId?: string;
}
