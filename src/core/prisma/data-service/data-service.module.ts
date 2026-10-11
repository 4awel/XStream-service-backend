import { Module } from "@nestjs/common";
import { PrismaDataServicesModule } from "@/core/prisma/prisma-data-service.module";

@Module({
    imports: [PrismaDataServicesModule],
    exports: [PrismaDataServicesModule]
})

export class DataServiceModule {}