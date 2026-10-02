import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

@Injectable()
export class VerificationCodeService {
	private readonly secret: string;

	constructor(config: ConfigService) {
		this.secret = config.getOrThrow<string>('VERIFICATION_CODE_SECRET');
	}

	/** Криптостойкий 6-значный код (не Math.random). */
	generate(): string {
		return randomInt(0, 1_000_000).toString().padStart(6, '0');
	}

	/** В БД хранится только HMAC (привязан к email), а не сам код. */
	hash(email: string, code: string): string {
		return createHmac('sha256', this.secret)
			.update(`${email}:${code}`)
			.digest('hex');
	}

	verify(email: string, code: string, codeHash: string): boolean {
		const actual = Buffer.from(this.hash(email, code), 'hex');
		const expected = Buffer.from(codeHash, 'hex');
		return (
			actual.length === expected.length && timingSafeEqual(actual, expected)
		);
	}
}
