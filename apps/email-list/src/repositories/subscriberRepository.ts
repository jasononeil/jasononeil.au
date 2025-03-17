import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { subscribers, subscriberPreferences, sentEmails } from '@/db/schema';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Infer types from the schema
type Subscriber = InferSelectModel<typeof subscribers>;
type SentEmail = InferSelectModel<typeof sentEmails>;
type InsertSubscriber = InferInsertModel<typeof subscribers>;

export class SubscriberRepository {
  // Create a new subscriber
  async createSubscriber(subscriber: InsertSubscriber): Promise<number> {
    const result = await db.insert(subscribers).values(subscriber).$returningId();
    return result[0].id;
  }

  // Get a subscriber by email
  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const result = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);

    return result[0];
  }

  // Get a subscriber by id
  async getSubscriberById(id: number): Promise<Subscriber | undefined> {
    const result = await db.select().from(subscribers).where(eq(subscribers.id, id)).limit(1);

    return result[0];
  }

  // Update a subscriber
  async updateSubscriber(id: number, data: Partial<Subscriber>): Promise<boolean> {
    const result = await db.update(subscribers).set(data).where(eq(subscribers.id, id));

    return Number(result[0].affectedRows) > 0;
  }

  // Mark a subscriber as unsubscribed
  async unsubscribe(email: string): Promise<boolean> {
    const result = await db
      .update(subscribers)
      .set({ status: 'unsubscribed' })
      .where(eq(subscribers.email, email));

    return Number(result[0].affectedRows) > 0;
  }

  // Add a category preference for a subscriber
  async addPreference(subscriberId: number, categoryId: number): Promise<boolean> {
    try {
      await db.insert(subscriberPreferences).values({
        subscriberId,
        categoryId,
      });
      return true;
    } catch (error) {
      console.error('Error adding preference:', error);
      return false;
    }
  }

  // Remove a category preference for a subscriber
  async removePreference(subscriberId: number, categoryId: number): Promise<boolean> {
    const result = await db
      .delete(subscriberPreferences)
      .where(
        and(
          eq(subscriberPreferences.subscriberId, subscriberId),
          eq(subscriberPreferences.categoryId, categoryId)
        )
      );

    return Number(result[0].affectedRows) > 0;
  }

  // Get all preferences for a subscriber
  async getPreferences(subscriberId: number): Promise<number[]> {
    const result = await db
      .select({ categoryId: subscriberPreferences.categoryId })
      .from(subscriberPreferences)
      .where(eq(subscriberPreferences.subscriberId, subscriberId));

    return result.map((row) => row.categoryId);
  }

  // Record a sent email
  async recordSentEmail(sentEmail: SentEmail): Promise<number> {
    const result = await db.insert(sentEmails).values(sentEmail).$returningId();
    return Number(result[0].id);
  }

  // Get all active subscribers
  async getActiveSubscribers(): Promise<Subscriber[]> {
    const results = await db.select().from(subscribers).where(eq(subscribers.status, 'active'));
    return results.map((result) => ({
      id: result.id,
      email: result.email,
      name: result.name,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }));
  }
}

// Export a singleton instance
export const subscriberRepository = new SubscriberRepository();
