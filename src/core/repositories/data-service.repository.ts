import { EmailVerificationRepository } from '@/core/repositories/abstracts/email-verification.repository';
import { UserRepository } from '@/core/repositories/abstracts/user.repository';
import { ChannelRepository } from '@/core/repositories/abstracts/channel.repository';
import { ChatRepository } from '@/core/repositories/abstracts/chat.repository';
import { FollowRepository } from '@/core/repositories/abstracts/follow.repository';
import { TagRepository } from '@/core/repositories/abstracts/tag.repository';

export abstract class IDataServices {
	abstract user: UserRepository;
	abstract emailVerification: EmailVerificationRepository;
	abstract channel: ChannelRepository;
	abstract chat: ChatRepository;
	abstract follow: FollowRepository;
	abstract tag: TagRepository;
}
