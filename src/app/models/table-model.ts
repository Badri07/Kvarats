export interface LeaveData {
  doctor: string;
  date: string;
  time: string;
  type: string;
}


export interface Availability {
  id: number;
  userId: string;
  username: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  leaveDate:string;
}
