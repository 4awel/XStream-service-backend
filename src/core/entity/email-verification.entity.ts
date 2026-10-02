export type EmailVerificationProps = {
	id: number;
	createdAt: Date;
	expiresAt: Date;
	email: string;
	codeHash: string;
	hashPassword: string;
	attempts: number;
};

export class EmailVerification {
	constructor(private readonly props: EmailVerificationProps) {}

	get id(): number {
		return this.props.id;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get expiresAt(): Date {
		return this.props.expiresAt;
	}

	get email(): string {
		return this.props.email;
	}

	get codeHash(): string {
		return this.props.codeHash;
	}

	get hashPassword(): string {
		return this.props.hashPassword;
	}

	get attempts(): number {
		return this.props.attempts;
	}

	get isExpired(): boolean {
		return this.props.expiresAt.getTime() <= Date.now();
	}
}
