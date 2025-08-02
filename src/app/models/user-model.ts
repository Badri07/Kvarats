export interface registerModel{
  name?:string | null;
  adminFirstName?: string | null;
  adminEmail?: string | null;
  adminPassword?: string | null;
  confirmPassword?: string | null;
  isSoloProvider?:boolean | null;
  countryDataId?:string | null;
  adminCountryCode?:string | null;
  phoneNumber?:string | null;
address?:string | null;
adminLastName?:string | null;

}
export interface forgotpasswordModel{
  email?: string | null;
  password?: string | null;
}
export interface loginModel{
usernameOrEmail?:string | null,
password?:string | null,
}

export interface User {
  id: string;
  username: string;
  email: string;
}
export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: string;
  role:User;
  message:string;
}

export interface users{
  username?:string | null;
  email?:string | null;
  passwordHash?:string | null;
  roleId?:string | null;
  role?:string | null;
  createdAt?:string | null;
  updatedAt?:string | null;
  active?:boolean | null;
}

export interface AvailabilityModel {
  userId: string | null;
  daysOfWeek: number[] | null;
  startTime: string | null;
  endTime: string | null;
  isAvailable: boolean | null;
}
export interface LeaveRequest {
  id:string | null;
  userId: string | null;
  leaveDate: string | null;
  isFullDay: boolean | null;
  fromTime: string | null;
  toTime: string | null;
  reason: string | null;
  userName:string | null;

}


export interface Tokenrefresh{
  refreshToken:string | null;
}
