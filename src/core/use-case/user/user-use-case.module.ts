import { Module } from "@nestjs/common";
import { PrismaDataServicesModule } from "@/core/prisma/prisma-data-service.module";
import { UserUseCase } from "@/core/use-case/user/user.use-case";

@Module({
    imports: [PrismaDataServicesModule],
    providers: [UserUseCase],
    exports: [UserUseCase]
})

export class UserUseCaseModule {}