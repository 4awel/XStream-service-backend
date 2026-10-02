import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { ConflictDomainError, DomainError, ForbiddenDomainError, NotFoundDomainError } from '../errors/domain.error';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
	catch(error: DomainError, host: ArgumentsHost) {
		const response = host.switchToHttp().getResponse<Response>();

		const status =
			error instanceof NotFoundDomainError  ? HttpStatus.NOT_FOUND
			: error instanceof ForbiddenDomainError ? HttpStatus.FORBIDDEN
			: error instanceof ConflictDomainError  ? HttpStatus.CONFLICT
			: HttpStatus.BAD_REQUEST;

		response.status(status).json({
			statusCode: status,
			code: error.code,
			message: error.message,
		});
	}
}