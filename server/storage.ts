import {
  type Category,
  type InsertCategory,
  type Partner,
  type InsertPartner,
  type Expense,
  type InsertExpense,
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

  // Expenses
  getExpenses(): Promise<
    (Expense & { category: Category; partner: Partner })[]
  >;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(
    id: string,
    expense: Partial<InsertExpense>,
  ): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

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
      { name: "Groceries", emoji: "🛒", color: "#3B82F6", budget: "500.00" },
      { name: "Eating out", emoji: "🍽️", color: "#F59E0B", budget: "250.00" },
      { name: "Entertainment", emoji: "🎬", color: "#8B5CF6", budget: "200.00" },
      { name: "Subscription", emoji: "📱", color: "#10B981", budget: "150.00" },
      { name: "Gifts", emoji: "🎁", color: "#EF4444", budget: "200.00" },
      { name: "Potluck", emoji: "🫕", color: "#F97316", budget: "100.00" },
      { name: "Charity", emoji: "❤️", color: "#EC4899", budget: "100.00" },
      { name: "Additional transport", emoji: "🚗", color: "#84CC16", budget: "300.00" },
      { name: "Vacation", emoji: "✈️", color: "#06B6D4", budget: "800.00" },
      { name: "Emergency spending", emoji: "🚨", color: "#DC2626", budget: "500.00" },
      { name: "Babysitting", emoji: "👶", color: "#A855F7", budget: "200.00" },
      { name: "Housekeeping", emoji: "🧹", color: "#059669", budget: "150.00" },
      { name: "Supplement/medicine", emoji: "💊", color: "#0891B2", budget: "100.00" },
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
      // Current month - Groceries (0)
      {
        amount: "85.32",
        description: "Weekly groceries - Whole Foods",
        categoryIndex: 0,
        partnerIndex: 0,
        daysAgo: 1,
      },
      {
        amount: "92.15",
        description: "Grocery shopping - Safeway",
        categoryIndex: 0,
        partnerIndex: 1,
        daysAgo: 8,
      },
      {
        amount: "67.50",
        description: "Fresh produce and meat",
        categoryIndex: 0,
        partnerIndex: 0,
        daysAgo: 15,
      },
      // Eating out (1)
      {
        amount: "120.00",
        description: "Date night dinner - Italian restaurant",
        categoryIndex: 1,
        partnerIndex: 0,
        daysAgo: 3,
      },
      {
        amount: "35.00",
        description: "Coffee and lunch",
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
      // Entertainment (2)
      {
        amount: "45.00",
        description: "Movie tickets",
        categoryIndex: 2,
        partnerIndex: 1,
        daysAgo: 7,
      },
      {
        amount: "85.00",
        description: "Concert tickets",
        categoryIndex: 2,
        partnerIndex: 0,
        daysAgo: 20,
      },
      // Subscription (3)
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
      // Gifts (4)
      {
        amount: "150.00",
        description: "Birthday gift for Mom",
        categoryIndex: 4,
        partnerIndex: 0,
        daysAgo: 14,
      },
      {
        amount: "75.00",
        description: "Anniversary gift",
        categoryIndex: 4,
        partnerIndex: 1,
        daysAgo: 25,
      },
      // Potluck (5)
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
      // Charity (6)
      {
        amount: "100.00",
        description: "Monthly charity donation",
        categoryIndex: 6,
        partnerIndex: 0,
        daysAgo: 6,
      },
      // Additional transport (7)
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
      // Vacation (8)
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
      // Emergency spending (9)
      {
        amount: "400.00",
        description: "Car repair - brake pads",
        categoryIndex: 9,
        partnerIndex: 0,
        daysAgo: 21,
      },
      // Babysitting (10)
      {
        amount: "80.00",
        description: "Weekend babysitter",
        categoryIndex: 10,
        partnerIndex: 1,
        daysAgo: 13,
      },
      // Housekeeping (11)
      {
        amount: "120.00",
        description: "Monthly house cleaning",
        categoryIndex: 11,
        partnerIndex: 0,
        daysAgo: 24,
      },
      // Supplement/medicine (12)
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

      // Previous months
      {
        amount: "420.00",
        description: "Monthly groceries bulk buy",
        categoryIndex: 0, // Groceries
        partnerIndex: 0,
        daysAgo: 35,
      },
      {
        amount: "65.00",
        description: "Movie theater date",
        categoryIndex: 2, // Entertainment
        partnerIndex: 1,
        daysAgo: 40,
      },
      {
        amount: "200.00",
        description: "Car service and oil change",
        categoryIndex: 7, // Additional transport
        partnerIndex: 0,
        daysAgo: 45,
      },
      {
        amount: "180.00",
        description: "Anniversary dinner celebration",
        categoryIndex: 1, // Eating out
        partnerIndex: 1,
        daysAgo: 50,
      },
      {
        amount: "80.00",
        description: "Wedding gift for cousin",
        categoryIndex: 4, // Gifts
        partnerIndex: 0,
        daysAgo: 55,
      },
      {
        amount: "38.97",
        description: "Multiple streaming services",
        categoryIndex: 3, // Subscription
        partnerIndex: 1,
        daysAgo: 58,
      },
      {
        amount: "380.50",
        description: "Costco grocery shopping",
        categoryIndex: 0, // Groceries
        partnerIndex: 1,
        daysAgo: 65,
      },
      {
        amount: "155.00",
        description: "Broadway show tickets",
        categoryIndex: 2, // Entertainment
        partnerIndex: 0,
        daysAgo: 70,
      },
      {
        amount: "90.00",
        description: "Gas and car wash",
        categoryIndex: 7, // Additional transport
        partnerIndex: 1,
        daysAgo: 75,
      },
      {
        amount: "160.00",
        description: "Birthday dinner party",
        categoryIndex: 1, // Eating out
        partnerIndex: 0,
        daysAgo: 80,
      },
      {
        amount: "320.00",
        description: "Weekend getaway hotel",
        categoryIndex: 8, // Vacation
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
        date: expenseDate.toISOString(),
      };

      this.expenses.set(expense.id, expense);
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

    for (const expense of this.expenses.values()) {
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
        },
      };
    });
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
