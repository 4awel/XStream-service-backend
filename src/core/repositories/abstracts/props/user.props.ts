export type UpdateUserProps = {
  id: string;
  email?: string;
  passwordHash?: string;
};

export type CreateUserProps = {
  email: string;
  password: string;
  username: string;
  displayName: string;
};
