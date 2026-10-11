export type ChatMessageProps = {
  id: string;
  userId: string;
  username: string;
  channelId: string;
  text: string;
  createdAt: Date;
};

export class ChatMessage {
  constructor(private readonly props: ChatMessageProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get username(): string {
    return this.props.username;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get channelId(): string {
    return this.props.channelId;
  }

  public get text(): string {
    return this.props.text;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }
}
