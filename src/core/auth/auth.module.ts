import { Module } from '@nestjs/common';

import { AuthController } from '@/core/auth/auth.controller';
import { SecurityModule } from '@/core/security/security.module';
import { AuthUseCaseModule } from '@/core/use-case/auth/auth-use-case.module';
import { LoginController } from '@/core/auth/login.controller';

@Module({
	imports: [AuthUseCaseModule, SecurityModule],
	controllers: [AuthController, LoginController],
})
export class AuthModule {}
