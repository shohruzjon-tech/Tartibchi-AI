import * as yup from "yup";

// ─── Auth Schemas ────────────────────────────────────────────────────
export const phoneSchema = yup.object({
  phone: yup
    .string()
    .required("validation.phoneRequired")
    .matches(/^\+998\d{9}$/, "validation.phoneInvalid"),
});

export const otpSchema = yup.object({
  code: yup
    .string()
    .required("validation.otpRequired")
    .length(6, "validation.otpLength"),
});

export const registerSchema = yup.object({
  firstName: yup
    .string()
    .required("validation.firstNameRequired")
    .min(2, "validation.nameMin"),
  lastName: yup
    .string()
    .required("validation.lastNameRequired")
    .min(2, "validation.nameMin"),
  phone: yup
    .string()
    .required("validation.phoneRequired")
    .matches(/^\+998\d{9}$/, "validation.phoneInvalid"),
  businessName: yup
    .string()
    .required("validation.businessNameRequired")
    .min(2, "validation.nameMin"),
  email: yup.string().optional().email("validation.emailInvalid"),
});

export const staffLoginSchema = yup.object({
  login: yup.string().required("validation.loginRequired"),
  passcode: yup
    .string()
    .required("validation.passcodeRequired")
    .min(4, "validation.passcodeMin"),
});

// ─── Branch Schemas ──────────────────────────────────────────────────
export const branchSchema = yup.object({
  name: yup
    .string()
    .required("validation.nameRequired")
    .min(2, "validation.nameMin")
    .max(100, "validation.nameMax"),
  slug: yup
    .string()
    .required("validation.slugRequired")
    .matches(/^[a-z0-9-]+$/, "validation.slugFormat")
    .min(2, "validation.slugMin")
    .max(60, "validation.slugMax"),
  address: yup
    .string()
    .required("validation.addressRequired")
    .min(3, "validation.addressMin"),
  phone: yup.string().optional().default("+998"),
  email: yup.string().optional().email("validation.emailInvalid"),
  timezone: yup
    .string()
    .required("validation.timezoneRequired")
    .default("Asia/Tashkent"),
  workingHours: yup.string().optional().default("09:00 - 18:00"),
  maxDailyTickets: yup.number().min(0).default(0),
  avgTimePerClient: yup.number().min(1).max(120).default(15),
});

// ─── Queue/Service Schemas ───────────────────────────────────────────
export const queueSchema = yup.object({
  name: yup
    .string()
    .required("validation.nameRequired")
    .min(2, "validation.nameMin"),
  prefix: yup
    .string()
    .required("validation.prefixRequired")
    .max(5, "validation.prefixMax"),
  strategy: yup.string().oneOf(["FIFO", "PRIORITY"]).default("FIFO"),
  branchId: yup.string().required("validation.branchRequired"),
});

// ─── Counter Schemas ─────────────────────────────────────────────────
export const counterSchema = yup.object({
  name: yup
    .string()
    .required("validation.nameRequired")
    .min(2, "validation.nameMin"),
  employeeId: yup.string().required("validation.employeeRequired"),
  queueIds: yup
    .array()
    .of(yup.string().required())
    .min(1, "validation.queueRequired"),
  counterNumber: yup.number().optional(),
  description: yup.string().optional(),
  languages: yup.array().of(yup.string().required()).optional(),
});

// ─── Employee Schemas ────────────────────────────────────────────────
export const employeeSchema = yup.object({
  firstName: yup
    .string()
    .required("validation.firstNameRequired")
    .min(2, "validation.nameMin"),
  lastName: yup
    .string()
    .required("validation.lastNameRequired")
    .min(2, "validation.nameMin"),
  phone: yup.string().required("validation.phoneRequired"),
  email: yup.string().optional().email("validation.emailInvalid"),
  role: yup
    .string()
    .oneOf(["BRANCH_MANAGER", "STAFF"])
    .required("validation.roleRequired"),
  branchId: yup.string().required("validation.branchRequired"),
});

// ─── Customer Schemas ────────────────────────────────────────────────
export const customerSchema = yup.object({
  firstName: yup
    .string()
    .required("validation.firstNameRequired")
    .min(2, "validation.nameMin"),
  lastName: yup.string().optional(),
  phone: yup.string().required("validation.phoneRequired"),
  email: yup.string().optional().email("validation.emailInvalid"),
  notes: yup.string().optional(),
});

// ─── Appointment Schemas ─────────────────────────────────────────────
export const appointmentSchema = yup.object({
  customerName: yup.string().required("validation.nameRequired"),
  customerPhone: yup.string().optional(),
  service: yup.string().required("validation.serviceRequired"),
  date: yup.string().required("validation.dateRequired"),
  timeSlot: yup.string().required("validation.timeRequired"),
  duration: yup.number().min(5).default(30),
  notes: yup.string().optional(),
});

// ─── Telegram Schemas ────────────────────────────────────────────────
export const telegramBotSchema = yup.object({
  botToken: yup
    .string()
    .required("validation.botTokenRequired")
    .matches(/^\d+:[\w-]+$/, "validation.botTokenInvalid"),
});

export type PhoneFormData = yup.InferType<typeof phoneSchema>;
export type OtpFormData = yup.InferType<typeof otpSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
export type StaffLoginFormData = yup.InferType<typeof staffLoginSchema>;
export type BranchFormData = yup.InferType<typeof branchSchema>;
export type QueueFormData = yup.InferType<typeof queueSchema>;
export type CounterFormData = yup.InferType<typeof counterSchema>;
export type EmployeeFormData = yup.InferType<typeof employeeSchema>;
export type CustomerFormData = yup.InferType<typeof customerSchema>;
export type AppointmentFormData = yup.InferType<typeof appointmentSchema>;
export type TelegramBotFormData = yup.InferType<typeof telegramBotSchema>;
