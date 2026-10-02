export type User = {
  id: string;
  email: string;
  hashPassword: string;
  username: string;
  avatar: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserInfo = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};
