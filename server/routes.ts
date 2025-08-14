import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertExpenseSchema, 
  insertCategorySchema, 
  insertPartnerSchema,
  insertStatementSchema,
  insertBudgetPeriodSchema
} from "@shared/schema";
import multer from "multer";
import { StatementProcessor } from "./statement-processor";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/csv', 'text/plain'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      // Convert monthlyBudget to string if it's a number
      const requestData = {
        ...req.body,
        monthlyBudget: req.body.monthlyBudget !== undefined 
          ? String(req.body.monthlyBudget) 
          : undefined
      };
      
      const result = insertCategorySchema.safeParse(requestData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid category data", errors: result.error.errors });
      }
      
      const category = await storage.createCategory(result.data);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      console.log("PATCH /api/categories/:id body:", req.body);
      
      // Convert monthlyBudget to string if it's a number
      const requestData = {
        ...req.body,
        monthlyBudget: req.body.monthlyBudget !== undefined 
          ? String(req.body.monthlyBudget) 
          : undefined
      };
      
      const result = insertCategorySchema.partial().safeParse(requestData);
      if (!result.success) {
        console.log("Validation errors:", result.error.errors);
        return res.status(400).json({ message: "Invalid category data", errors: result.error.errors });
      }
      
      const category = await storage.updateCategory(req.params.id, result.data);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Partners
  app.get("/api/partners", async (req, res) => {
    try {
      const partners = await storage.getPartners();
      res.json(partners);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.post("/api/partners", async (req, res) => {
    try {
      const result = insertPartnerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid partner data", errors: result.error.errors });
      }
      
      const partner = await storage.createPartner(result.data);
      res.status(201).json(partner);
    } catch (error) {
      res.status(500).json({ message: "Failed to create partner" });
    }
  });

  app.patch("/api/partners/:id", async (req, res) => {
    try {
      const result = insertPartnerSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid partner data", errors: result.error.errors });
      }
      
      const partner = await storage.updatePartner(req.params.id, result.data);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      res.json(partner);
    } catch (error) {
      res.status(500).json({ message: "Failed to update partner" });
    }
  });

  app.delete("/api/partners/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePartner(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Partner not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete partner" });
    }
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const result = insertExpenseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid expense data", errors: result.error.errors });
      }
      
      const expense = await storage.createExpense(result.data);
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const result = insertExpenseSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid expense data", errors: result.error.errors });
      }
      
      const expense = await storage.updateExpense(req.params.id, result.data);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteExpense(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Statements
  app.get("/api/statements", async (req, res) => {
    try {
      const statements = await storage.getStatements();
      res.json(statements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statements" });
    }
  });

  app.post("/api/statements/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { source, defaultPartnerId } = req.body;
      
      if (!source) {
        return res.status(400).json({ message: "Source is required (e.g., 'amex', 'chase', 'bank')" });
      }

      // Create statement record
      const statement = await storage.createStatement({
        fileName: req.file.originalname,
        fileType: 'csv',
        source: source.toLowerCase(),
        status: 'processing',
        totalTransactions: 0,
        processedTransactions: 0,
        errorMessage: null,
      });

      // Process the file asynchronously
      processStatementAsync(req.file.buffer.toString('utf8'), statement.id, source, defaultPartnerId);

      res.status(201).json({
        message: 'Statement uploaded successfully. Processing started.',
        statementId: statement.id
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to upload statement" });
    }
  });

  app.get("/api/statements/:id", async (req, res) => {
    try {
      const statement = await storage.getStatement(req.params.id);
      if (!statement) {
        return res.status(404).json({ message: "Statement not found" });
      }
      res.json(statement);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statement" });
    }
  });

  // Analytics
  app.get("/api/analytics/spending-by-category", async (req, res) => {
    try {
      const data = await storage.getSpendingByCategory();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spending data" });
    }
  });

  app.get("/api/analytics/monthly-spending", async (req, res) => {
    try {
      const data = await storage.getMonthlySpending();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly spending data" });
    }
  });

  // Expense verification routes
  app.get("/api/expenses/statement/:statementId", async (req, res) => {
    try {
      const expenses = await storage.getExpensesByStatement(req.params.statementId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statement expenses" });
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const result = insertExpenseSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid expense data", errors: result.error.errors });
      }
      
      const expense = await storage.updateExpense(req.params.id, result.data);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.post("/api/expenses/:id/verify", async (req, res) => {
    try {
      const { action } = req.body;
      if (!['verify', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }
      
      const expense = await storage.updateExpense(req.params.id, {
        isVerified: action === 'verify' ? 'verified' : 'rejected'
      });
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to verify expense" });
    }
  });

  // Budget period routes
  app.get("/api/budget-periods", async (req, res) => {
    try {
      const budgetPeriods = await storage.getBudgetPeriods();
      res.json(budgetPeriods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget periods" });
    }
  });

  app.post("/api/budget-periods", async (req, res) => {
    try {
      const result = insertBudgetPeriodSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid budget period data", errors: result.error.errors });
      }
      
      const budgetPeriod = await storage.createBudgetPeriod(result.data);
      res.status(201).json(budgetPeriod);
    } catch (error) {
      res.status(500).json({ message: "Failed to create budget period" });
    }
  });

  app.patch("/api/budget-periods/:id", async (req, res) => {
    try {
      const result = insertBudgetPeriodSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid budget period data", errors: result.error.errors });
      }
      
      const budgetPeriod = await storage.updateBudgetPeriod(req.params.id, result.data);
      if (!budgetPeriod) {
        return res.status(404).json({ message: "Budget period not found" });
      }
      
      res.json(budgetPeriod);
    } catch (error) {
      res.status(500).json({ message: "Failed to update budget period" });
    }
  });

  app.delete("/api/budget-periods/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBudgetPeriod(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Budget period not found" });
      }
      
      res.json({ message: "Budget period deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete budget period" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Async function to process uploaded statements
async function processStatementAsync(
  csvContent: string, 
  statementId: string, 
  source: string, 
  defaultPartnerId?: string
) {
  try {
    console.log(`Processing statement ${statementId} from ${source}`);
    
    // Update status to processing
    await storage.updateStatement(statementId, { status: 'processing' });

    // Get categories and partners for processing
    const categories = await storage.getCategories();
    const partners = await storage.getPartners();
    
    if (categories.length === 0) {
      throw new Error('No categories found. Please add categories first.');
    }

    const processor = new StatementProcessor(categories);
    const transactions = await processor.parseCSVStatement(csvContent, source);

    console.log(`Parsed ${transactions.length} transactions`);

    // Update total transactions
    await storage.updateStatement(statementId, { 
      totalTransactions: transactions.length 
    });

    let processedCount = 0;
    const errors: string[] = [];

    // Process each transaction
    for (const transaction of transactions) {
      try {
        // Use provided default partner or first available partner
        const partnerId = defaultPartnerId || partners[0]?.id;
        
        if (!partnerId) {
          errors.push(`No partner available for transaction: ${transaction.description}`);
          continue;
        }

        await storage.createExpense({
          amount: transaction.amount.toString(),
          description: transaction.description,
          categoryId: transaction.suggestedCategoryId,
          partnerId: partnerId,
          date: transaction.date,
          statementId: statementId,
          isVerified: 'pending',
          originalAmount: transaction.originalAmount || transaction.amount.toString(),
        });

        processedCount++;

        // Update progress every 10 transactions
        if (processedCount % 10 === 0) {
          await storage.updateStatement(statementId, {
            processedTransactions: processedCount,
          });
        }
      } catch (error) {
        console.error(`Failed to create expense:`, error);
        errors.push(`Failed to process: ${transaction.description}`);
      }
    }

    // Update final status
    const status = errors.length > 0 ? 'completed' : 'completed';
    const errorMessage = errors.length > 0 ? `${errors.length} errors occurred` : null;

    await storage.updateStatement(statementId, {
      status,
      processedTransactions: processedCount,
      processedAt: new Date(),
      errorMessage,
    });

    console.log(`Completed processing statement ${statementId}: ${processedCount}/${transactions.length} transactions processed`);
  } catch (error) {
    console.error(`Failed to process statement ${statementId}:`, error);
    await storage.updateStatement(statementId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      processedAt: new Date(),
    });
  }
}
