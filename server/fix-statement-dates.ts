import { db } from "./db";
import { expenses } from "@shared/schema";
import { eq } from "drizzle-orm";

// Fix dates for the most recent statement - they should be June-July 2025, not December 2025
async function fixStatementDates() {
  console.log("Fixing statement dates - converting from December 2025 to June-July 2025...");
  
  try {
    // Get all expenses from the most recent statement
    const statementExpenses = await db.select().from(expenses).where(eq(expenses.statementId, "8efdde83-2c35-4582-bf61-02c84b2741b8"));
    
    console.log(`Found ${statementExpenses.length} expenses to fix`);
    
    let fixedCount = 0;
    
    for (const expense of statementExpenses) {
      const currentDate = new Date(expense.date);
      
      // If it's December 2025, it was likely parsed wrong
      if (currentDate.getFullYear() === 2025 && currentDate.getMonth() === 11) { // December = 11
        const day = currentDate.getDate();
        
        // Original format was likely DD/MM/YYYY where MM was 06 or 07 (June/July)
        // but got parsed as MM/DD/YYYY, so December 6th was originally 06/12 (6th December -> 12th June)
        
        let correctedMonth: number;
        if (day === 6) {
          // December 6th was originally 06/12 -> should be 12th June
          correctedMonth = 5; // June = 5 (0-based)
          const correctedDate = new Date(2025, correctedMonth, 12);
          
          console.log(`Fixing ${expense.description?.slice(0, 30)}...`);
          console.log(`  ${currentDate.toLocaleDateString('en-GB')} -> ${correctedDate.toLocaleDateString('en-GB')}`);
          
          await db.update(expenses)
            .set({ date: correctedDate })
            .where(eq(expenses.id, expense.id));
          
          fixedCount++;
        }
        // Add more patterns if we see other dates
      }
    }
    
    console.log(`Fixed ${fixedCount} expense dates`);
    
    // Show sample of fixed dates
    const sampleFixed = await db.select().from(expenses).where(eq(expenses.statementId, "8efdde83-2c35-4582-bf61-02c84b2741b8")).limit(5);
    
    console.log("\nSample of corrected dates:");
    sampleFixed.forEach((expense, i) => {
      const date = new Date(expense.date);
      console.log(`${i + 1}. ${expense.description?.slice(0, 40)} - ${date.toLocaleDateString('en-GB')}`);
    });
    
  } catch (error) {
    console.error("Error fixing dates:", error);
  }
}

fixStatementDates();