import { AppointmentStatus } from "../enums/appointment-status.enum";

export interface IAppointment {
  _id?: string;
  tenantId: string;
  branchId?: string;
  customerName: string;
  customerPhone?: string;
  customerTelegramId?: string;
  service: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  duration: number; // minutes
  status: AppointmentStatus;
  notes?: string;
  earnings?: number;
  aiSuggestion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimeSlot {
  time: string; // HH:mm
  available: boolean;
}

export interface ISoloProfile {
  businessType?: string;
  services?: string[];
  workingHours?: {
    [day: string]: { start: string; end: string; closed?: boolean };
  };
  slotDuration?: number; // default appointment duration in minutes
  breakBetweenSlots?: number; // minutes
  maxDailyAppointments?: number;
  address?: string;
  phone?: string;
  description?: string;
}
