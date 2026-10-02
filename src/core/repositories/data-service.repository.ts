import { EmailVerificationRepository } from '@/core/repositories/abstracts/email-verification.repository';
import { UserRepository } from '@/core/repositories/abstracts/user.repository';
import { ChannelRepository } from '@/core/repositories/abstracts/channel.repository';

export abstract class IDataServices {
	abstract user: UserRepository;
	abstract emailVerification: EmailVerificationRepository;
	abstract channel: ChannelRepository;
}
