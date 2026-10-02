import { Module } from '@nestjs/common';

import { PasswordService } from '@/core/security/password.service';
import { RateLimitService } from '@/core/security/rate-limit.service';
import { VerificationCodeService } from '@/core/security/verification-code.service';

@Module({
	providers: [PasswordService, VerificationCodeService, RateLimitService],
	exports: [PasswordService, VerificationCodeService, RateLimitService],
})
export class SecurityModule {}
