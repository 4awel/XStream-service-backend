export type UserProps = {
  id: string;
  email: string;
  password: string;

  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;

  createdAt: Date;
  updatedAt: Date;

  platform: string | null;
  language: string | null;

  isEmailVerified: boolean;
  blocked: boolean;
};

export class User {
  constructor(private readonly props: UserProps) {}

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get username(): string {
    return this.props.username;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get bio(): string | null {
    return this.props.bio;
  }

  get avatar(): string | null {
    return this.props.avatar;
  }

  get platform(): string | null {
    return this.props.platform;
  }

  get language(): string | null {
    return this.props.language;
  }

  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  get blocked(): boolean {
    return this.props.blocked;
  }

  get password(): string {
    return this.props.password;
  }
}
