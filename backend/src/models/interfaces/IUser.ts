export interface IUser {
  username: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  isBlocked?:boolean;
  isDoctor?:boolean;
  resetPasswordToken?:string,
  resetPasswordExpires?:Date,

}
