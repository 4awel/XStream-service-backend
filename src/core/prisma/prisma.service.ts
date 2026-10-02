import {
	Injectable,
	type OnModuleDestroy,
	type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../prisma/generated/client';

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
});

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	public constructor() {
		super({
			adapter,
		});
	}

	public async onModuleInit() {
		await this.$connect();
	}
	public async onModuleDestroy() {
		await this.$disconnect();
	}
}
