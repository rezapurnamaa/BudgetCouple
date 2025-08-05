import { type Category, type InsertCategory, type Partner, type InsertPartner, type Expense, type InsertExpense } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Partners
  getPartners(): Promise<Partner[]>;
  createPartner(partner: InsertPartner): Promise<Partner>;

  // Expenses
  getExpenses(): Promise<(Expense & { category: Category; partner: Partner })[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  
  // Analytics
  getSpendingByCategory(): Promise<{ categoryId: string; total: number; category: Category }[]>;
  getMonthlySpending(): Promise<{ month: string; total: number }[]>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category>;
  private partners: Map<string, Partner>;
  private expenses: Map<string, Expense>;

  constructor() {
    this.categories = new Map();
    this.partners = new Map();
    this.expenses = new Map();
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Default categories
    const defaultCategories = [
      { name: "Grocery", emoji: "🛒", color: "#3B82F6", budget: "800.00" },
      { name: "Eating Out", emoji: "🍽️", color: "#F59E0B", budget: "300.00" },
      { name: "Transportation", emoji: "🚗", color: "#EF4444", budget: "400.00" },
      { name: "Subscriptions", emoji: "📱", color: "#8B5CF6", budget: "200.00" },
      { name: "Housing", emoji: "🏠", color: "#10B981", budget: "1200.00" },
      { name: "Other", emoji: "📝", color: "#6B7280", budget: "500.00" },
    ];

    defaultCategories.forEach(cat => {
      const id = randomUUID();
      this.categories.set(id, { ...cat, id });
    });

    // Default partners
    const defaultPartners = [
      { name: "Sarah", color: "#8B5CF6" },
      { name: "Mike", color: "#F59E0B" },
    ];

    defaultPartners.forEach(partner => {
      const id = randomUUID();
      this.partners.set(id, { ...partner, id });
    });
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
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

  async getExpenses(): Promise<(Expense & { category: Category; partner: Partner })[]> {
    const expenses = Array.from(this.expenses.values());
    return expenses.map(expense => {
      const category = this.categories.get(expense.categoryId)!;
      const partner = this.partners.get(expense.partnerId)!;
      return { ...expense, category, partner };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = {
      ...insertExpense,
      id,
      date: insertExpense.date ? new Date(insertExpense.date) : new Date(),
      createdAt: new Date(),
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: string, updateData: Partial<InsertExpense>): Promise<Expense | undefined> {
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

  async getSpendingByCategory(): Promise<{ categoryId: string; total: number; category: Category }[]> {
    const spendingMap = new Map<string, number>();
    
    for (const expense of this.expenses.values()) {
      const current = spendingMap.get(expense.categoryId) || 0;
      spendingMap.set(expense.categoryId, current + parseFloat(expense.amount));
    }

    return Array.from(spendingMap.entries()).map(([categoryId, total]) => ({
      categoryId,
      total,
      category: this.categories.get(categoryId)!,
    }));
  }

  async getMonthlySpending(): Promise<{ month: string; total: number }[]> {
    const monthlyMap = new Map<string, number>();
    
    for (const expense of this.expenses.values()) {
      const month = new Date(expense.date).toISOString().slice(0, 7); // YYYY-MM
      const current = monthlyMap.get(month) || 0;
      monthlyMap.set(month, current + parseFloat(expense.amount));
    }

    return Array.from(monthlyMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}

export const storage = new MemStorage();
