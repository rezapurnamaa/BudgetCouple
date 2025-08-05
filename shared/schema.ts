import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  color: text("color").notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }),
});

export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  categoryId: varchar("category_id").notNull(),
  partnerId: varchar("partner_id").notNull(),
  date: timestamp("date").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string().optional(),
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
