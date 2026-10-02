import { Module } from '@nestjs/common';

import { AuthController } from '@/core/auth/auth.controller';
import { SecurityModule } from '@/core/security/security.module';
import { AuthUseCaseModule } from '@/core/use-case/auth/auth-use-case.module';

@Module({
	imports: [AuthUseCaseModule, SecurityModule],
	controllers: [AuthController],
})
export class AuthModule {}
