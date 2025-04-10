import { db } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { sentPosts } from '@/db/schema';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Infer types from the schema
export type SentPost = InferSelectModel<typeof sentPosts>;
export type InsertSentPost = InferInsertModel<typeof sentPosts>;

export class SentPostRepository {
  // Create a new sent post record
  async createSentPost(sentPost: InsertSentPost): Promise<number> {
    const result = await db.insert(sentPosts).values(sentPost).$returningId();
    return result[0].id;
  }

  // Get a sent post by id
  async getSentPostById(id: number): Promise<SentPost | undefined> {
    const result = await db.select().from(sentPosts).where(eq(sentPosts.id, id)).limit(1);
    return result[0];
  }

  // Get a sent post by WordPress post id
  async getSentPostByPostId(postId: number): Promise<SentPost | undefined> {
    const result = await db.select().from(sentPosts).where(eq(sentPosts.postId, postId)).limit(1);
    return result[0];
  }

  // Get all sent posts
  async getAllSentPosts(): Promise<SentPost[]> {
    return await db.select().from(sentPosts).orderBy(desc(sentPosts.date));
  }

  // Get the most recent sent posts
  async getRecentSentPosts(limit: number = 10): Promise<SentPost[]> {
    return await db.select().from(sentPosts).orderBy(desc(sentPosts.date)).limit(limit);
  }
}

// Export a singleton instance
export const sentPostRepository = new SentPostRepository();
