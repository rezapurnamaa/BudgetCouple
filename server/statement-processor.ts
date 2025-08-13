import OpenAI from "openai";
import type { Category } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  suggestedCategoryId: string;
  confidence: number;
}

export class StatementProcessor {
  private categories: Category[];

  constructor(categories: Category[]) {
    this.categories = categories;
  }

  async parseCSVStatement(csvContent: string, source: string): Promise<ParsedTransaction[]> {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('Invalid CSV format: no data rows found');
    }

    const transactions: ParsedTransaction[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const transaction = await this.parseTransactionLine(line, source);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn(`Failed to parse line ${i}: ${line}`, error);
      }
    }

    return transactions;
  }

  private async parseTransactionLine(line: string, source: string): Promise<ParsedTransaction | null> {
    // Parse CSV line - handle quoted fields
    const fields = this.parseCSVLine(line);
    
    if (fields.length < 3) {
      return null;
    }

    let date: string, amount: number, description: string;

    // Different CSV formats for different sources
    if (source.toLowerCase().includes('amex')) {
      // AMEX format: Date,Description,Amount
      date = this.parseDate(fields[0]);
      description = fields[1]?.replace(/"/g, '') || 'Unknown transaction';
      amount = Math.abs(parseFloat(fields[2]?.replace(/[$,]/g, '') || '0'));
    } else if (source.toLowerCase().includes('chase') || source.toLowerCase().includes('bank')) {
      // Chase/Bank format: Date,Description,Amount
      date = this.parseDate(fields[0]);
      description = fields[1]?.replace(/"/g, '') || 'Unknown transaction';
      amount = Math.abs(parseFloat(fields[2]?.replace(/[$,]/g, '') || '0'));
    } else {
      // Generic format
      date = this.parseDate(fields[0]);
      description = fields[1]?.replace(/"/g, '') || 'Unknown transaction';
      amount = Math.abs(parseFloat(fields[2]?.replace(/[$,]/g, '') || '0'));
    }

    if (amount === 0 || !description) {
      return null;
    }

    // Get AI categorization
    const { categoryId, confidence } = await this.categorizeBusiness(description);

    return {
      date,
      amount,
      description: description.trim(),
      suggestedCategoryId: categoryId,
      confidence
    };
  }

  private parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current.trim());
    return fields;
  }

  private parseDate(dateStr: string): string {
    // Handle various date formats
    const cleaned = dateStr.replace(/"/g, '').trim();
    
    // Try different formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/dd/yyyy
      /(\d{4})-(\d{1,2})-(\d{1,2})/,    // yyyy-MM-dd
      /(\d{1,2})-(\d{1,2})-(\d{4})/,    // MM-dd-yyyy
    ];

    for (const format of formats) {
      const match = cleaned.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        
        // Determine if it's MM/dd/yyyy or yyyy-MM-dd
        if (part3.length === 4) {
          // MM/dd/yyyy format
          const date = new Date(parseInt(part3), parseInt(part1) - 1, parseInt(part2));
          return date.toISOString();
        } else if (part1.length === 4) {
          // yyyy-MM-dd format
          const date = new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
          return date.toISOString();
        }
      }
    }

    // Fallback to Date parsing
    try {
      const date = new Date(cleaned);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      // Ignore
    }

    // Default to today
    return new Date().toISOString();
  }

  private async categorizeBusiness(description: string): Promise<{ categoryId: string; confidence: number }> {
    try {
      const categoryList = this.categories.map(cat => `${cat.name} (${cat.emoji})`).join(', ');
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert at categorizing financial transactions for a couple's budget tracking app. Analyze the transaction description and categorize it into one of these categories: ${categoryList}.
            
            Return a JSON response with:
            - categoryName: the exact category name (not the emoji)
            - confidence: a number between 0 and 1 indicating how confident you are in this categorization
            
            Common patterns:
            - "Groceries" for supermarkets, food stores, markets
            - "Eating out" for restaurants, cafes, food delivery
            - "Entertainment" for movies, games, streaming, events
            - "Subscription" for monthly services, software, memberships
            - "Transport" for gas, uber, parking, public transit
            - "Gifts" for presents, flowers, gift cards
            - "Vacation" for hotels, flights, travel expenses
            - "Emergency spending" for urgent repairs, medical expenses
            - "Supplement/medicine" for pharmacy, vitamins, health products`
          },
          {
            role: "user",
            content: `Categorize this transaction: "${description}"`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const categoryName = result.categoryName || 'Entertainment';
      const confidence = Math.min(Math.max(result.confidence || 0.5, 0), 1);

      // Find matching category
      const category = this.categories.find(cat => 
        cat.name.toLowerCase() === categoryName.toLowerCase()
      ) || this.categories.find(cat => cat.name === 'Entertainment');

      return {
        categoryId: category?.id || this.categories[0]?.id || '',
        confidence
      };

    } catch (error) {
      console.error('AI categorization failed:', error);
      // Fallback to basic keyword matching
      return this.fallbackCategorization(description);
    }
  }

  private fallbackCategorization(description: string): { categoryId: string; confidence: number } {
    const desc = description.toLowerCase();
    
    const patterns = [
      { keywords: ['grocery', 'supermarket', 'market', 'food', 'walmart', 'safeway', 'whole foods'], category: 'Groceries' },
      { keywords: ['restaurant', 'cafe', 'pizza', 'delivery', 'uber eats', 'doordash'], category: 'Eating out' },
      { keywords: ['movie', 'netflix', 'spotify', 'game', 'entertainment'], category: 'Entertainment' },
      { keywords: ['subscription', 'monthly', 'adobe', 'software'], category: 'Subscription' },
      { keywords: ['gas', 'fuel', 'uber', 'lyft', 'parking', 'transit'], category: 'Transport' },
      { keywords: ['gift', 'present', 'flower', 'card'], category: 'Gifts' },
      { keywords: ['hotel', 'flight', 'travel', 'vacation', 'airbnb'], category: 'Vacation' },
      { keywords: ['pharmacy', 'medicine', 'drug', 'vitamin', 'health'], category: 'Supplement/medicine' },
    ];

    for (const pattern of patterns) {
      for (const keyword of pattern.keywords) {
        if (desc.includes(keyword)) {
          const category = this.categories.find(cat => cat.name === pattern.category);
          if (category) {
            return { categoryId: category.id, confidence: 0.7 };
          }
        }
      }
    }

    // Default to Entertainment
    const defaultCategory = this.categories.find(cat => cat.name === 'Entertainment') || this.categories[0];
    return { 
      categoryId: defaultCategory?.id || '', 
      confidence: 0.3 
    };
  }
}