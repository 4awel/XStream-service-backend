import { Injectable } from '@nestjs/common';
import {
	randomBytes,
	type ScryptOptions,
	scrypt,
	timingSafeEqual,
} from 'node:crypto';

// OWASP: scrypt N=2^16, r=8, p=2 (~64 MiB памяти на хэш)
const N = 2 ** 16;
const R = 8;
const P = 2;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const MAX_MEM = 128 * 1024 * 1024;

function scryptAsync(
	password: string,
	salt: Buffer,
	options: ScryptOptions,
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scrypt(password, salt, KEY_LENGTH, options, (error, key) =>
			error ? reject(error) : resolve(key),
		);
	});
}

/** Формат хэша: scrypt$N$r$p$salt(b64)$hash(b64) — параметры можно менять без миграции. */
@Injectable()
export class PasswordService {
	async hash(password: string): Promise<string> {
		const salt = randomBytes(SALT_LENGTH);
		const key = await scryptAsync(password, salt, {
			N,
			r: R,
			p: P,
			maxmem: MAX_MEM,
		});
		return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
	}

	async verify(password: string, stored: string): Promise<boolean> {
		const [algo, n, r, p, salt, hash] = stored.split('$');
		if (algo !== 'scrypt' || !salt || !hash) {
			return false;
		}
		const expected = Buffer.from(hash, 'base64');
		const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), {
			N: Number(n),
			r: Number(r),
			p: Number(p),
			maxmem: MAX_MEM,
		});
		return (
			actual.length === expected.length && timingSafeEqual(actual, expected)
		);
	}
}
