import * as yup from "yup";

/* ─── Shared Branch Types ─── */
export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
}

export interface Branch {
  _id: string;
  name: string;
  slug: string;
  address: string;
  phone?: string;
  email?: string;
  timezone: string;
  workingHours?: string;
  schedule?: Record<string, { start: string; end: string; closed?: boolean }>;
  avgTimePerClient?: number;
  managerId?: Employee | string;
  managerIds?: (Employee | string)[];
  managerName?: string;
  maxDailyTickets?: number;
  coordinates?: { lat: number; lng: number };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const TIMEZONE_OPTIONS = [
  "Asia/Tashkent",
  "Asia/Samarkand",
  "Asia/Almaty",
  "Asia/Dushanbe",
  "Asia/Bishkek",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Istanbul",
];

export const AVG_TIME_OPTIONS = [10, 15, 20, 30, 45, 60];

/* ─── Yup Validation Schema ─── */
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
  email: yup.string().optional().email("validation.emailInvalid").default(""),
  timezone: yup
    .string()
    .required("validation.timezoneRequired")
    .default("Asia/Tashkent"),
  workingHours: yup.string().optional().default("09:00 - 18:00"),
  managerIds: yup.array().of(yup.string().required()).default([]),
  maxDailyTickets: yup
    .number()
    .min(0, "validation.maxDailyTicketsMin")
    .default(0)
    .transform((value) => (isNaN(value) ? 0 : value)),
  avgTimePerClient: yup
    .number()
    .min(1, "validation.avgTimeMin")
    .max(120, "validation.avgTimeMax")
    .default(15)
    .transform((value) => (isNaN(value) ? 15 : value)),
  coordinates: yup
    .object({
      lat: yup.number().required(),
      lng: yup.number().required(),
    })
    .nullable()
    .default(null),
});

export type BranchFormData = yup.InferType<typeof branchSchema>;

/* ─── Default values ─── */
export const defaultBranchValues: BranchFormData = {
  name: "",
  slug: "",
  address: "",
  phone: "+998",
  email: "",
  timezone: "Asia/Tashkent",
  workingHours: "09:00 - 18:00",
  managerIds: [],
  maxDailyTickets: 0,
  avgTimePerClient: 15,
  coordinates: null,
};
