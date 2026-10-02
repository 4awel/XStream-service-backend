import { Module } from "@nestjs/common";
import { PrismaDataServicesModule } from "@/core/prisma/prisma-data-service.module";
import { StreamUseCase } from "@/core/use-case/stream/stream.use-case";

@Module({
  imports: [PrismaDataServicesModule],
  providers: [StreamUseCase],
  exports: [StreamUseCase],
})
export class StreamUseCaseModule {}
