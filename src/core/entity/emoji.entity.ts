export type EmojiProps = {
  id: string;
  channelId: string;
  creatorId: string;
  creator: string;

  name: string;
  link: string;

  createdAt: Date;
  updatedAt: Date;
};

export class Emoji {
  constructor(private readonly props: EmojiProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get channelId(): string {
    return this.props.channelId;
  }

  public get creatorId(): string {
    return this.props.creatorId;
  }

  public get creator(): string {
    return this.props.creator;
  }

  public get name(): string {
    return this.props.name;
  }

  public get link(): string {
    return this.props.link;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
