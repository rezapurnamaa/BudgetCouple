import { DatabaseStorage } from "./database-storage";

export async function initializeDatabase() {
  const storage = new DatabaseStorage();
  
  try {
    // Check if categories exist
    const existingCategories = await storage.getCategories();
    if (existingCategories.length > 0) {
      console.log('Database already initialized');
      return;
    }

    console.log('Initializing database with default data...');

    // Create default categories
    const defaultCategories = [
      { name: "Groceries", emoji: "🛒", color: "#3B82F6", budget: "500.00" },
      { name: "Eating out", emoji: "🍽️", color: "#F59E0B", budget: "250.00" },
      { name: "Entertainment", emoji: "🎬", color: "#8B5CF6", budget: "200.00" },
      { name: "Subscription", emoji: "📱", color: "#10B981", budget: "150.00" },
      { name: "Gifts", emoji: "🎁", color: "#EF4444", budget: "200.00" },
      { name: "Potluck", emoji: "🫕", color: "#F97316", budget: "100.00" },
      { name: "Charity", emoji: "❤️", color: "#EC4899", budget: "100.00" },
      { name: "Transport", emoji: "🚗", color: "#84CC16", budget: "300.00" },
      { name: "Vacation", emoji: "✈️", color: "#06B6D4", budget: "800.00" },
      { name: "Emergency spending", emoji: "🚨", color: "#DC2626", budget: "500.00" },
      { name: "Babysitting", emoji: "👶", color: "#A855F7", budget: "200.00" },
      { name: "Housekeeping", emoji: "🧹", color: "#059669", budget: "150.00" },
      { name: "Supplement/medicine", emoji: "💊", color: "#0891B2", budget: "100.00" },
    ];

    const createdCategories = [];
    for (const cat of defaultCategories) {
      const category = await storage.createCategory(cat);
      createdCategories.push(category);
    }

    // Create default partners
    const defaultPartners = [
      { name: "Reza", color: "#8B5CF6" },
      { name: "Luky", color: "#F59E0B" },
    ];

    const createdPartners = [];
    for (const partner of defaultPartners) {
      const createdPartner = await storage.createPartner(partner);
      createdPartners.push(createdPartner);
    }

    console.log(`Created ${createdCategories.length} categories and ${createdPartners.length} partners`);
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}