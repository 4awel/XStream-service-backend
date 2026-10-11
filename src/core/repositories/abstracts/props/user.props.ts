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

/** Поля, которые пользователь правит сам. undefined — не трогать. */
export type UpdateProfileProps = {
  username?: string;
  displayName?: string;
  bio?: string | null;
};

export type UpdateSettingsProps = {
  theme?: "DARK" | "LIGHT";
};

export type UpdateChannelInfoProps = {
  streamTitle?: string | null;
  streamDescription?: string | null;
  primaryCategoryId?: string | null;
};
