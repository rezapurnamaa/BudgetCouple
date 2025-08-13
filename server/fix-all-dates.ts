import { db } from "./db";
import { expenses } from "@shared/schema";
import { eq } from "drizzle-orm";

async function fixAllDates() {
  console.log("Fixing ALL statement dates to proper June-July 2025 range...");
  
  try {
    // Get all expenses from the most recent statement
    const statementExpenses = await db.select().from(expenses).where(eq(expenses.statementId, "8efdde83-2c35-4582-bf61-02c84b2741b8"));
    
    console.log(`Found ${statementExpenses.length} expenses to analyze`);
    
    // Group by current parsed dates to see the patterns
    const dateGroups: { [key: string]: number } = {};
    statementExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      dateGroups[dateKey] = (dateGroups[dateKey] || 0) + 1;
    });
    
    console.log("\nCurrent date distribution:");
    Object.entries(dateGroups).forEach(([dateKey, count]) => {
      const [year, month, day] = dateKey.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      console.log(`  ${date.toLocaleDateString('en-GB')}: ${count} expenses`);
    });
    
    let fixedCount = 0;
    
    for (const expense of statementExpenses) {
      const currentDate = new Date(expense.date);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-based
      const day = currentDate.getDate();
      
      // The original CSV likely had dates in DD/MM/YYYY format for June-July 2025
      // But they got parsed as MM/DD/YYYY, causing various wrong interpretations
      
      let correctedDate: Date | null = null;
      
      if (year === 2025) {
        if (month === 11 && day === 6) {
          // December 6, 2025 was originally 06/12/2025 -> should be 12 June 2025
          correctedDate = new Date(2025, 5, 12); // June 12
        } else if (month === 10 && (day >= 1 && day <= 30)) {
          // November dates were originally June dates (06/XX/2025 parsed as XX/06/2025 = November XX)
          correctedDate = new Date(2025, 5, day); // June
        } else if (month === 6 && (day >= 1 && day <= 31)) {
          // July dates were originally July dates (07/XX/2025 parsed as XX/07/2025 = July XX)
          correctedDate = new Date(2025, 6, day); // July - this might be correct already
        }
        
        if (correctedDate && correctedDate.getTime() !== currentDate.getTime()) {
          await db.update(expenses)
            .set({ date: correctedDate })
            .where(eq(expenses.id, expense.id));
          
          fixedCount++;
          
          if (fixedCount <= 10) { // Show first 10 changes
            console.log(`Fixed: ${expense.description?.slice(0, 30)}...`);
            console.log(`  ${currentDate.toLocaleDateString('en-GB')} -> ${correctedDate.toLocaleDateString('en-GB')}`);
          }
        }
      }
    }
    
    console.log(`\nFixed ${fixedCount} expense dates`);
    
    // Show the new date distribution
    const updatedExpenses = await db.select().from(expenses).where(eq(expenses.statementId, "8efdde83-2c35-4582-bf61-02c84b2741b8"));
    const newDateGroups: { [key: string]: number } = {};
    
    updatedExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      newDateGroups[dateKey] = (newDateGroups[dateKey] || 0) + 1;
    });
    
    console.log("\nNew date distribution by month:");
    Object.entries(newDateGroups).forEach(([dateKey, count]) => {
      const [year, month] = dateKey.split('-').map(Number);
      const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      console.log(`  ${monthName}: ${count} expenses`);
    });
    
  } catch (error) {
    console.error("Error fixing dates:", error);
  }
}

fixAllDates();