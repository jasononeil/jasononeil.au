import { mysqlTable, varchar, int, timestamp, mysqlEnum, primaryKey } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// Subscribers table
export const subscribers = mysqlTable('email_list_subscribers', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  status: mysqlEnum('status', ['active', 'unsubscribed']).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// Subscriber preferences table
export const subscriberPreferences = mysqlTable(
  'email_list_subscriber_preferences',
  {
    id: int('id').primaryKey().autoincrement(),
    subscriberId: int('subscriber_id').notNull(),
    categoryId: int('category_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => {
    return {
      // Composite unique constraint to prevent duplicate preferences
      subscriberCategoryUnique: primaryKey({ columns: [table.subscriberId, table.categoryId] }),
    };
  }
);

// Sent emails table
export const sentEmails = mysqlTable('email_list_sent_emails', {
  id: int('id').primaryKey().autoincrement(),
  subscriberId: int('subscriber_id').notNull(),
  postId: int('post_id').notNull(),
  status: mysqlEnum('status', ['sent', 'failed']).notNull().default('sent'),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  errorMessage: varchar('error_message', { length: 255 }),
});

// Define relations between tables
export const subscribersRelations = relations(subscribers, ({ many }) => ({
  preferences: many(subscriberPreferences),
  sentEmails: many(sentEmails),
}));

export const subscriberPreferencesRelations = relations(subscriberPreferences, ({ one }) => ({
  subscriber: one(subscribers, {
    fields: [subscriberPreferences.subscriberId],
    references: [subscribers.id],
  }),
}));

export const sentEmailsRelations = relations(sentEmails, ({ one }) => ({
  subscriber: one(subscribers, {
    fields: [sentEmails.subscriberId],
    references: [subscribers.id],
  }),
}));
