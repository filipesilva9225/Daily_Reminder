import { eq } from 'drizzle-orm';
import { db, DatabaseClient } from '../db';
import { NewUser, User, users } from '../db/schema';

export class UserRepository {
  constructor(private readonly database: DatabaseClient = db) {}

  async findByEmail(email: string): Promise<User | undefined> {
    return this.database.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
  }

  async findById(id: string): Promise<User | undefined> {
    return this.database.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async create(data: NewUser): Promise<User> {
    const [created] = await this.database
      .insert(users)
      .values({
        ...data,
        email: data.email.toLowerCase(),
      })
      .returning();
    return created;
  }

  async updatePreferences(
    userId: string,
    data: Partial<Pick<User, 'name' | 'timezone' | 'theme' | 'weekStartsOn'>>
  ): Promise<User | undefined> {
    const [updated] = await this.database
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }
}

