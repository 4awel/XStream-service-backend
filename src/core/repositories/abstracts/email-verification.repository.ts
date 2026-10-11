import { EmailVerification } from '@/core/entity/email-verification.entity';

export abstract class EmailVerificationRepository {
	abstract upsert(
		email: string,
		hashPassword: string,
		codeHash: string,
		expiresAt: Date,
	): Promise<void>;

	abstract find(email: string): Promise<EmailVerification | null>;

	abstract incrementAttempts(email: string): Promise<number>;

	abstract remove(email: string): Promise<boolean>;
}
