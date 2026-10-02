export type StatusMessage = {
  status: number;
  message: string;
};

export type ChangePasswordDto = {
  userId: string;
  oldPassword: string;
  newPassword: string;
};
