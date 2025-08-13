import { db } from "./db";
import { expenses } from "@shared/schema";
import { eq } from "drizzle-orm";

// Fix amount parsing for existing expenses that were parsed incorrectly
async function fixExpenseAmounts() {
  console.log("Fixing incorrectly parsed amounts...");
  
  try {
    // Get all expenses that have originalAmount data
    const allExpenses = await db.select().from(expenses).where(eq(expenses.statementId, "a38803c3-163e-4cb7-9e9e-8a4e60f216d4"));
    
    let fixedCount = 0;
    
    for (const expense of allExpenses) {
      if (expense.originalAmount) {
        const correctedAmount = parseAmount(expense.originalAmount);
        const currentAmount = parseFloat(expense.amount);
        
        // Only fix if the amounts don't match (indicating parsing error)
        if (Math.abs(correctedAmount - currentAmount) > 0.01) {
          console.log(`Fixing expense ${expense.id}: ${expense.originalAmount} -> ${correctedAmount} (was ${currentAmount})`);
          
          await db.update(expenses)
            .set({ amount: correctedAmount.toFixed(2) })
            .where(eq(expenses.id, expense.id));
          
          fixedCount++;
        }
      }
    }
    
    console.log(`Fixed ${fixedCount} expenses with incorrect amounts`);
  } catch (error) {
    console.error("Error fixing amounts:", error);
  }
}

function parseAmount(amountStr: string): number {
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

// Run the fix
// fixExpenseAmounts(); // Commented out after successful execution