import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
	IsEmail,
	IsInt,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
	typeof value === 'string' ? value.trim().toLowerCase() : value;

export class AuthResponse {
	@IsString()
	refresh_token: string;

	@IsString()
	access_token: string;
}

export class AuthDto {
	@ApiProperty({
		description: 'почта пользователя',
		required: true,
		uniqueItems: true,
	})
	@Transform(normalizeEmail)
	@IsEmail()
	@MaxLength(254)
	email: string;

	@ApiProperty({
		description: 'пароль: 8–128 символов, минимум одна буква и одна цифра',
		required: true,
		minLength: 8,
		maxLength: 128,
	})
	@IsString()
	@MinLength(8)
	@MaxLength(128) // верхняя граница защищает от DoS через огромный пароль в scrypt
	@Matches(/(?=.*\p{L})(?=.*\d)/u, {
		message: 'password must contain at least one letter and one digit',
	})
	password: string;
}

export class VerifyEmailDto {
	@ApiProperty({ description: 'почта, на которую пришёл код' })
	@Transform(normalizeEmail)
	@IsEmail()
	@MaxLength(254)
	email: string;

	@ApiProperty({ description: '6-значный код из письма', example: '123456' })
	@IsString()
	@Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
	code: string;
}

export class RegisterResponse {
	@IsInt()
	@ApiProperty({
		description: 'Статус',
	})
	status: number;

	@IsString()
	@ApiProperty({
		description: 'Сообщение',
	})
	message: string;
}
