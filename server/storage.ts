import {
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
import { randomUUID } from "crypto";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(
    id: string,
    category: Partial<InsertCategory>,
  ): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Partners
  getPartners(): Promise<Partner[]>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: string, partner: Partial<InsertPartner>): Promise<Partner | undefined>;
  deletePartner(id: string): Promise<boolean>;

  // Expenses
  getExpenses(): Promise<
    (Expense & { category: Category; partner: Partner })[]
  >;
  getExpensesByStatement(statementId: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(
    id: string,
    expense: Partial<InsertExpense>,
  ): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  // Statements
  getStatements(): Promise<Statement[]>;
  createStatement(statement: InsertStatement): Promise<Statement>;
  updateStatement(
    id: string,
    statement: Partial<InsertStatement>,
  ): Promise<Statement | undefined>;
  getStatement(id: string): Promise<Statement | undefined>;

  // Budget Periods
  getBudgetPeriods(): Promise<BudgetPeriod[]>;
  createBudgetPeriod(budgetPeriod: InsertBudgetPeriod): Promise<BudgetPeriod>;
  updateBudgetPeriod(
    id: string,
    budgetPeriod: Partial<InsertBudgetPeriod>,
  ): Promise<BudgetPeriod | undefined>;
  deleteBudgetPeriod(id: string): Promise<boolean>;

  // Analytics
  getSpendingByCategory(): Promise<
    { categoryId: string; total: number; category: Category }[]
  >;
  getMonthlySpending(): Promise<{ month: string; total: number }[]>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category>;
  private partners: Map<string, Partner>;
  private expenses: Map<string, Expense>;
  private statements: Map<string, Statement>;
  private budgetPeriods: Map<string, BudgetPeriod>;

  constructor() {
    this.categories = new Map();
    this.partners = new Map();
    this.expenses = new Map();
    this.statements = new Map();
    this.budgetPeriods = new Map();

    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Default categories
    const defaultCategories = [
      { name: "Groceries", emoji: "🛒", color: "#3B82F6", budget: "500.00", monthlyBudget: "500.00" },
      { name: "Eating out", emoji: "🍽️", color: "#F59E0B", budget: "250.00", monthlyBudget: "250.00" },
      { name: "Entertainment", emoji: "🎬", color: "#8B5CF6", budget: "200.00", monthlyBudget: "200.00" },
      { name: "Subscription", emoji: "📱", color: "#10B981", budget: "150.00", monthlyBudget: "150.00" },
      { name: "Gifts", emoji: "🎁", color: "#EF4444", budget: "200.00", monthlyBudget: "200.00" },
      { name: "Potluck", emoji: "🫕", color: "#F97316", budget: "100.00", monthlyBudget: "100.00" },
      { name: "Charity", emoji: "❤️", color: "#EC4899", budget: "100.00", monthlyBudget: "100.00" },
      { name: "Transport", emoji: "🚗", color: "#84CC16", budget: "300.00", monthlyBudget: "300.00" },
      { name: "Vacation", emoji: "✈️", color: "#06B6D4", budget: "800.00", monthlyBudget: "800.00" },
      { name: "Emergency spending", emoji: "🚨", color: "#DC2626", budget: "500.00", monthlyBudget: "500.00" },
      { name: "Babysitting", emoji: "👶", color: "#A855F7", budget: "200.00", monthlyBudget: "200.00" },
      { name: "Housekeeping", emoji: "🧹", color: "#059669", budget: "150.00", monthlyBudget: "150.00" },
      { name: "Supplement/medicine", emoji: "💊", color: "#0891B2", budget: "100.00", monthlyBudget: "100.00" },
    ];

    const categoryIds: string[] = [];
    defaultCategories.forEach((cat) => {
      const id = randomUUID();
      categoryIds.push(id);
      this.categories.set(id, { ...cat, id });
    });

    // Default partners
    const defaultPartners = [
      { name: "Sarah", color: "#8B5CF6" },
      { name: "Mike", color: "#F59E0B" },
    ];

    const partnerIds: string[] = [];
    defaultPartners.forEach((partner) => {
      const id = randomUUID();
      partnerIds.push(id);
      this.partners.set(id, { ...partner, id });
    });

    // Generate mock expenses for testing
    this.generateMockExpenses(categoryIds, partnerIds);
  }

  private generateMockExpenses(categoryIds: string[], partnerIds: string[]) {
    const mockExpenses = [
      // Current month - Groceries (0) - OVER BUDGET ($500)
      {
        amount: "185.32",
        description: "Weekly groceries - Whole Foods",
        categoryIndex: 0,
        partnerIndex: 0,
        daysAgo: 1,
      },
      {
        amount: "192.15",
        description: "Grocery shopping - Safeway",
        categoryIndex: 0,
        partnerIndex: 1,
        daysAgo: 8,
      },
      {
        amount: "167.50",
        description: "Fresh produce and meat",
        categoryIndex: 0,
        partnerIndex: 0,
        daysAgo: 15,
      },
      // Eating out (1) - OVER BUDGET ($250)
      {
        amount: "120.00",
        description: "Date night dinner - Italian restaurant",
        categoryIndex: 1,
        partnerIndex: 0,
        daysAgo: 3,
      },
      {
        amount: "85.00",
        description: "Coffee and lunch meetings",
        categoryIndex: 1,
        partnerIndex: 1,
        daysAgo: 5,
      },
      {
        amount: "78.50",
        description: "Weekend brunch with friends",
        categoryIndex: 1,
        partnerIndex: 0,
        daysAgo: 12,
      },
      // Entertainment (2) - OVER BUDGET ($200)
      {
        amount: "95.00",
        description: "Movie tickets and dinner",
        categoryIndex: 2,
        partnerIndex: 1,
        daysAgo: 7,
      },
      {
        amount: "125.00",
        description: "Concert tickets",
        categoryIndex: 2,
        partnerIndex: 0,
        daysAgo: 20,
      },
      // Subscription (3) - EQUALS BUDGET ($150)
      {
        amount: "15.99",
        description: "Netflix subscription",
        categoryIndex: 3,
        partnerIndex: 1,
        daysAgo: 2,
      },
      {
        amount: "9.99",
        description: "Spotify Premium",
        categoryIndex: 3,
        partnerIndex: 0,
        daysAgo: 10,
      },
      {
        amount: "12.99",
        description: "Disney+ subscription",
        categoryIndex: 3,
        partnerIndex: 1,
        daysAgo: 18,
      },
      {
        amount: "111.03",
        description: "Annual Adobe Creative Suite",
        categoryIndex: 3,
        partnerIndex: 0,
        daysAgo: 25,
      },
      // Gifts (4) - UNDER BUDGET ($200)
      {
        amount: "75.00",
        description: "Birthday gift for Mom",
        categoryIndex: 4,
        partnerIndex: 0,
        daysAgo: 14,
      },
      {
        amount: "45.00",
        description: "Anniversary gift",
        categoryIndex: 4,
        partnerIndex: 1,
        daysAgo: 25,
      },
      // Potluck (5) - UNDER BUDGET ($100)
      {
        amount: "35.00",
        description: "Office potluck contribution",
        categoryIndex: 5,
        partnerIndex: 0,
        daysAgo: 9,
      },
      {
        amount: "28.50",
        description: "Friend's housewarming party",
        categoryIndex: 5,
        partnerIndex: 1,
        daysAgo: 22,
      },
      // Charity (6) - EQUALS BUDGET ($100)
      {
        amount: "100.00",
        description: "Monthly charity donation",
        categoryIndex: 6,
        partnerIndex: 0,
        daysAgo: 6,
      },
      // Transport (7) - UNDER BUDGET ($300)
      {
        amount: "45.50",
        description: "Gas station fill-up",
        categoryIndex: 7,
        partnerIndex: 1,
        daysAgo: 4,
      },
      {
        amount: "25.00",
        description: "Uber to airport",
        categoryIndex: 7,
        partnerIndex: 0,
        daysAgo: 11,
      },
      {
        amount: "60.00",
        description: "Car maintenance",
        categoryIndex: 7,
        partnerIndex: 1,
        daysAgo: 19,
      },
      // Vacation (8) - UNDER BUDGET ($800)
      {
        amount: "350.00",
        description: "Flight tickets to Portland",
        categoryIndex: 8,
        partnerIndex: 0,
        daysAgo: 16,
      },
      {
        amount: "180.00",
        description: "Hotel booking",
        categoryIndex: 8,
        partnerIndex: 1,
        daysAgo: 17,
      },
      // Emergency spending (9) - UNDER BUDGET ($500)
      {
        amount: "200.00",
        description: "Car repair - brake pads",
        categoryIndex: 9,
        partnerIndex: 0,
        daysAgo: 21,
      },
      // Babysitting (10) - UNDER BUDGET ($200)
      {
        amount: "80.00",
        description: "Weekend babysitter",
        categoryIndex: 10,
        partnerIndex: 1,
        daysAgo: 13,
      },
      // Housekeeping (11) - EQUALS BUDGET ($150)
      {
        amount: "150.00",
        description: "Monthly house cleaning",
        categoryIndex: 11,
        partnerIndex: 0,
        daysAgo: 24,
      },
      // Supplement/medicine (12) - UNDER BUDGET ($100)
      {
        amount: "45.00",
        description: "Vitamins and supplements",
        categoryIndex: 12,
        partnerIndex: 1,
        daysAgo: 23,
      },
      {
        amount: "25.00",
        description: "Pharmacy prescription",
        categoryIndex: 12,
        partnerIndex: 0,
        daysAgo: 20,
      },

      // Previous months - adjusted to have only 3 over-budget categories
      {
        amount: "120.00",
        description: "Monthly groceries bulk buy",
        categoryIndex: 0, // Groceries - TOTAL: 665.97 (OVER $500)
        partnerIndex: 0,
        daysAgo: 35,
      },
      {
        amount: "25.00",
        description: "Movie theater date",
        categoryIndex: 2, // Entertainment - TOTAL: 245.00 (OVER $200)
        partnerIndex: 1,
        daysAgo: 40,
      },
      {
        amount: "85.00",
        description: "Car service and oil change",
        categoryIndex: 7, // Transport - TOTAL: 215.50 (UNDER $300)
        partnerIndex: 0,
        daysAgo: 45,
      },
      {
        amount: "15.00",
        description: "Anniversary dinner celebration",
        categoryIndex: 1, // Eating out - TOTAL: 298.50 (OVER $250)
        partnerIndex: 1,
        daysAgo: 50,
      },
      {
        amount: "35.00",
        description: "Wedding gift for cousin",
        categoryIndex: 4, // Gifts - TOTAL: 155.00 (UNDER $200)
        partnerIndex: 0,
        daysAgo: 55,
      },

      {
        amount: "30.00",
        description: "Small grocery run",
        categoryIndex: 0, // Groceries
        partnerIndex: 1,
        daysAgo: 65,
      },
      {
        amount: "20.00",
        description: "Streaming movie rental",
        categoryIndex: 2, // Entertainment
        partnerIndex: 0,
        daysAgo: 70,
      },
      {
        amount: "45.00",
        description: "Gas fill-up",
        categoryIndex: 7, // Transport
        partnerIndex: 1,
        daysAgo: 75,
      },
      {
        amount: "25.00",
        description: "Coffee with friend",
        categoryIndex: 1, // Eating out
        partnerIndex: 0,
        daysAgo: 80,
      },
      {
        amount: "150.00",
        description: "Weekend getaway hotel",
        categoryIndex: 8, // Vacation - TOTAL: 680.00 (UNDER $800)
        partnerIndex: 1,
        daysAgo: 85,
      },

      // 3 months ago
      {
        amount: "450.00",
        description: "Big grocery trip",
        categoryIndex: 0,
        partnerIndex: 0,
        daysAgo: 95,
      },
      {
        amount: "120.00",
        description: "Entertainment",
        categoryIndex: 3,
        partnerIndex: 1,
        daysAgo: 100,
      },
      {
        amount: "75.00",
        description: "Gas and parking",
        categoryIndex: 2,
        partnerIndex: 0,
        daysAgo: 105,
      },
      {
        amount: "200.00",
        description: "Weekend getaway meals",
        categoryIndex: 1,
        partnerIndex: 1,
        daysAgo: 110,
      },

      // 4 months ago
      {
        amount: "520.00",
        description: "Monthly shopping",
        categoryIndex: 0,
        partnerIndex: 1,
        daysAgo: 125,
      },
      {
        amount: "95.00",
        description: "Gaming subscription",
        categoryIndex: 3,
        partnerIndex: 0,
        daysAgo: 130,
      },
      {
        amount: "140.00",
        description: "Winter coat",
        categoryIndex: 4,
        partnerIndex: 1,
        daysAgo: 135,
      },

      // 5 months ago
      {
        amount: "350.00",
        description: "Groceries",
        categoryIndex: 0,
        partnerIndex: 0,
        daysAgo: 155,
      },
      {
        amount: "200.00",
        description: "Holiday dining",
        categoryIndex: 1,
        partnerIndex: 1,
        daysAgo: 160,
      },
      {
        amount: "85.00",
        description: "Transportation",
        categoryIndex: 2,
        partnerIndex: 0,
        daysAgo: 165,
      },
    ];

    // Create expense objects with proper dates
    mockExpenses.forEach((mockExpense, index) => {
      const expenseDate = new Date();
      expenseDate.setDate(expenseDate.getDate() - mockExpense.daysAgo);

      const expense: Expense = {
        id: `mock_expense_${index + 1}`,
        amount: mockExpense.amount,
        description: mockExpense.description,
        categoryId: categoryIds[mockExpense.categoryIndex] || categoryIds[0],
        partnerId: partnerIds[mockExpense.partnerIndex] || partnerIds[0],
        date: expenseDate,
        createdAt: new Date(),
        statementId: null,
        isVerified: 'verified',
        originalAmount: null,
      };

      this.expenses.set(expense.id, expense);
    });
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { 
      ...insertCategory, 
      id,
      budget: insertCategory.budget ?? null,
      monthlyBudget: insertCategory.monthlyBudget ?? null
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(
    id: string,
    updateData: Partial<InsertCategory>,
  ): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updated = { ...category, ...updateData };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getPartners(): Promise<Partner[]> {
    return Array.from(this.partners.values());
  }

  async createPartner(insertPartner: InsertPartner): Promise<Partner> {
    const id = randomUUID();
    const partner: Partner = { ...insertPartner, id };
    this.partners.set(id, partner);
    return partner;
  }

  async updatePartner(id: string, updateData: Partial<InsertPartner>): Promise<Partner | undefined> {
    const existing = this.partners.get(id);
    if (!existing) return undefined;
    
    const updated: Partner = { ...existing, ...updateData };
    this.partners.set(id, updated);
    return updated;
  }

  async deletePartner(id: string): Promise<boolean> {
    return this.partners.delete(id);
  }

  async getExpenses(): Promise<
    (Expense & { category: Category; partner: Partner })[]
  > {
    const expenses = Array.from(this.expenses.values());
    return expenses
      .map((expense) => {
        const category = this.categories.get(expense.categoryId);
        const partner = this.partners.get(expense.partnerId);
        return {
          ...expense,
          category: category || {
            id: "",
            name: "Unknown",
            emoji: "❓",
            color: "#6B7280",
            budget: null,
            monthlyBudget: null,
          },
          partner: partner || { id: "", name: "Unknown", color: "#6B7280" },
        };
      })
      .sort((a, b) => {
        // Ensure dates are valid before comparing
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;

        return dateB.getTime() - dateA.getTime();
      });
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = {
      ...insertExpense,
      id,
      date: insertExpense.date ? new Date(insertExpense.date) : new Date(),
      createdAt: new Date(),
      statementId: insertExpense.statementId ?? null,
      isVerified: insertExpense.isVerified ?? "pending",
      originalAmount: insertExpense.originalAmount ?? null,
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(
    id: string,
    updateData: Partial<InsertExpense>,
  ): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;

    const updated = {
      ...expense,
      ...updateData,
      date: updateData.date ? new Date(updateData.date) : expense.date,
    };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }

  async getSpendingByCategory(): Promise<
    { categoryId: string; total: number; category: Category }[]
  > {
    const spendingMap = new Map<string, number>();

    for (const expense of Array.from(this.expenses.values())) {
      const current = spendingMap.get(expense.categoryId) || 0;
      spendingMap.set(expense.categoryId, current + parseFloat(expense.amount));
    }

    return Array.from(spendingMap.entries()).map(([categoryId, total]) => {
      const category = this.categories.get(categoryId);
      return {
        categoryId,
        total,
        category: category || {
          id: categoryId,
          name: "Unknown",
          emoji: "❓",
          color: "#6B7280",
          budget: null,
          monthlyBudget: null,
        },
      };
    });
  }

  async getMonthlySpending(): Promise<{ month: string; total: number }[]> {
    const monthlyMap = new Map<string, number>();

    for (const expense of Array.from(this.expenses.values())) {
      const month = new Date(expense.date).toISOString().slice(0, 7); // YYYY-MM
      const current = monthlyMap.get(month) || 0;
      monthlyMap.set(month, current + parseFloat(expense.amount));
    }

    return Array.from(monthlyMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // Statements
  async getStatements(): Promise<Statement[]> {
    return Array.from(this.statements.values());
  }

  async createStatement(insertStatement: InsertStatement): Promise<Statement> {
    const id = randomUUID();
    const statement: Statement = {
      ...insertStatement,
      id,
      uploadedAt: new Date(),
      processedAt: null,
      status: insertStatement.status ?? "pending",
      totalTransactions: insertStatement.totalTransactions ?? null,
      processedTransactions: insertStatement.processedTransactions ?? null,
      errorMessage: insertStatement.errorMessage ?? null,
    };
    this.statements.set(id, statement);
    return statement;
  }

  async updateStatement(
    id: string,
    updateData: Partial<InsertStatement>,
  ): Promise<Statement | undefined> {
    const statement = this.statements.get(id);
    if (!statement) return undefined;

    const updated = { ...statement, ...updateData };
    this.statements.set(id, updated);
    return updated;
  }

  async getStatement(id: string): Promise<Statement | undefined> {
    return this.statements.get(id);
  }

  // New methods for expense verification and budget periods
  async getExpensesByStatement(statementId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      expense => expense.statementId === statementId
    );
  }

  async getBudgetPeriods(): Promise<BudgetPeriod[]> {
    return Array.from(this.budgetPeriods.values()).sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }

  async createBudgetPeriod(insertBudgetPeriod: InsertBudgetPeriod): Promise<BudgetPeriod> {
    const id = randomUUID();
    const budgetPeriod: BudgetPeriod = {
      ...insertBudgetPeriod,
      id,
      startDate: new Date(insertBudgetPeriod.startDate),
      endDate: new Date(insertBudgetPeriod.endDate),
      isActive: insertBudgetPeriod.isActive ?? 0,
      createdAt: new Date(),
    };
    this.budgetPeriods.set(id, budgetPeriod);
    return budgetPeriod;
  }

  async updateBudgetPeriod(
    id: string,
    updateData: Partial<InsertBudgetPeriod>,
  ): Promise<BudgetPeriod | undefined> {
    const budgetPeriod = this.budgetPeriods.get(id);
    if (!budgetPeriod) return undefined;

    const updated = {
      ...budgetPeriod,
      ...updateData,
      startDate: updateData.startDate ? new Date(updateData.startDate) : budgetPeriod.startDate,
      endDate: updateData.endDate ? new Date(updateData.endDate) : budgetPeriod.endDate,
    };
    this.budgetPeriods.set(id, updated);
    return updated;
  }

  async deleteBudgetPeriod(id: string): Promise<boolean> {
    return this.budgetPeriods.delete(id);
  }
}

import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage for persistent data
export const storage = new DatabaseStorage();
