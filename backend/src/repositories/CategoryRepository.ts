import { and, asc, eq } from 'drizzle-orm';
import { db, DatabaseClient } from '../db';
import { categories, Category, NewCategory } from '../db/schema';

export class CategoryRepository {
  constructor(private readonly database: DatabaseClient = db) {}

  async create(data: NewCategory): Promise<Category> {
    const [created] = await this.database
      .insert(categories)
      .values(data)
      .returning();
    return created;
  }

  async findAllByUser(userId: string): Promise<Category[]> {
    return this.database.query.categories.findMany({
      where: eq(categories.userId, userId),
      orderBy: [asc(categories.name)],
    });
  }

  async findByIdAndUser(id: string, userId: string): Promise<Category | undefined> {
    return this.database.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.userId, userId)),
    });
  }

  async updateByIdAndUser(
    id: string,
    userId: string,
    data: Partial<NewCategory>
  ): Promise<Category | undefined> {
    const [updated] = await this.database
      .update(categories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return updated;
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const deleted = await this.database
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning({ id: categories.id });
    return deleted.length > 0;
  }
}

