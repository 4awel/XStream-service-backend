import { Injectable } from '@nestjs/common';
import { EmailVerification } from '@/core/entity/email-verification.entity';
import { PrismaService } from '@/core/prisma/prisma.service';
import { EmailVerificationRepository } from '@/core/repositories/abstracts/email-verification.repository';

@Injectable()
export class PrismaEmailVerificationRepository extends EmailVerificationRepository {
	constructor(private readonly prisma: PrismaService) {
		super();
	}

	async upsert(
		email: string,
		hashPassword: string,
		codeHash: string,
		expiresAt: Date,
	): Promise<void> {
		await this.prisma.emailVerification.upsert({
			where: { email },
			create: { email, hashPassword, codeHash, expiresAt },
			// новая заявка сбрасывает попытки и время создания
			update: {
				hashPassword,
				codeHash,
				expiresAt,
				attempts: 0,
				createdAt: new Date(),
			},
		});
	}

	async find(email: string): Promise<EmailVerification | null> {
		const row = await this.prisma.emailVerification.findUnique({
			where: { email },
		});
		return row ? new EmailVerification(row) : null;
	}

	async incrementAttempts(email: string): Promise<number> {
		const row = await this.prisma.emailVerification.update({
			where: { email },
			data: { attempts: { increment: 1 } },
			select: { attempts: true },
		});
		return row.attempts;
	}

	async remove(email: string): Promise<boolean> {
		const { count } = await this.prisma.emailVerification.deleteMany({
			where: { email },
		});
		return count > 0;
	}
}
