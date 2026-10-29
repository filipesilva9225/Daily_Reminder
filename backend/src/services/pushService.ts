import {
  PushSubscriptionRecord,
  PushSubscriptionRepository,
} from '../repositories/PushSubscriptionRepository';
import { SubscribePushInput } from '../schemas/push.schema';
import { NotFoundError } from '../utils/errors';

export class PushService {
  constructor(
    private readonly pushSubscriptionRepository: PushSubscriptionRepository
  ) {}

  async subscribe(
    userId: string,
    input: SubscribePushInput
  ): Promise<PushSubscriptionRecord> {
    return this.pushSubscriptionRepository.create({
      userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
    });
  }

  async listSubscriptions(userId: string): Promise<PushSubscriptionRecord[]> {
    return this.pushSubscriptionRepository.findAllByUser(userId);
  }

  async unsubscribe(userId: string, subscriptionId: string): Promise<void> {
    const deleted = await this.pushSubscriptionRepository.deleteByIdAndUser(
      subscriptionId,
      userId
    );
    if (!deleted) {
      throw new NotFoundError('Inscrição de notificação não encontrada');
    }
  }
}

