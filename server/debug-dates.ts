import { db } from "./db";
import { expenses, statements } from "@shared/schema";
import { eq } from "drizzle-orm";

async function debugDates() {
  console.log("=== DEBUGGING DATE PARSING ===\n");
  
  // Get all statements to find the most recent one
  const allStatements = await db.select().from(statements).orderBy(statements.uploadedAt);
  console.log("All statements:", allStatements.map(s => ({ fileName: s.fileName, id: s.id, uploadedAt: s.uploadedAt })));
  
  if (allStatements.length === 0) {
    console.log("No statements found");
    return;
  }
  
  // Get the most recent statement (should be the one with 80 transactions)
  const statement = allStatements[allStatements.length - 1];
  console.log(`Latest statement: ${statement.fileName} (${statement.id})`);
  console.log(`Uploaded at: ${statement.uploadedAt}`);
  console.log(`Raw data exists: ${!!statement.rawData}`);
  if (statement.rawData) {
    console.log(`Raw data length: ${statement.rawData.length}`);
    console.log(`Raw data sample:`, statement.rawData.slice(0, 3));
  }
  
  // Get a sample of expenses from this statement
  const sampleExpenses = await db.select().from(expenses)
    .where(eq(expenses.statementId, statement.id))
    .limit(5);
  
  console.log("\n=== EXPENSE DATES ===");
  sampleExpenses.forEach((expense, i) => {
    const date = new Date(expense.date);
    console.log(`${i + 1}. ${expense.description}`);
    console.log(`   Date: ${expense.date}`);
    console.log(`   Parsed: ${date.toLocaleDateString('en-GB')} (${date.toLocaleDateString('en-US')})`);
    console.log(`   Year: ${date.getFullYear()}, Month: ${date.getMonth() + 1}, Day: ${date.getDate()}`);
    console.log("");
  });
  
  // Test the date parsing function with sample raw data
  if (statement.rawData && statement.rawData.length > 0) {
    console.log("=== TESTING DATE PARSING ===");
    const sampleRow = statement.rawData[0];
    console.log("Sample raw row:", sampleRow);
    
    // Extract date field (assuming it's in the first few columns)
    const dateFields = sampleRow.slice(0, 5);
    console.log("Date candidates:", dateFields);
    
    dateFields.forEach((field, i) => {
      if (field && typeof field === 'string' && field.match(/\d+[\/\-]\d+[\/\-]\d+/)) {
        console.log(`Testing field ${i}: "${field}"`);
        const parsed = testParseDate(field);
        const date = new Date(parsed);
        console.log(`  Result: ${date.toLocaleDateString('en-GB')} (${date.toLocaleDateString('en-US')})`);
      }
    });
  }
}

function testParseDate(dateStr: string): string {
  console.log(`\nParsing date: "${dateStr}"`);
  const cleaned = dateStr.replace(/"/g, '').trim();
  console.log(`Cleaned: "${cleaned}"`);
  
  // Try different formats in order of preference
  const formats = [
    { 
      pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/yyyy or MM/dd/yyyy
      handler: (match: RegExpMatchArray) => {
        const [, part1, part2, part3] = match;
        console.log(`  Pattern: DD/MM/yyyy or MM/dd/yyyy`);
        console.log(`  Parts: ${part1}, ${part2}, ${part3}`);
        
        // Assume European format (DD/MM/yyyy) by default
        // If day > 12, swap to MM/dd format
        const day = parseInt(part1);
        const month = parseInt(part2);
        
        if (day > 12 && month <= 12) {
          // Must be MM/dd/yyyy (US format)
          console.log(`  Interpreting as MM/dd/yyyy (US): ${month}/${day}/${part3}`);
          return new Date(parseInt(part3), month - 1, day);
        } else {
          // Assume DD/MM/yyyy (European format)
          console.log(`  Interpreting as DD/MM/yyyy (EU): ${day}/${month}/${part3}`);
          return new Date(parseInt(part3), month - 1, day);
        }
      }
    }
  ];

  for (const format of formats) {
    const match = cleaned.match(format.pattern);
    if (match) {
      try {
        const date = format.handler(match);
        console.log(`  Final date object: ${date}`);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (error) {
        console.log(`  Error: ${error}`);
        continue;
      }
    }
  }

  return new Date().toISOString();
}

debugDates();