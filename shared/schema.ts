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
  monthlyBudget: decimal("monthly_budget", { precision: 10, scale: 2 }).default("0"),
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
  statementId: varchar("statement_id"), // Optional - links to uploaded statement
  isVerified: text("is_verified").default("pending"), // 'pending', 'verified', 'rejected'
  originalAmount: text("original_amount"), // Store original amount string from statement
});

export const budgetPeriods = pgTable("budget_periods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: integer("is_active").default(0), // 0 = false, 1 = true (SQLite compatibility)
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const statements = pgTable("statements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // 'csv', 'pdf', etc.
  source: text("source").notNull(), // 'amex', 'bank', 'chase', etc.
  uploadedAt: timestamp("uploaded_at").notNull().default(sql`now()`),
  processedAt: timestamp("processed_at"),
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  totalTransactions: integer("total_transactions"),
  processedTransactions: integer("processed_transactions"),
  errorMessage: text("error_message"),
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

export const insertBudgetPeriodSchema = createInsertSchema(budgetPeriods).omit({
  id: true,
  createdAt: true,
}).extend({
  startDate: z.string(),
  endDate: z.string(),
});

export const insertStatementSchema = createInsertSchema(statements).omit({
  id: true,
  uploadedAt: true,
}).extend({
  processedAt: z.date().nullable().optional(),
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertStatement = z.infer<typeof insertStatementSchema>;
export type Statement = typeof statements.$inferSelect;
export type InsertBudgetPeriod = z.infer<typeof insertBudgetPeriodSchema>;
export type BudgetPeriod = typeof budgetPeriods.$inferSelect;
