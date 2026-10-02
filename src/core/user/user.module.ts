import { Module } from "@nestjs/common";
import { UserController } from "@/core/user/user.controller";
import { UserUseCaseModule } from "@/core/use-case/user/user-use-case.module";
import { AuthUseCaseModule } from "@/core/use-case/auth/auth-use-case.module";

@Module({
  imports: [UserUseCaseModule, AuthUseCaseModule],
  controllers: [UserController],
})
export class UserModule {}
