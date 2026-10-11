export type ChannelProps = {
  id: string;
  streamerId: string;
  streamTitle: string | null;
  streamDescription: string | null;
  thumbnailUrl: string | null;
  primaryCategoryId: string | null;
  streamHashKey: string | null;
  bannerKey: string | null;

  isLive: boolean;
  liveStartedAt: Date | null;
  blocked: boolean;

  createdAt: Date;
  updatedAt: Date;
};

export class Channel {
  constructor(private readonly props: ChannelProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get streamerId(): string {
    return this.props.streamerId;
  }

  public get streamTitle(): string | null {
    return this.props.streamTitle;
  }

  public get streamDescription(): string | null {
    return this.props.streamDescription;
  }

  public get thumbnailUrl(): string | null {
    return this.props.thumbnailUrl;
  }

  public get primaryCategoryId(): string | null {
    return this.props.primaryCategoryId;
  }

  public get isLive(): boolean {
    return this.props.isLive;
  }

  public get liveStartedAt(): Date | null {
    return this.props.liveStartedAt;
  }

  public get blocked(): boolean {
    return this.props.blocked;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Ключ объекта в S3, не URL. */
  public get bannerKey(): string | null {
    return this.props.bannerKey;
  }

  public get streamHashKey(): string | null {
    return this.props.streamHashKey;
  }
}
