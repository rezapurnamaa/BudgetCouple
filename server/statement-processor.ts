import OpenAI from "openai";
import type { Category } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  suggestedCategoryId: string;
  confidence: number;
  originalAmount?: string; // Store original amount string for verification
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

    let date: string, amount: number, description: string, originalAmount: string;

    // Different CSV formats for different sources
    if (source.toLowerCase().includes('amex')) {
      // AMEX format: Date,Description,Amount
      date = this.parseDate(fields[0]);
      description = fields[1]?.replace(/"/g, '') || 'Unknown transaction';
      originalAmount = fields[2] || '0';
      amount = Math.abs(this.parseAmount(fields[2] || '0'));
    } else if (source.toLowerCase().includes('chase') || source.toLowerCase().includes('bank')) {
      // Chase/Bank format: Date,Description,Amount
      date = this.parseDate(fields[0]);
      description = fields[1]?.replace(/"/g, '') || 'Unknown transaction';
      originalAmount = fields[2] || '0';
      amount = Math.abs(this.parseAmount(fields[2] || '0'));
    } else {
      // Generic format
      date = this.parseDate(fields[0]);
      description = fields[1]?.replace(/"/g, '') || 'Unknown transaction';
      originalAmount = fields[2] || '0';
      amount = Math.abs(this.parseAmount(fields[2] || '0'));
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
      confidence,
      originalAmount: originalAmount.trim()
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

  private parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    
    // Remove quotes and currency symbols
    let cleaned = amountStr.replace(/["\$€£]/g, '').trim();
    
    // Handle European format (comma as decimal separator)
    // Examples: "47,40", "1.234,56", "1234,56"
    const europeanPattern = /^(\d{1,3}(?:\.\d{3})*),(\d{1,2})$/;
    const europeanMatch = cleaned.match(europeanPattern);
    
    if (europeanMatch) {
      // European format: convert "1.234,56" to "1234.56"
      const [, integerPart, decimalPart] = europeanMatch;
      cleaned = integerPart.replace(/\./g, '') + '.' + decimalPart;
    } else if (cleaned.includes(',') && !cleaned.includes('.')) {
      // Simple European format: "47,40" -> "47.40"
      const simpleEuropeanPattern = /^(\d+),(\d{1,2})$/;
      const simpleMatch = cleaned.match(simpleEuropeanPattern);
      if (simpleMatch) {
        const [, integerPart, decimalPart] = simpleMatch;
        cleaned = integerPart + '.' + decimalPart;
      }
    } else {
      // US format: remove commas (thousand separators)
      cleaned = cleaned.replace(/,/g, '');
    }
    
    const result = parseFloat(cleaned);
    return isNaN(result) ? 0 : result;
  }

  private parseDate(dateStr: string): string {
    // Handle various date formats, prioritizing European DD-MM-YYYY format
    const cleaned = dateStr.replace(/"/g, '').trim();
    
    // Try different formats in order of preference
    const formats = [
      { 
        pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/yyyy or MM/dd/yyyy
        handler: (match: RegExpMatchArray) => {
          const [, part1, part2, part3] = match;
          // Assume European format (DD/MM/yyyy) by default
          // If day > 12, swap to MM/dd format
          const day = parseInt(part1);
          const month = parseInt(part2);
          
          if (day > 12 && month <= 12) {
            // Must be MM/dd/yyyy (US format)
            return new Date(parseInt(part3), month - 1, day);
          } else {
            // Assume DD/MM/yyyy (European format)
            return new Date(parseInt(part3), month - 1, day);
          }
        }
      },
      { 
        pattern: /(\d{1,2})-(\d{1,2})-(\d{4})/,    // DD-MM-yyyy or MM-dd-yyyy
        handler: (match: RegExpMatchArray) => {
          const [, part1, part2, part3] = match;
          // Assume European format (DD-MM-yyyy) by default
          const day = parseInt(part1);
          const month = parseInt(part2);
          
          if (day > 12 && month <= 12) {
            // Must be MM-dd-yyyy (US format)
            return new Date(parseInt(part3), month - 1, day);
          } else {
            // Assume DD-MM-yyyy (European format)
            return new Date(parseInt(part3), month - 1, day);
          }
        }
      },
      { 
        pattern: /(\d{4})-(\d{1,2})-(\d{1,2})/,    // yyyy-MM-dd (ISO format)
        handler: (match: RegExpMatchArray) => {
          const [, year, month, day] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
    ];

    for (const format of formats) {
      const match = cleaned.match(format.pattern);
      if (match) {
        try {
          const date = format.handler(match);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch (error) {
          continue;
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
      { keywords: ['lidl', 'rewe', 'edeka', 'aldi', 'grocery', 'supermarket', 'market', 'food store', 'walmart', 'safeway', 'whole foods', 'netto', 'penny'], category: 'Groceries' },
      { keywords: ['restaurant', 'cafe', 'pizza', 'delivery', 'uber eats', 'doordash', 'lieferando', 'mcdonalds', 'burger', 'kfc', 'subway', 'bistro'], category: 'Eating out' },
      { keywords: ['movie', 'netflix', 'spotify', 'game', 'entertainment', 'cinema', 'theater', 'concert', 'amazon prime', 'disney'], category: 'Entertainment' },
      { keywords: ['subscription', 'monthly', 'adobe', 'software', 'saas', 'service', 'membership'], category: 'Subscription' },
      { keywords: ['bolt', 'uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'transit', 'transport', 'bvg', 'db bahn', 'train', 'bus'], category: 'Transport' },
      { keywords: ['gift', 'present', 'flower', 'card', 'geschenk'], category: 'Gifts' },
      { keywords: ['hotel', 'flight', 'travel', 'vacation', 'airbnb', 'booking', 'expedia', 'urlaub'], category: 'Vacation' },
      { keywords: ['pharmacy', 'medicine', 'drug', 'vitamin', 'health', 'apotheke', 'dm', 'rossmann'], category: 'Supplement/medicine' },
      { keywords: ['amazon', 'ebay', 'zalando', 'otto'], category: 'Entertainment' }, // General shopping
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