import { SubscriptionStatus } from "@prisma/generated";
import { DomainError } from "@/core/errors/domain.error";

export type SubscriptionProps = {
  id: string;
  userId: string;
  channelId: string;
  status: SubscriptionStatus;
  price: number;
  expiresAt: Date;
  createdAt: Date;
};

export class Subscription {
  constructor(private readonly props: SubscriptionProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get channelId(): string {
    return this.props.channelId;
  }

  public get status(): SubscriptionStatus {
    return this.props.status;
  }

  public get price(): number {
    return this.props.price;
  }

  public get expiresAt(): Date {
    return this.props.expiresAt;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public isActive(at: Date = new Date()): boolean {
    return (
      this.props.status === SubscriptionStatus.ACTIVE &&
      this.props.expiresAt > at
    );
  }

  public isExpired(at: Date = new Date()): boolean {
    return this.props.expiresAt <= at;
  }

  public daysLeft(at: Date = new Date()): number {
    const ms = this.props.expiresAt.getTime() - at.getTime();
    return Math.max(0, Math.ceil(ms / 86_400_000));
  }

  public cancel(): void {
    if (this.props.status !== SubscriptionStatus.ACTIVE) {
      throw new DomainError("Нельзя отменить неактивную подписку");
    }
    this.props.status = SubscriptionStatus.CANCELED;
  }
}
