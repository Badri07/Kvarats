export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

export interface Leave {
  id: string;
  userName:string;
  user?:string;
  userId?:string;
  therapistId: string;
  clientId: string; // Required for data isolation
  leaveDate: Date;
  isFullDay: boolean;
  fromTime?: string; // HH:mm format for partial leaves
  toTime?: string;   // HH:mm format for partial leaves
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
   isApproved: boolean; // Add this
  approvedBy: string | null; // Add this
  approvedAt: string | null; // Add this
}

export interface Availability {
  id: string;
  therapistId: string;
  clientId: string; // Required for data isolation
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  hasLeave?:any;
  leaveInfo?:any;
  isFullDay?:any;
}

export interface LeaveSearch {
  therapistId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isFullDay?: boolean;
}

export interface CreateLeaveRequest {
  therapistId: string;
  leaveDate: Date;
  isFullDay: boolean;
  fromTime?: string;
  toTime?: string;
  reason?: string;
}

export interface UpdateLeaveRequest extends CreateLeaveRequest {
  id: string;
}

export interface CreateAvailabilityRequest {
  therapistId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface UpdateAvailabilityRequest extends CreateAvailabilityRequest {
  id: string;
}