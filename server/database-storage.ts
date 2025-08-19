import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import {
  categories,
  partners,
  expenses,
  statements,
  budgetPeriods,
  type Category,
  type InsertCategory,
  type Partner,
  type InsertPartner,
  type Expense,
  type InsertExpense,
  type Statement,
  type InsertStatement,
  type BudgetPeriod,
  type InsertBudgetPeriod,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(
    id: string,
    updateData: Partial<InsertCategory>,
  ): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Partners
  async getPartners(): Promise<Partner[]> {
    return await db.select().from(partners);
  }

  async createPartner(insertPartner: InsertPartner): Promise<Partner> {
    const [partner] = await db
      .insert(partners)
      .values(insertPartner)
      .returning();
    return partner;
  }

  async updatePartner(id: string, updateData: Partial<InsertPartner>): Promise<Partner | undefined> {
    const [partner] = await db
      .update(partners)
      .set(updateData)
      .where(eq(partners.id, id))
      .returning();
    return partner || undefined;
  }

  async deletePartner(id: string): Promise<boolean> {
    const result = await db
      .delete(partners)
      .where(eq(partners.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Expenses
  async getExpenses(): Promise<
    (Expense & { category: Category; partner: Partner })[]
  > {
    const result = await db
      .select({
        expense: expenses,
        category: categories,
        partner: partners,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .leftJoin(partners, eq(expenses.partnerId, partners.id))
      .orderBy(sql`${expenses.date} DESC`);

    return result.map(({ expense, category, partner }) => ({
      ...expense,
      category: category || {
        id: "",
        name: "Unknown",
        emoji: "❓",
        color: "#6B7280",
        budget: null,
        monthlyBudget: null,
        includeInSpending: 1,
      },
      partner: partner || { id: "", name: "Unknown", color: "#6B7280" },
    }));
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const expenseData = {
      ...insertExpense,
      date: insertExpense.date ? new Date(insertExpense.date) : new Date(),
    };

    const [expense] = await db
      .insert(expenses)
      .values(expenseData)
      .returning();
    return expense;
  }

  async updateExpense(
    id: string,
    updateData: Partial<InsertExpense>,
  ): Promise<Expense | undefined> {
    const expenseData = {
      ...updateData,
      date: updateData.date ? new Date(updateData.date) : undefined,
    };

    const [expense] = await db
      .update(expenses)
      .set(expenseData)
      .where(eq(expenses.id, id))
      .returning();
    return expense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Statements
  async getStatements(): Promise<Statement[]> {
    return await db.select().from(statements).orderBy(sql`${statements.uploadedAt} DESC`);
  }

  async createStatement(insertStatement: InsertStatement): Promise<Statement> {
    const [statement] = await db
      .insert(statements)
      .values(insertStatement)
      .returning();
    return statement;
  }

  async updateStatement(
    id: string,
    updateData: Partial<InsertStatement>,
  ): Promise<Statement | undefined> {
    const [statement] = await db
      .update(statements)
      .set(updateData)
      .where(eq(statements.id, id))
      .returning();
    return statement;
  }

  async getStatement(id: string): Promise<Statement | undefined> {
    const [statement] = await db
      .select()
      .from(statements)
      .where(eq(statements.id, id));
    return statement;
  }

  // Analytics
  async getSpendingByCategory(): Promise<
    { categoryId: string; total: number; category: Category }[]
  > {
    const result = await db
      .select({
        categoryId: expenses.categoryId,
        total: sql<number>`sum(${expenses.amount}::numeric)`,
        category: categories,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .groupBy(expenses.categoryId, categories.id);

    return result.map(({ categoryId, total, category }) => ({
      categoryId,
      total: Number(total),
      category: category || {
        id: categoryId,
        name: "Unknown",
        emoji: "❓",
        color: "#6B7280",
        budget: null,
        monthlyBudget: null,
        includeInSpending: 1,
      },
    }));
  }

  async getMonthlySpending(): Promise<{ month: string; total: number }[]> {
    const result = await db
      .select({
        month: sql<string>`to_char(${expenses.date}, 'YYYY-MM')`,
        total: sql<number>`sum(${expenses.amount}::numeric)`,
      })
      .from(expenses)
      .groupBy(sql`to_char(${expenses.date}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${expenses.date}, 'YYYY-MM') DESC`);

    return result.map(({ month, total }) => ({
      month,
      total: Number(total),
    }));
  }

  // New methods for expense verification and budget periods
  async getExpensesByStatement(statementId: string): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.statementId, statementId));
  }

  async getBudgetPeriods(): Promise<BudgetPeriod[]> {
    return await db
      .select()
      .from(budgetPeriods)
      .orderBy(sql`${budgetPeriods.startDate} DESC`);
  }

  async createBudgetPeriod(insertBudgetPeriod: InsertBudgetPeriod): Promise<BudgetPeriod> {
    const budgetPeriodData = {
      ...insertBudgetPeriod,
      startDate: new Date(insertBudgetPeriod.startDate),
      endDate: new Date(insertBudgetPeriod.endDate),
    };

    const [budgetPeriod] = await db
      .insert(budgetPeriods)
      .values(budgetPeriodData)
      .returning();
    return budgetPeriod;
  }

  async updateBudgetPeriod(
    id: string,
    updateData: Partial<InsertBudgetPeriod>,
  ): Promise<BudgetPeriod | undefined> {
    const budgetPeriodData = {
      ...updateData,
      startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
      endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
    };

    const [budgetPeriod] = await db
      .update(budgetPeriods)
      .set(budgetPeriodData)
      .where(eq(budgetPeriods.id, id))
      .returning();
    return budgetPeriod;
  }

  async deleteBudgetPeriod(id: string): Promise<boolean> {
    const result = await db.delete(budgetPeriods).where(eq(budgetPeriods.id, id));
    return (result.rowCount || 0) > 0;
  }
}