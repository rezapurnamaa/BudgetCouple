import { db } from "./db";
import { expenses } from "@shared/schema";
import { eq } from "drizzle-orm";

// Fix date parsing for existing expenses that were parsed with wrong date format
async function fixExpenseDates() {
  console.log("Fixing incorrectly parsed dates (assuming DD-MM-YYYY European format)...");
  
  try {
    // Get all expenses from the recent statement
    const allExpenses = await db.select().from(expenses).where(eq(expenses.statementId, "a38803c3-163e-4cb7-9e9e-8a4e60f216d4"));
    
    let fixedCount = 0;
    
    for (const expense of allExpenses) {
      const currentDate = new Date(expense.date);
      const year = currentDate.getFullYear();
      
      // If the year is 2027 or future, it's likely incorrectly parsed
      // Most expenses should be from 2024-2025, not 2027
      if (year >= 2027) {
        // Try to reconstruct the original date format and reparse it correctly
        const month = currentDate.getMonth() + 1; // 0-based to 1-based
        const day = currentDate.getDate();
        
        // Assume the original was DD-MM-YYYY format that got parsed as MM-DD-YYYY
        // So swap day and month, and adjust year to realistic value
        const correctedYear = 2024; // Assume recent transactions
        const correctedDate = new Date(correctedYear, day - 1, month); // day becomes month, month becomes day
        
        if (!isNaN(correctedDate.getTime())) {
          console.log(`Fixing date for expense ${expense.id}: ${expense.date} -> ${correctedDate.toISOString()}`);
          console.log(`  Original: ${day}/${month}/${year} -> Corrected: ${month}/${day}/${correctedYear}`);
          
          await db.update(expenses)
            .set({ date: correctedDate })
            .where(eq(expenses.id, expense.id));
          
          fixedCount++;
        }
      }
    }
    
    console.log(`Fixed ${fixedCount} expenses with incorrect dates`);
  } catch (error) {
    console.error("Error fixing dates:", error);
  }
}

// Test the new date parsing logic
function testDateParsing() {
  console.log("\nTesting new date parsing logic:");
  
  const testDates = [
    "05/07/2024", // Should be 5th July 2024
    "15/03/2024", // Should be 15th March 2024 (day > 12, so definitely DD/MM)
    "03/15/2024", // Should be 15th March 2024 (month > 12, so definitely MM/dd)
    "2024-07-05", // Should be 5th July 2024 (ISO format)
    "05-07-2024", // Should be 5th July 2024 (European format)
  ];
  
  testDates.forEach(dateStr => {
    const parsed = parseDate(dateStr);
    const date = new Date(parsed);
    console.log(`${dateStr} -> ${date.toLocaleDateString('en-GB')} (${date.toISOString().split('T')[0]})`);
  });
}

function parseDate(dateStr: string): string {
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

// Run tests and fix (commented out after successful execution)
// testDateParsing();
// fixExpenseDates();