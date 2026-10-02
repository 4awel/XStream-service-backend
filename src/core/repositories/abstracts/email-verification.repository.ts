import { EmailVerification } from '@/core/entity/email-verification.entity';

export abstract class EmailVerificationRepository {
	/** Создаёт или перезаписывает заявку на верификацию (email уникален). */
	abstract upsert(
		email: string,
		hashPassword: string,
		codeHash: string,
		expiresAt: Date,
	): Promise<void>;

	abstract find(email: string): Promise<EmailVerification | null>;

	/** Атомарно увеличивает счётчик неверных попыток и возвращает новое значение. */
	abstract incrementAttempts(email: string): Promise<number>;

	/** true — заявка была удалена этим вызовом (защита от двойного использования кода). */
	abstract remove(email: string): Promise<boolean>;
}
