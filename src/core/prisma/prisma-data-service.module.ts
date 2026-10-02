import { Module } from '@nestjs/common';
import { IDataServices } from '@/core/repositories/data-service.repository';
import { PrismaDataServices } from '@/core/prisma/prisma-data-service.service';

@Module({
	providers: [
		{
			provide: IDataServices,
			useClass: PrismaDataServices,
		},
	],
	exports: [
		IDataServices,
	],
})
export class PrismaDataServicesModule {}
