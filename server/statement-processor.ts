import OpenAI from "openai";
import type { Category, Partner } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  suggestedCategoryId: string;
  confidence: number;
  originalAmount?: string; // Store original amount string for verification
  sourceLabel?: string; // Auto-assigned based on statement source
  suggestedPartnerId?: string; // Auto-assigned partner based on statement data
  cardholderName?: string; // For AMEX statements
}

export class StatementProcessor {
  private categories: Category[];
  private partners: Partner[];

  constructor(categories: Category[], partners: Partner[] = []) {
    this.categories = categories;
    this.partners = partners;
  }

  async parseCSVStatement(csvContent: string, source: string): Promise<ParsedTransaction[]> {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('Invalid CSV format: no data rows found');
    }

    const transactions: ParsedTransaction[] = [];
    let headerFound = false;
    let headerIndex = -1;

    // Find the header row for DKB format
    if (source.toLowerCase().includes('dkb')) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('Buchungsdatum') && line.includes('Betrag (€)')) {
          headerFound = true;
          headerIndex = i;
          console.log(`Found DKB header at line ${i}: ${line}`);
          break;
        }
      }

      if (!headerFound) {
        throw new Error('DKB CSV header not found. Expected format with "Buchungsdatum" and "Betrag (€)" columns.');
      }

      // Start parsing from after the header
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.length < 10) continue; // Skip empty or very short lines

        try {
          const transaction = await this.parseTransactionLine(line, source);
          if (transaction) {
            transactions.push(transaction);
          }
        } catch (error) {
          console.warn(`Failed to parse DKB line ${i}: ${line}`, error);
        }
      }
    } else if (source.toLowerCase().includes('amex')) {
      // AMEX format with specific columns: Datum,Beschreibung,Karteninhaber,Konto #,Betrag
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const transaction = await this.parseAmexTransactionLine(line, source);
          if (transaction) {
            transactions.push(transaction);
          }
        } catch (error) {
          console.warn(`Failed to parse AMEX line ${i}: ${line}`, error);
        }
      }
    } else {
      // Generic parsing for other formats - skip first row as header
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
    }

    return transactions;
  }

  private async parseTransactionLine(line: string, source: string): Promise<ParsedTransaction | null> {
    // Parse CSV line - handle quoted fields
    const fields = this.parseCSVLine(line);
    
    if (fields.length < 3) {
      return null;
    }

    let date: string, amount: number, description: string, originalAmount: string, sourceLabel: string;

    // Different CSV formats for different sources
    if (source.toLowerCase().includes('amex')) {
      // AMEX format: Date,Description,Amount
      date = this.parseDate(fields[0]);
      description = fields[1]?.replace(/"/g, '') || 'Unknown transaction';
      originalAmount = fields[2] || '0';
      amount = Math.abs(this.parseAmount(fields[2] || '0'));
      sourceLabel = 'AMEX';
    } else if (source.toLowerCase().includes('chase')) {
      // Chase format: Date,Description,Amount
      date = this.parseDate(fields[0]);
      description = fields[1]?.replace(/"/g, '') || 'Unknown transaction';
      originalAmount = fields[2] || '0';
      amount = Math.abs(this.parseAmount(fields[2] || '0'));
      sourceLabel = 'Chase';
    } else if (source.toLowerCase().includes('dkb')) {
      // DKB format: "Buchungsdatum";"Wertstellung";"Status";"Zahlungspflichtige*r";"Zahlungsempfänger*in";"Verwendungszweck";"Umsatztyp";"IBAN";"Betrag (€)";"Gläubiger-ID";"Mandatsreferenz";"Kundenreferenz"
      if (fields.length >= 9) {
        date = this.parseDate(fields[0]); // Buchungsdatum
        const payee = fields[4]?.replace(/"/g, '') || ''; // Zahlungsempfänger*in
        const purpose = fields[5]?.replace(/"/g, '') || ''; // Verwendungszweck  
        const transactionType = fields[6]?.replace(/"/g, '') || ''; // Umsatztyp
        
        // Create meaningful description by combining available info
        let descriptionParts = [];
        if (payee && payee !== 'ISSUER') descriptionParts.push(payee);
        if (purpose) descriptionParts.push(purpose);
        if (transactionType && transactionType !== 'Ausgang' && transactionType !== 'Eingang') {
          descriptionParts.push(`[${transactionType}]`);
        }
        
        description = descriptionParts.join(' - ') || 'DKB Transaction';
        originalAmount = fields[8] || '0'; // Betrag (EUR)
        amount = Math.abs(this.parseAmount(fields[8] || '0'));
        sourceLabel = 'DKB';
        
        console.log(`DKB transaction parsed: ${date}, ${description}, ${originalAmount}`);
      } else {
        console.warn(`DKB line has insufficient fields (${fields.length}): ${line.substring(0, 100)}...`);
        return null;
      }
    } else if (source.toLowerCase().includes('bank')) {
      // Generic Bank format: Date,Description,Amount
      date = this.parseDate(fields[0]);
      description = fields[1]?.replace(/"/g, '') || 'Unknown transaction';
      originalAmount = fields[2] || '0';
      amount = Math.abs(this.parseAmount(fields[2] || '0'));
      sourceLabel = 'Bank Transfer';
    } else if (source.toLowerCase().includes('paypal')) {
      // PayPal format: Date,Description,Amount
      date = this.parseDate(fields[0]);
      description = fields[1]?.replace(/"/g, '') || 'Unknown transaction';
      originalAmount = fields[2] || '0';
      amount = Math.abs(this.parseAmount(fields[2] || '0'));
      sourceLabel = 'PayPal';
    } else {
      // Generic format
      date = this.parseDate(fields[0]);
      description = fields[1]?.replace(/"/g, '') || 'Unknown transaction';
      originalAmount = fields[2] || '0';
      amount = Math.abs(this.parseAmount(fields[2] || '0'));
      sourceLabel = 'Bank Transfer';
    }

    if (amount === 0 || !description) {
      return null;
    }

    // Try fallback categorization first (faster, no API calls)
    const fallbackResult = this.fallbackCategorization(description);
    
    let categoryId = fallbackResult.categoryId;
    let confidence = fallbackResult.confidence;
    
    // Only use AI categorization if fallback confidence is low (< 0.6) or no match found
    if (confidence < 0.6) {
      console.log(`Low confidence (${confidence}) for "${description}", using AI categorization...`);
      const aiResult = await this.categorizeBusiness(description);
      categoryId = aiResult.categoryId;
      confidence = aiResult.confidence;
    }

    return {
      date,
      amount,
      description: description.trim(),
      suggestedCategoryId: categoryId,
      confidence,
      originalAmount: originalAmount.trim(),
      sourceLabel
    };
  }

  private async parseAmexTransactionLine(line: string, source: string): Promise<ParsedTransaction | null> {
    // AMEX format: Datum,Beschreibung,Karteninhaber,Konto #,Betrag
    const fields = this.parseCSVLine(line);
    
    if (fields.length < 5) {
      return null;
    }

    const dateStr = fields[0]?.replace(/"/g, '') || '';
    const description = fields[1]?.replace(/"/g, '') || 'Unknown transaction';
    const cardholderName = fields[2]?.replace(/"/g, '') || '';
    const accountNum = fields[3]?.replace(/"/g, '') || '';
    const amountStr = fields[4]?.replace(/"/g, '') || '0';

    // Parse date from DD/MM/YYYY format
    const date = this.parseDate(dateStr);
    const amount = Math.abs(this.parseAmount(amountStr));
    
    if (amount === 0 || !description) {
      return null;
    }

    // Find matching partner based on cardholder name
    const suggestedPartnerId = this.findPartnerByName(cardholderName);

    // Try fallback categorization first (faster, no API calls)
    const fallbackResult = this.fallbackCategorization(description);
    
    let categoryId = fallbackResult.categoryId;
    let confidence = fallbackResult.confidence;
    
    // Only use AI categorization if fallback confidence is low (< 0.6) or no match found
    if (confidence < 0.6) {
      console.log(`Low confidence (${confidence}) for "${description}", using AI categorization...`);
      const aiResult = await this.categorizeBusiness(description);
      categoryId = aiResult.categoryId;
      confidence = aiResult.confidence;
    }

    return {
      date,
      amount,
      description: description.trim(),
      suggestedCategoryId: categoryId,
      confidence,
      originalAmount: amountStr.trim(),
      sourceLabel: 'AMEX',
      suggestedPartnerId,
      cardholderName: cardholderName.trim()
    };
  }

  private findPartnerByName(cardholderName: string): string | undefined {
    if (!cardholderName || this.partners.length === 0) {
      return undefined;
    }

    // Try exact match first
    const exactMatch = this.partners.find(partner => 
      partner.name.toLowerCase() === cardholderName.toLowerCase()
    );
    if (exactMatch) {
      return exactMatch.id;
    }

    // Try partial match (contains name or name contains partner name)
    const partialMatch = this.partners.find(partner => {
      const partnerNameLower = partner.name.toLowerCase();
      const cardholderLower = cardholderName.toLowerCase();
      
      // Check if either name contains the other
      return partnerNameLower.includes(cardholderLower) || 
             cardholderLower.includes(partnerNameLower);
    });
    
    if (partialMatch) {
      console.log(`Found partner match: "${cardholderName}" -> "${partialMatch.name}"`);
      return partialMatch.id;
    }

    console.log(`No partner match found for cardholder: "${cardholderName}"`);
    return undefined;
  }

  private parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    // Detect separator: semicolon for DKB, comma for others
    const separator = line.includes(';') && line.split(';').length > line.split(',').length ? ';' : ',';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
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
        pattern: /(\d{1,2})\.(\d{1,2})\.(\d{2})$/,    // DD.MM.YY (DKB format)
        handler: (match: RegExpMatchArray) => {
          const [, day, month, year] = match;
          const fullYear = parseInt(year) + 2000; // Convert YY to 20YY
          return new Date(fullYear, parseInt(month) - 1, parseInt(day));
        }
      },
      { 
        pattern: /(\d{1,2})\.(\d{1,2})\.(\d{4})/,    // DD.MM.yyyy (European format)
        handler: (match: RegExpMatchArray) => {
          const [, day, month, year] = match;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      },
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
      { keywords: ['lidl', 'rewe', 'edeka', 'aldi', 'grocery', 'supermarket', 'market', 'food store', 'walmart', 'safeway', 'whole foods', 'netto', 'penny'], category: 'Groceries', confidence: 0.85 },
      { keywords: ['restaurant', 'cafe', 'pizza', 'delivery', 'uber eats', 'doordash', 'lieferando', 'mcdonalds', 'burger', 'kfc', 'subway', 'bistro'], category: 'Eating out', confidence: 0.85 },
      { keywords: ['netflix', 'spotify', 'amazon prime', 'disney', 'cinema', 'theater', 'concert'], category: 'Entertainment', confidence: 0.9 },
      { keywords: ['bolt', 'uber', 'lyft', 'taxi', 'bvg', 'db bahn'], category: 'Transport', confidence: 0.9 },
      { keywords: ['apotheke', 'dm', 'rossmann', 'pharmacy'], category: 'Supplement/medicine', confidence: 0.85 },
      { keywords: ['hotel', 'booking', 'expedia', 'airbnb', 'flight'], category: 'Vacation', confidence: 0.85 },
      { keywords: ['subscription', 'adobe', 'microsoft', 'saas'], category: 'Subscription', confidence: 0.8 },
      // Lower confidence patterns for broader matches
      { keywords: ['movie', 'game', 'entertainment'], category: 'Entertainment', confidence: 0.6 },
      { keywords: ['gas', 'fuel', 'parking', 'transit', 'transport', 'train', 'bus'], category: 'Transport', confidence: 0.6 },
      { keywords: ['gift', 'present', 'flower', 'card', 'geschenk'], category: 'Gifts', confidence: 0.7 },
      { keywords: ['amazon', 'ebay', 'zalando', 'otto'], category: 'Entertainment', confidence: 0.5 }, // General shopping - low confidence
      { keywords: ['medicine', 'drug', 'vitamin', 'health'], category: 'Supplement/medicine', confidence: 0.6 },
    ];

    // Check for high-confidence matches first
    for (const pattern of patterns) {
      for (const keyword of pattern.keywords) {
        if (desc.includes(keyword)) {
          const category = this.categories.find(cat => cat.name === pattern.category);
          if (category) {
            return { categoryId: category.id, confidence: pattern.confidence };
          }
        }
      }
    }

    // No match found - return default with low confidence to trigger AI categorization
    const defaultCategory = this.categories.find(cat => cat.name === 'Entertainment') || this.categories[0];
    return { 
      categoryId: defaultCategory?.id || '', 
      confidence: 0.3 
    };
  }
}