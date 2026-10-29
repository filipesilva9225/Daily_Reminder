import { and, eq } from 'drizzle-orm';
import { db, DatabaseClient } from '../db';
import { pushSubscriptions } from '../db/schema';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type PushSubscriptionRecord = InferSelectModel<typeof pushSubscriptions>;
export type NewPushSubscriptionRecord = InferInsertModel<typeof pushSubscriptions>;

export class PushSubscriptionRepository {
  constructor(private readonly database: DatabaseClient = db) {}

  async create(data: NewPushSubscriptionRecord): Promise<PushSubscriptionRecord> {
    const [created] = await this.database
      .insert(pushSubscriptions)
      .values(data)
      .returning();
    return created;
  }

  async findAllByUser(userId: string): Promise<PushSubscriptionRecord[]> {
    return this.database.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
    });
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const deleted = await this.database
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.id, id),
          eq(pushSubscriptions.userId, userId)
        )
      )
      .returning({ id: pushSubscriptions.id });
    return deleted.length > 0;
  }
}

