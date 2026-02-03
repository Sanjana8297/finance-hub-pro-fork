import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  FileSpreadsheet,
  Trash2,
  Download,
  Calendar,
  DollarSign,
  Loader2,
  FileText,
  Eye,
  X,
  AlertCircle,
} from "lucide-react";
import { format, parse, addDays } from "date-fns";
import { useBankStatements, useBankStatementTransactions, useCreateBankStatement, useDeleteBankStatement } from "@/hooks/useStatements";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { useMemo } from "react";

const Statement = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteStatementId, setDeleteStatementId] = useState<string | null>(null);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingStatement, setViewingStatement] = useState<any>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [documentMetadata, setDocumentMetadata] = useState<any>(null);

  // Extract transaction date from metadata in its original format (e.g., "14-May-2025")
  const getTransactionDateFromMetadataOriginal = (metadata: any): string | null => {
    if (!metadata) return null;
    
    let dateStr: string | null = null;
    
    // Try to get from original_data first
    if (metadata.original_data && metadata.original_data["Transaction Date"]) {
      dateStr = metadata.original_data["Transaction Date"];
    } else if (metadata.all_columns && Array.isArray(metadata.all_columns)) {
      // Fallback: try to get from all_columns
      const transactionDateColumn = metadata.all_columns.find((col: any) => 
        col.header && col.header.toLowerCase().includes("transaction date")
      );
      if (transactionDateColumn && transactionDateColumn.value) {
        dateStr = transactionDateColumn.value;
      }
    }
    
    // Return the original date string format (e.g., "14-May-2025")
    return dateStr || null;
  };

  // Extract value date from metadata in its original format (e.g., "14-May-2025")
  const getValueDateFromMetadataOriginal = (metadata: any): string | null => {
    if (!metadata) return null;
    
    let dateStr: string | null = null;
    
    // Try to get from original_data first
    if (metadata.original_data && metadata.original_data["Value Date"]) {
      dateStr = metadata.original_data["Value Date"];
    } else if (metadata.all_columns && Array.isArray(metadata.all_columns)) {
      // Fallback: try to get from all_columns
      const valueDateColumn = metadata.all_columns.find((col: any) => 
        col.header && col.header.toLowerCase().includes("value date")
      );
      if (valueDateColumn && valueDateColumn.value) {
        dateStr = valueDateColumn.value;
      }
    }
    
    // Return the original date string format (e.g., "14-May-2025")
    return dateStr || null;
  };

  // Extract transaction date from metadata and convert to YYYY-MM-DD format (same logic as Transactions.tsx)
  const getTransactionDateFromMetadata = (metadata: any): string | null => {
    if (!metadata) return null;
    
    const dateStr = getTransactionDateFromMetadataOriginal(metadata);
    
    if (!dateStr) return null;
    
    // Helper function to format date using local components (avoid timezone issues)
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Manual parsing for format "DD-MMM-YYYY" (e.g., "14-May-2025") - preferred method
    const parts = String(dateStr).trim().split('-');
    if (parts.length === 3) {
      const day = parts[0].trim().padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = parts[1].trim();
      const month = monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
      const year = parts[2].trim();
      
      if (month >= 0 && day && year) {
        const monthStr = String(month + 1).padStart(2, '0');
        return `${year}-${monthStr}-${day}`;
      }
    }
    
    // Try standard Date parsing (fallback for other formats)
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        // Use local date components instead of toISOString() to avoid timezone shifts
        return formatDateLocal(date);
      }
    } catch (e) {
      // Ignore
    }
    
    return null;
  };

  // Component to calculate and display period from transactions (same logic as Transactions.tsx)
  const StatementPeriod = ({ statementId }: { statementId: string }) => {
    const { data: statementTransactions } = useBankStatementTransactions(statementId);
    
    const period = useMemo(() => {
      if (!statementTransactions || statementTransactions.length === 0) {
        return null;
      }
      
      // Type assertion for transactions array
      const transactions = statementTransactions as any[];
      
      // Sort transactions by date to get first and last
      const sortedTransactions = [...transactions].sort((a: any, b: any) => {
        const dateA = getTransactionDateFromMetadata(a.metadata) || a.transaction_date;
        const dateB = getTransactionDateFromMetadata(b.metadata) || b.transaction_date;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
      
      const firstTransaction = sortedTransactions[0];
      const lastTransaction = sortedTransactions[sortedTransactions.length - 1];
      
      // Get dates from metadata if available, otherwise use transaction_date
      const firstDate = getTransactionDateFromMetadata(firstTransaction.metadata) || firstTransaction.transaction_date;
      const lastDate = getTransactionDateFromMetadata(lastTransaction.metadata) || lastTransaction.transaction_date;
      
      if (firstDate && lastDate) {
        // Parse dates - they might be in YYYY-MM-DD format from metadata
        const firstDateObj = new Date(firstDate);
        const lastDateObj = new Date(lastDate);
        
        if (!isNaN(firstDateObj.getTime()) && !isNaN(lastDateObj.getTime())) {
          return `${format(firstDateObj, "MMM d, yyyy")} - ${format(lastDateObj, "MMM d, yyyy")}`;
        }
      }
      
      return null;
    }, [statementTransactions]);
    
    if (period) {
      return <div className="text-sm">{period}</div>;
    }
    
    return <span className="text-muted-foreground">—</span>;
  };

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const isExcelFile = (fileName: string) => {
    const ext = getFileExtension(fileName);
    return ['xlsx', 'xls', 'csv'].includes(ext);
  };

  const extractBalanceFromSummary = (data: any[][], headerRowIndex: number, summaryInfo: any) => {
    // Extract opening and closing balance from the summary section
    // Handle both cases: single row with label+value, or header row + value row
    let opening: number | null = null;
    let closing: number | null = null;

    // First, try to find summary section by searching for rows with "Opening Balance" and "Closing Balance" headers
    // Search around the summaryInfo row and a few rows before/after
    const searchStart = summaryInfo ? Math.max(0, summaryInfo.rowIndex - 2) : Math.max(0, headerRowIndex - 10);
    const searchEnd = summaryInfo ? Math.min(data.length, summaryInfo.rowIndex + 5) : Math.min(data.length, headerRowIndex + 5);

    let openingColIndex = -1;
    let closingColIndex = -1;
    let headerRowIdx = -1;
    let valueRowIdx = -1;

    // First pass: Find the header row with "Opening Balance" and "Closing Balance"
    for (let rowIdx = searchStart; rowIdx < searchEnd; rowIdx++) {
      const row = data[rowIdx];
      if (!row) continue;

      let foundOpeningHeader = false;
      let foundClosingHeader = false;

      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cell = String(row[colIdx] || "").trim().toLowerCase();
        if (cell.includes("opening") && cell.includes("balance") && !cell.includes("closing")) {
          openingColIndex = colIdx;
          foundOpeningHeader = true;
        }
        if ((cell.includes("closing") || cell.includes("final")) && cell.includes("balance") && !cell.includes("opening")) {
          closingColIndex = colIdx;
          foundClosingHeader = true;
        }
      }

      // If we found both headers in this row, this is the header row
      if (foundOpeningHeader && foundClosingHeader) {
        headerRowIdx = rowIdx;
        // Check the next row for values
        if (rowIdx + 1 < data.length) {
          valueRowIdx = rowIdx + 1;
        }
        break;
      }
    }

    // If we found header and value rows, extract values
    if (headerRowIdx >= 0 && valueRowIdx >= 0 && openingColIndex >= 0 && closingColIndex >= 0) {
      const valueRow = data[valueRowIdx];
      if (valueRow) {
        // Extract opening balance
        if (valueRow[openingColIndex] !== undefined) {
          const openingValue = String(valueRow[openingColIndex] || "").trim();
          const parsed = parseFloat(openingValue.replace(/[^0-9.-]/g, ""));
          if (!isNaN(parsed)) {
            opening = parsed;
          }
        }
        // Extract closing balance
        if (valueRow[closingColIndex] !== undefined) {
          const closingValue = String(valueRow[closingColIndex] || "").trim();
          const parsed = parseFloat(closingValue.replace(/[^0-9.-]/g, ""));
          if (!isNaN(parsed)) {
            closing = parsed;
          }
        }
      }
    }

    // Fallback: If we didn't find header/value structure, try to extract from summaryInfo row
    if ((opening === null || closing === null) && summaryInfo) {
      const summaryRowIndex = summaryInfo.rowIndex;
      if (summaryRowIndex >= 0 && summaryRowIndex < data.length) {
        const summaryRow = data[summaryRowIndex];
        if (summaryRow) {
          for (let i = 0; i < summaryRow.length; i++) {
            const cell = String(summaryRow[i] || "").trim();
            const cellLower = cell.toLowerCase();
            const nextCell = summaryRow[i + 1];

            // Find opening balance
            if (opening === null && cellLower.includes("opening") && !cellLower.includes("closing")) {
              // Try to extract number from the same cell
              const sameCellMatch = cell.match(/[\d,]+\.?\d*/);
              if (sameCellMatch) {
                const parsed = parseFloat(sameCellMatch[0].replace(/[^0-9.-]/g, ""));
                if (!isNaN(parsed)) {
                  opening = parsed;
                }
              }
              // Try next cell
              if (opening === null && nextCell) {
        const nextCellStr = String(nextCell).trim();
        const parsed = parseFloat(nextCellStr.replace(/[^0-9.-]/g, ""));
        if (!isNaN(parsed)) {
          opening = parsed;
        }
      }
    }

    // Find closing balance
            if (closing === null && (cellLower.includes("closing") || cellLower.includes("final")) && !cellLower.includes("opening")) {
              // Try to extract number from the same cell
              const sameCellMatch = cell.match(/[\d,]+\.?\d*/);
              if (sameCellMatch) {
                const parsed = parseFloat(sameCellMatch[0].replace(/[^0-9.-]/g, ""));
                if (!isNaN(parsed)) {
                  closing = parsed;
                }
              }
              // Try next cell
              if (closing === null && nextCell) {
        const nextCellStr = String(nextCell).trim();
        const parsed = parseFloat(nextCellStr.replace(/[^0-9.-]/g, ""));
        if (!isNaN(parsed)) {
          closing = parsed;
                }
              }
            }
          }
        }
      }
    }

    return { opening, closing };
  };

  const extractDebitCreditAmounts = (data: any[][], headerRowIndex: number) => {
    // Extract total debit and credit AMOUNTS from the section ABOVE the transactions
    let totalDebitAmount: number | null = null;
    let totalCreditAmount: number | null = null;

    const searchStart = Math.max(0, headerRowIndex - 15);
    const searchEnd = headerRowIndex;

    console.log('=== extractDebitCreditAmounts (ABOVE transactions) ===');
    console.log(`Searching rows ${searchStart} to ${searchEnd} (before header at ${headerRowIndex})`);

    // Look for a row with "Total Debit" and "Total Credit" column headers
    // The actual values will be in the next row
    for (let rowIdx = searchStart; rowIdx < searchEnd; rowIdx++) {
      const row = data[rowIdx];
      if (!row || row.length === 0) continue;

      const fullRowText = row.map(c => String(c || "").trim()).join(" | ");
      console.log(`Row ${rowIdx}: ${fullRowText}`);

      const fullRowLower = fullRowText.toLowerCase();

      // Check if this row has the headers "Total Debit" and "Total Credit"
      if (fullRowLower.includes("total debit") && fullRowLower.includes("total credit")) {
        console.log(`\n✓ Row ${rowIdx} has "Total Debit" and "Total Credit" headers`);
        
        // Find which columns have these headers
        let debitColIdx = -1;
        let creditColIdx = -1;
        
        for (let colIdx = 0; colIdx < row.length; colIdx++) {
          const cellLower = String(row[colIdx] || "").trim().toLowerCase();
          if (cellLower.includes("total") && cellLower.includes("debit")) {
            debitColIdx = colIdx;
            console.log(`  Debit header at column ${colIdx}`);
          }
          if (cellLower.includes("total") && cellLower.includes("credit")) {
            creditColIdx = colIdx;
            console.log(`  Credit header at column ${colIdx}`);
          }
        }

        // Get the next row which should have the values
        if (rowIdx + 1 < data.length && debitColIdx >= 0 && creditColIdx >= 0) {
          const valueRow = data[rowIdx + 1];
          if (valueRow) {
            console.log(`  Values in next row (${rowIdx + 1}):`);

            // Extract debit amount from the same column
            if (debitColIdx < valueRow.length) {
              const debitStr = String(valueRow[debitColIdx] || "").trim();
              const debitMatch = debitStr.match(/[\d,]+\.?\d*/);
              if (debitMatch) {
                totalDebitAmount = parseFloat(debitMatch[0].replace(/[^0-9.-]/g, ""));
                console.log(`    Debit amount from col ${debitColIdx}: "${debitStr}" → ${totalDebitAmount}`);
              }
            }

            // Extract credit amount from the same column
            if (creditColIdx < valueRow.length) {
              const creditStr = String(valueRow[creditColIdx] || "").trim();
              const creditMatch = creditStr.match(/[\d,]+\.?\d*/);
              if (creditMatch) {
                totalCreditAmount = parseFloat(creditMatch[0].replace(/[^0-9.-]/g, ""));
                console.log(`    Credit amount from col ${creditColIdx}: "${creditStr}" → ${totalCreditAmount}`);
              }
            }
          }
        }

        if (totalDebitAmount !== null && totalCreditAmount !== null) {
          console.log(`\n✓ Successfully extracted both amounts`);
          break;
        }
      }
    }

    console.log('\n=== extractDebitCreditAmounts RESULT ===');
    console.log(`Total Debit Amount: ${totalDebitAmount}, Total Credit Amount: ${totalCreditAmount}`);
    return { totalDebitAmount, totalCreditAmount };
  };

  const extractTotalsFromSummary = (data: any[][], headerRowIndex: number, summaryInfo: any) => {
    // Extract total debits and total credits (transaction COUNT, not amount) from the section BELOW the transactions
    // These are the "Total number of Debits" and "Total number of Credits" which appear after transactions
    let totalDebits: number | null = null;
    let totalCredits: number | null = null;

    // Search in the rows AFTER the header row (since header marks the start of transactions)
    const searchStart = Math.max(0, headerRowIndex + 1);
    const searchEnd = data.length;

    console.log('=== extractTotalsFromSummary (BELOW transactions) ===');
    console.log(`Header at row ${headerRowIndex}, searching rows ${searchStart} to ${searchEnd} (of ${data.length} total)`);

    // Debug: count how many rows have "total", "number", "debit", "credit" in them
    let matchingRows = 0;
    for (let idx = searchStart; idx < searchEnd; idx++) {
      const row = data[idx];
      if (!row) continue;
      const rowText = row.map(c => String(c || "").toLowerCase()).join(" ");
      if (rowText.includes("total") && rowText.includes("number")) {
        matchingRows++;
        console.log(`Row ${idx} has "total number":`, rowText.substring(0, 100));
      }
    }
    console.log(`Found ${matchingRows} rows with "total number"`);

    // First pass: Look for "Total number of Debits" and "Total number of Credits" rows
    // These represent the COUNT of transactions, not the amount
    for (let rowIdx = searchStart; rowIdx < searchEnd; rowIdx++) {
      const row = data[rowIdx];
      if (!row || row.length === 0) continue;

      // Skip empty rows
      const hasAnyData = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
      if (!hasAnyData) continue;

      // Check ALL cells in this row for the labels
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const cellStr = String(row[colIdx] || "").trim();
        if (!cellStr) continue; // Skip empty cells
        
        const cellLower = cellStr.toLowerCase();

        // Check for "Total number of Debits"
        if (cellLower.includes("total") && cellLower.includes("number") && cellLower.includes("debit")) {
          console.log(`✓ Row ${rowIdx} Col ${colIdx}: Found "Total number of Debits":`, cellStr);
          
          // Try to extract the number from the same cell
          const match = cellStr.match(/(\d+)/);
          if (match) {
            const parsed = parseInt(match[1], 10);
            if (!isNaN(parsed) && parsed > 0) {
              totalDebits = parsed;
              console.log(`  → Extracted from same cell: ${parsed}`);
              continue;
            }
          }
          
          // If not in same cell, look in the next few cells
          for (let nextCol = colIdx + 1; nextCol < Math.min(colIdx + 3, row.length); nextCol++) {
            const nextCell = row[nextCol];
            if (nextCell !== null && nextCell !== undefined && nextCell !== "") {
              const nextStr = String(nextCell).trim();
              const parsed = parseInt(nextStr.replace(/[^0-9.-]/g, ""), 10);
              if (!isNaN(parsed) && parsed > 0) {
                totalDebits = parsed;
                console.log(`  → Extracted from next cell (${nextCol}): ${parsed}`);
        break;
      }
    }
          }
        }
        
        // Check for "Total number of Credits"
        if (cellLower.includes("total") && cellLower.includes("number") && cellLower.includes("credit")) {
          console.log(`✓ Row ${rowIdx} Col ${colIdx}: Found "Total number of Credits":`, cellStr);
          
          // Try to extract the number from the same cell
          const match = cellStr.match(/(\d+)/);
          if (match) {
            const parsed = parseInt(match[1], 10);
            if (!isNaN(parsed) && parsed > 0) {
              totalCredits = parsed;
              console.log(`  → Extracted from same cell: ${parsed}`);
              continue;
            }
          }
          
          // If not in same cell, look in the next few cells
          for (let nextCol = colIdx + 1; nextCol < Math.min(colIdx + 3, row.length); nextCol++) {
            const nextCell = row[nextCol];
            if (nextCell !== null && nextCell !== undefined && nextCell !== "") {
              const nextStr = String(nextCell).trim();
              const parsed = parseInt(nextStr.replace(/[^0-9.-]/g, ""), 10);
              if (!isNaN(parsed) && parsed > 0) {
                totalCredits = parsed;
                console.log(`  → Extracted from next cell (${nextCol}): ${parsed}`);
                break;
              }
            }
          }
        }
      }
      
      // If we found both, we can stop searching
      if (totalDebits !== null && totalCredits !== null) {
        console.log('✓ Found both totals, stopping search');
        break;
      }
    }

    // Fallback: If "Total number of" rows not found, look for generic "Total Debit" and "Total Credit" 
    // but only if they appear to be counts (small numbers), not amounts (large numbers)
    if (totalDebits === null || totalCredits === null) {
      for (let rowIdx = searchStart; rowIdx < searchEnd; rowIdx++) {
        const row = data[rowIdx];
        if (!row) continue;

        let foundDebitAmount = null;
        let foundCreditAmount = null;

        for (let colIdx = 0; colIdx < row.length; colIdx++) {
          const cell = String(row[colIdx] || "").trim().toLowerCase();
          const cellValue = row[colIdx];
          
          if ((cell.includes("total") || cell.includes("sum")) && cell.includes("debit") && !cell.includes("credit") && !cell.includes("number")) {
            // Found a "Total Debit" label, check the value in next cells
            for (let nextColIdx = colIdx + 1; nextColIdx < row.length; nextColIdx++) {
              const nextVal = row[nextColIdx];
              if (nextVal !== null && nextVal !== undefined && nextVal !== "") {
                const parsed = parseFloat(String(nextVal).replace(/[^0-9.-]/g, ""));
                if (!isNaN(parsed) && parsed > 0) {
                  foundDebitAmount = parsed;
                  break;
    }
              }
            }
          }
          
          if ((cell.includes("total") || cell.includes("sum")) && cell.includes("credit") && !cell.includes("debit") && !cell.includes("number")) {
            // Found a "Total Credit" label, check the value in next cells
            for (let nextColIdx = colIdx + 1; nextColIdx < row.length; nextColIdx++) {
              const nextVal = row[nextColIdx];
              if (nextVal !== null && nextVal !== undefined && nextVal !== "") {
                const parsed = parseFloat(String(nextVal).replace(/[^0-9.-]/g, ""));
                if (!isNaN(parsed) && parsed > 0) {
                  foundCreditAmount = parsed;
                  break;
                }
              }
            }
          }
        }
        
        // Only use these values if they look like counts (< 1000) not amounts
        if (foundDebitAmount !== null && foundDebitAmount < 10000 && totalDebits === null) {
          totalDebits = Math.abs(Math.round(foundDebitAmount));
        }
        if (foundCreditAmount !== null && foundCreditAmount < 10000 && totalCredits === null) {
          totalCredits = Math.abs(Math.round(foundCreditAmount));
        }
        
        if (totalDebits !== null && totalCredits !== null) {
          break;
        }
      }
    }

    console.log('=== extractTotalsFromSummary RESULT ===');
    console.log('totalDebits:', totalDebits, '(type:', typeof totalDebits + ')');
    console.log('totalCredits:', totalCredits, '(type:', typeof totalCredits + ')');
    if (totalDebits !== null && totalCredits !== null) {
      console.log('✓ FINAL: Will return totals sum =', totalDebits + totalCredits);
    } else {
      console.log('✗ FINAL: Totals not found, will use fallback');
    }
    return { totalDebits, totalCredits };
  };

  const extractSummaryAndCustomerInfo = (data: any[][]) => {
    const result: any = {
      customerInfo: [],
      summaryInfo: null,
      headerRowIndex: -1,
      transactionStartRow: -1,
      allRowsBeforeHeader: [], // Store all non-empty rows for debugging
    };

    if (data.length < 2) return result;

    // Find header row - use improved logic to skip title and summary rows
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(30, data.length); i++) {
      const row = data[i] as any[];
      if (!row || row.length === 0) continue;

      // Skip title/document header rows
      const rowText = row.map(cell => String(cell || "").toLowerCase().trim()).join(" ");
      
      // Skip obvious title rows
      const isTitleRow = rowText.includes("statement of account") ||
                        rowText.includes("account statement") ||
                        (rowText.length < 30 && (rowText.includes("statement") || rowText.includes("account")) && row.length === 1);
      
      // Skip summary rows that contain "opening", "closing", "total", "summary"
      const isSummaryRow = (rowText.includes("opening") && rowText.includes("balance")) ||
                          (rowText.includes("closing") && rowText.includes("balance")) ||
                          (rowText.includes("total") && (rowText.includes("debit") || rowText.includes("credit"))) ||
                          rowText.includes("summary");
      
      if (isTitleRow || isSummaryRow) {
        continue;
      }

      // Check if this row looks like transaction headers
      const transactionHeaderKeywords = ['date', 'description', 'narration', 'particulars', 'debit', 'credit', 'transaction'];
      const commonHeaderKeywords = ['value date', 'ref', 'reference', 'amount', 'balance'];
      
      const hasTransactionHeaders = transactionHeaderKeywords.filter(keyword => rowText.includes(keyword)).length >= 2;
      const totalHeaderCount = transactionHeaderKeywords.filter(keyword => rowText.includes(keyword)).length +
                              commonHeaderKeywords.filter(keyword => rowText.includes(keyword)).length;

      // Require at least 2 transaction-specific headers OR at least 3 total headers
      if (hasTransactionHeaders || (totalHeaderCount >= 3 && transactionHeaderKeywords.filter(keyword => rowText.includes(keyword)).length >= 1)) {
        headerRowIndex = i;
        result.headerRowIndex = i;
        break;
      }
    }

    // If no header found, try to find a row with mostly populated cells (likely the header)
    if (headerRowIndex === -1) {
      let maxPopulatedCount = 0;
      let bestRowIndex = -1;
      for (let i = 0; i < Math.min(30, data.length); i++) {
        const row = data[i] as any[];
        if (!row) continue;
        
        // Count non-empty cells
        const populatedCount = row.filter(cell => cell !== undefined && cell !== null && String(cell).trim() !== "").length;
        
        // Skip single-cell rows (likely titles)
        if (populatedCount === 1 && row.length > 3) continue;
        
        if (populatedCount > maxPopulatedCount && populatedCount >= 3) {
          maxPopulatedCount = populatedCount;
          bestRowIndex = i;
        }
      }
      
      if (bestRowIndex >= 0) {
        headerRowIndex = bestRowIndex;
        result.headerRowIndex = bestRowIndex;
      } else {
        // Final fallback
      headerRowIndex = 0;
      result.headerRowIndex = 0;
      }
    }

    // Extract all non-empty rows before header and classify them
    const rowsBeforeHeader: any[] = [];
    for (let i = 0; i < headerRowIndex; i++) {
      const row = data[i] as any[];
      
      // Skip completely empty rows
      const hasContent = row && row.some((cell) => {
        const cellStr = String(cell || "").trim();
        return cellStr !== "" && cellStr !== "undefined" && cellStr !== "null";
      });
      
      if (!hasContent) continue;

      rowsBeforeHeader.push({
        rowIndex: i,
        data: row,
        text: row.map((cell) => String(cell || "").toLowerCase()).join(" "),
      });
    }

    result.allRowsBeforeHeader = rowsBeforeHeader;

    // Now classify rows into customer info and summary
    // Strategy: Look for rows that have label-value patterns or multiple numeric values
    rowsBeforeHeader.forEach((rowInfo) => {
      const rowText = rowInfo.text;
      
      // Strong indicators for summary row
      const summaryIndicators = [
        "opening balance",
        "closing balance",
        "total debit",
        "total credit",
        "total debits",
        "total credits",
      ];
      
      const hasSummaryIndicator = summaryIndicators.some((indicator) =>
        rowText.includes(indicator)
      );

      // If it has multiple summary indicators or is clearly a summary row
      if (hasSummaryIndicator) {
        // This is a summary row
        if (!result.summaryInfo) {
          // Store the first summary row found
          result.summaryInfo = {
            rowIndex: rowInfo.rowIndex,
            data: rowInfo.data,
          };
        }
      } else {
        // This is customer info
        result.customerInfo.push({
          rowIndex: rowInfo.rowIndex,
          data: rowInfo.data,
        });
      }
    });

    result.transactionStartRow = headerRowIndex + 1;
    return result;
  };

  const loadExcelFile = async (fileUrl: string) => {
    try {
      console.log('=== loadExcelFile START ===');
      console.log('Loading file from:', fileUrl);
      setLoadingDocument(true);
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get all data including empty cells
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: '',
        blankrows: false 
      }) as any[][];
      
      // Find the maximum number of columns
      const maxCols = Math.max(...jsonData.map(row => row.length), 0);
      
      // Pad all rows to have the same number of columns
      const paddedData = jsonData.map(row => {
        const paddedRow = [...row];
        while (paddedRow.length < maxCols) {
          paddedRow.push('');
        }
        return paddedRow;
      });
      
      setExcelData(paddedData);

      // Extract metadata: customer info and summary info
      const metadata = extractSummaryAndCustomerInfo(paddedData);
      
      // Extract opening and closing balance from the summary section specifically
      const { opening, closing } = extractBalanceFromSummary(paddedData, metadata.headerRowIndex, metadata.summaryInfo);
      
      // Extract debit/credit amounts from ABOVE the transactions section
      const { totalDebitAmount, totalCreditAmount } = extractDebitCreditAmounts(paddedData, metadata.headerRowIndex);
      
      // Extract total debits and credits COUNT from BELOW the transactions section
      const { totalDebits, totalCredits } = extractTotalsFromSummary(paddedData, metadata.headerRowIndex, metadata.summaryInfo);
      
      // Debug logging
      console.log('Extraction summary:', {
        opening,
        closing,
        totalDebitAmount,
        totalCreditAmount,
        totalDebits: 'transaction count',
        totalCredits: 'transaction count',
        summaryInfo: metadata.summaryInfo,
        headerRowIndex: metadata.headerRowIndex
      });
      
      // Store extracted values in metadata for display
      // - Amounts (from above transactions) for display
      // - Counts (from below transactions) for transaction count calculation
      metadata.extractedBalances = { opening, closing };
      metadata.extractedAmounts = { totalDebitAmount, totalCreditAmount };
      metadata.extractedTotals = { totalDebits, totalCredits };
      
      console.log('=== STORING IN METADATA ===');
      console.log('Storing extractedTotals:', metadata.extractedTotals);
      console.log('Full metadata.extractedTotals:', metadata.extractedTotals);
      
      setDocumentMetadata(metadata);
      console.log('=== loadExcelFile COMPLETE ===');
      
      // Sync the viewing statement with document balances and totals
      // Always use extracted values if available, otherwise keep existing values
      if (viewingStatement) {
        setViewingStatement({
          ...viewingStatement,
          opening_balance: opening !== null ? opening : viewingStatement.opening_balance,
          closing_balance: closing !== null ? closing : viewingStatement.closing_balance,
          total_debits: totalDebits !== null ? totalDebits : viewingStatement.total_debits,
          total_credits: totalCredits !== null ? totalCredits : viewingStatement.total_credits,
        });
      }
    } catch (err) {
      console.error('Error loading Excel file:', err);
      setExcelData([]);
      setDocumentMetadata(null);
    } finally {
      setLoadingDocument(false);
    }
  };

  const handleViewDocument = async (statement: any) => {
    setViewingStatement(statement);
    if (isExcelFile(statement.file_name)) {
      await loadExcelFile(statement.file_url);
    }
    setViewerOpen(true);
  };

  const { data: statements, isLoading } = useBankStatements();
  const { data: transactions, isLoading: transactionsLoading } = useBankStatementTransactions(selectedStatementId);
  const createStatement = useCreateBankStatement();
  const deleteStatement = useDeleteBankStatement();
  const { data: company } = useCompany();
  const { user } = useAuth();
  
  // Sort transactions by metadata.transaction_date in descending order (newest first)
  const sortedTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    return [...transactions].sort((a: any, b: any) => {
      // Get transaction date from metadata, fallback to transaction_date column
      const dateA = getTransactionDateFromMetadata(a.metadata) || a.transaction_date;
      const dateB = getTransactionDateFromMetadata(b.metadata) || b.transaction_date;
      
      // Parse dates
      const dateAValue = dateA ? new Date(dateA).getTime() : 0;
      const dateBValue = dateB ? new Date(dateB).getTime() : 0;
      
      // Sort in descending order (newest first)
      return dateBValue - dateAValue;
    });
  }, [transactions]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const parseExcelFile = async (file: File) => {
    return new Promise<{ statement: any; transactions: any[] }>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array", cellDates: true, cellNF: true, cellText: true });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Get both raw and formatted values to preserve exact Excel formatting
          const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: "",
            raw: true, // Get raw numeric values
            dateNF: "dd/MM/yyyy"
          });
          
          const jsonDataFormatted = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: "",
            raw: false, // Get formatted display values
            dateNF: "dd/MM/yyyy"
          });
          
          // Combine raw and formatted - use formatted for display, raw for calculations
          const jsonData = jsonDataFormatted.map((row: any, rowIdx: number) => {
            const rawRow = jsonDataRaw[rowIdx] as any[];
            if (!rawRow) return row;
            
            return row.map((cell: any, colIdx: number) => {
              const rawCell = rawRow[colIdx];
              // If raw cell is a number and formatted cell exists, prefer formatted for display
              // But store both for accurate calculations
              return cell !== undefined && cell !== null ? cell : rawCell;
            });
          });

          console.log("Excel data loaded:", {
            totalRows: jsonData.length,
            firstFewRows: jsonData.slice(0, 5)
          });

          // Find header row - check more rows and be more flexible
          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(25, jsonData.length); i++) {
            const row = jsonData[i] as any[];
            if (!row || row.length === 0) continue;
            
            // Skip title/document header rows
            const rowText = row.map(cell => String(cell || "").toLowerCase().trim()).join(" ");
            
            // Skip obvious title rows
            const isTitleRow = rowText.includes("statement of account") ||
                              rowText.includes("account statement") ||
                              (rowText.length < 30 && (rowText.includes("statement") || rowText.includes("account")) && row.length === 1);
            
            // Skip summary rows that contain "opening", "closing", "total", "summary"
            const isSummaryRow = (rowText.includes("opening") && rowText.includes("balance")) ||
                                (rowText.includes("closing") && rowText.includes("balance")) ||
                                (rowText.includes("total") && (rowText.includes("debit") || rowText.includes("credit"))) ||
                                rowText.includes("summary");
            
            if (isTitleRow || isSummaryRow) {
              console.log("Skipping row at index:", i, "Title:", isTitleRow, "Summary:", isSummaryRow);
              continue;
            }
            
            // Check if this row looks like transaction headers
            // A valid transaction header should have specific transaction-related columns
            const transactionHeaderKeywords = ['date', 'description', 'narration', 'particulars', 'debit', 'credit', 'transaction'];
            const commonHeaderKeywords = ['value date', 'ref', 'reference', 'amount', 'balance'];
            
            const hasTransactionHeaders = transactionHeaderKeywords.filter(keyword => rowText.includes(keyword)).length >= 2;
            const totalHeaderCount = transactionHeaderKeywords.filter(keyword => rowText.includes(keyword)).length +
                                    commonHeaderKeywords.filter(keyword => rowText.includes(keyword)).length;
            
            // Require at least 2 transaction-specific headers OR at least 3 total headers
            // But prefer having actual transaction keywords (date, debit, credit, description, particulars)
            if (hasTransactionHeaders || (totalHeaderCount >= 3 && transactionHeaderKeywords.filter(keyword => rowText.includes(keyword)).length >= 1)) {
              headerRowIndex = i;
              console.log("Found header row at index:", i, "Keywords found:", totalHeaderCount, "Transaction keywords:", transactionHeaderKeywords.filter(keyword => rowText.includes(keyword)));
              break;
            }
          }

          // If no header found, try to find a row with mostly populated cells (likely the header)
          if (headerRowIndex === -1) {
            console.log("No header row found with keywords, searching for row with most populated cells");
            let maxPopulatedCount = 0;
            let bestRowIndex = -1;
            for (let i = 0; i < Math.min(30, jsonData.length); i++) {
              const row = jsonData[i] as any[];
              if (!row) continue;
              
              // Count non-empty cells
              const populatedCount = row.filter(cell => cell !== undefined && cell !== null && String(cell).trim() !== "").length;
              
              // Skip single-cell rows (likely titles)
              if (populatedCount === 1 && row.length > 3) continue;
              
              if (populatedCount > maxPopulatedCount && populatedCount >= 3) {
                maxPopulatedCount = populatedCount;
                bestRowIndex = i;
              }
            }
            
            if (bestRowIndex >= 0) {
              headerRowIndex = bestRowIndex;
            } else {
              // Final fallback
            headerRowIndex = 0;
            }
            console.log("Using header row at index:", headerRowIndex, "with", maxPopulatedCount, "populated cells");
          }

          const headers = (jsonData[headerRowIndex] as any[]).map((h: any, idx: number) => {
            const header = String(h || "").trim();
            // If header is empty, create a default name
            return header || `Column_${idx + 1}`;
          });

          console.log("Headers detected:", headers);

          // Map common column names (case-insensitive, more flexible)
          const headersLower = headers.map(h => h.toLowerCase());
          
          const dateCol = headersLower.findIndex(h => 
            h.includes('date') && !h.includes('value')
          );
          const valueDateCol = headersLower.findIndex(h => 
            h.includes('value date') || (h.includes('value') && h.includes('date'))
          );
          const descCol = headersLower.findIndex(h => 
            h.includes('description') || h.includes('narration') || h.includes('particulars') || 
            h.includes('details') || h.includes('remarks') || h.includes('transaction')
          );
          const refCol = headersLower.findIndex(h => 
            h.includes('reference') || h.includes('ref') || h.includes('cheque') || 
            h.includes('chq') || h.includes('chq no') || h.includes('instrument')
          );
          // Find debit column - must contain "debit" keyword and be numeric
          // Exclude summary columns like "Total Debit"
          const debitCol = headersLower.findIndex(h => {
            const hasDebitKeyword = h.includes('debit') || h.includes('withdrawal') || h.includes('dr');
            // Exclude if it's clearly a description field or a summary column
            const isNotDescription = !h.includes('description') && !h.includes('narration') && !h.includes('particulars');
            const isNotSummary = !h.includes('total') && !h.includes('opening') && !h.includes('closing') && !h.includes('summary');
            return hasDebitKeyword && isNotDescription && isNotSummary;
          });
          
          // Find credit column - must contain "credit" keyword and be numeric
          // Exclude summary columns like "Total Credit"
          const creditCol = headersLower.findIndex(h => {
            const hasCreditKeyword = h.includes('credit') || h.includes('deposit') || h.includes('cr');
            // Exclude if it's clearly a description field or a summary column
            const isNotDescription = !h.includes('description') && !h.includes('narration') && !h.includes('particulars');
            const isNotSummary = !h.includes('total') && !h.includes('opening') && !h.includes('closing') && !h.includes('summary');
            return hasCreditKeyword && isNotDescription && isNotSummary;
          });
          
          const balanceCol = headersLower.findIndex(h => 
            (h.includes('balance') || h.includes('closing')) && 
            !h.includes('opening') && !h.includes('total') && !h.includes('summary')
          );
          
          // Validate that debit/credit columns actually contain numeric data
          // Check a few sample rows to verify
          let validatedDebitCol = debitCol;
          let validatedCreditCol = creditCol;
          
          if (debitCol >= 0 || creditCol >= 0) {
            // Check first few data rows to validate columns contain numbers
            for (let checkRow = headerRowIndex + 1; checkRow < Math.min(headerRowIndex + 5, jsonData.length); checkRow++) {
              const sampleRow = jsonData[checkRow] as any[];
              if (!sampleRow) continue;
              
              // Validate debit column
              if (debitCol >= 0 && sampleRow[debitCol] !== undefined) {
                const debitValue = sampleRow[debitCol];
                const isNumeric = typeof debitValue === 'number' || 
                                 (typeof debitValue === 'string' && /^[\d.,\s-]+$/.test(debitValue.replace(/[₹$,\s]/g, "")));
                if (!isNumeric && debitValue !== "" && debitValue !== null) {
                  // This column doesn't seem to contain numbers, might be wrong
                  console.warn(`Debit column ${debitCol} doesn't contain numeric data, value:`, debitValue);
                }
              }
              
              // Validate credit column
              if (creditCol >= 0 && sampleRow[creditCol] !== undefined) {
                const creditValue = sampleRow[creditCol];
                const isNumeric = typeof creditValue === 'number' || 
                                 (typeof creditValue === 'string' && /^[\d.,\s-]+$/.test(creditValue.replace(/[₹$,\s]/g, "")));
                if (!isNumeric && creditValue !== "" && creditValue !== null) {
                  // This column doesn't seem to contain numbers, might be wrong
                  console.warn(`Credit column ${creditCol} doesn't contain numeric data, value:`, creditValue);
                  // If credit column contains text that looks like description, it's wrong
                  if (typeof creditValue === 'string' && (creditValue.includes('/') || creditValue.match(/[A-Za-z]/))) {
                    validatedCreditCol = -1; // Mark as invalid
                  }
                }
              }
            }
          }
          
          // Use validated columns
          const finalDebitCol = validatedDebitCol;
          const finalCreditCol = validatedCreditCol;

          console.log("Column mapping:", {
            dateCol,
            valueDateCol,
            descCol,
            refCol,
            debitCol: finalDebitCol,
            creditCol: finalCreditCol,
            balanceCol,
            headers
          });

          const transactions: any[] = [];
          let openingBalance: number | null = null;
          let closingBalance: number | null = null;
          let minDate: Date | null = null;
          let maxDate: Date | null = null;

          // Parse transactions - start from row after header
          let parsedCount = 0;
          let skippedCount = 0;
          
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (!row || row.length === 0) {
              skippedCount++;
              continue;
            }

            // Skip completely empty rows
            const hasData = row.some((cell, idx) => {
              const val = String(cell || "").trim();
              return val !== "" && val !== null && val !== undefined;
            });
            
            if (!hasData) {
              skippedCount++;
              continue;
            }

            // Get values from mapped columns - preserve original formatting
            const dateStr = dateCol >= 0 && row[dateCol] !== undefined 
              ? String(row[dateCol] || "").trim() 
              : "";
            const valueDateStr = valueDateCol >= 0 && row[valueDateCol] !== undefined
              ? String(row[valueDateCol] || "").trim() 
              : dateStr;
            
            // Use validated column indices
            const actualDebitCol = finalDebitCol;
            const actualCreditCol = finalCreditCol;
            
            // Get description - preserve ALL transaction details exactly as in Excel
            let description = "";
            if (descCol >= 0 && row[descCol] !== undefined) {
              description = String(row[descCol] || "").trim();
            }
            
            // Collect ALL non-empty columns that aren't dates/amounts/balance - these might be transaction details
            const transactionParts: string[] = [];
            headers.forEach((header, idx) => {
              const headerLower = header.toLowerCase();
              const cellValue = row[idx];
              
              // Skip if empty, or if it's a date/amount/balance column
              if (cellValue === undefined || cellValue === null || String(cellValue).trim() === "") return;
              
              const isDateCol = idx === dateCol || idx === valueDateCol || headerLower.includes('date');
              const isAmountCol = idx === debitCol || idx === creditCol || idx === balanceCol || 
                                  headerLower.includes('debit') || headerLower.includes('credit') || 
                                  headerLower.includes('balance') || headerLower.includes('amount');
              const isRefCol = idx === refCol || headerLower.includes('ref') || headerLower.includes('reference');
              
              // Include if it's description-related or if it's not a standard column
              if (!isDateCol && !isAmountCol) {
                const value = String(cellValue).trim();
                // If it looks like transaction detail (contains letters/special chars, not just numbers)
                if (value && (value.includes('/') || value.match(/[a-zA-Z]/) || !value.match(/^[\d.,\s-]+$/))) {
                  if (idx === descCol || headerLower.includes('description') || 
                      headerLower.includes('narration') || headerLower.includes('particulars') ||
                      headerLower.includes('details') || headerLower.includes('transaction') ||
                      headerLower.includes('remarks')) {
                    transactionParts.push(value);
                  } else if (!isRefCol && value.length > 3) {
                    // Include other text columns that might be part of transaction details
                    transactionParts.push(value);
                  }
                }
              }
            });
            
            // Combine all transaction parts with "/" separator (common in bank statements)
            if (transactionParts.length > 0) {
              description = transactionParts.join("/");
            }
            
            const reference = refCol >= 0 && row[refCol] !== undefined
              ? String(row[refCol] || "").trim() 
              : "";
            
            // Get original amount strings as they appear in Excel (preserve formatting)
            // Handle both numeric values and formatted strings
            // Use validated column indices
            const debitCell = actualDebitCol >= 0 ? row[actualDebitCol] : undefined;
            const creditCell = actualCreditCol >= 0 ? row[actualCreditCol] : undefined;
            const balanceCell = balanceCol >= 0 ? row[balanceCol] : undefined;
            
            // Get formatted display strings
            let debitOriginal = "";
            let creditOriginal = "";
            let balanceOriginal = "";
            
            if (debitCell !== undefined && debitCell !== null && debitCell !== "") {
              debitOriginal = String(debitCell).trim();
            }
            if (creditCell !== undefined && creditCell !== null && creditCell !== "") {
              creditOriginal = String(creditCell).trim();
            }
            if (balanceCell !== undefined && balanceCell !== null && balanceCell !== "") {
              balanceOriginal = String(balanceCell).trim();
            }

            // Parse numeric values for calculations
            // Handle both numbers and formatted strings
            let debit: number = 0;
            let credit: number = 0;
            let balance: number | null = null;
            
            // Parse debit amount - ensure it's actually a number
            if (debitCell !== undefined && debitCell !== null && debitCell !== "") {
              const debitStr = String(debitCell).trim();
              // Skip if it looks like text (contains letters that indicate header/description rather than currency/numbers)
              // Allow abbreviations like "USD" but skip actual words like "Value Date", "Particulars"
              const hasLikelyText = debitStr.match(/[A-Z][a-z].*[a-z]/); // Words with mixed case
              const hasHeaderText = debitStr.toLowerCase().includes('value') || 
                                   debitStr.toLowerCase().includes('particulars') ||
                                   debitStr.toLowerCase().includes('date') ||
                                   debitStr.toLowerCase().includes('narration') ||
                                   debitStr.toLowerCase().includes('description');
              
              if (hasLikelyText || hasHeaderText || debitStr.includes('/') || 
                  debitStr.includes('IMPS') || debitStr.includes('NEFT')) {
                console.warn(`Row ${i + 1}: Debit cell contains text, skipping:`, debitStr);
                // Don't use this as debit amount
              } else {
                if (typeof debitCell === 'number') {
                  debit = debitCell;
                } else {
                  // Remove formatting but preserve the full number
                  const cleaned = debitStr
                    .replace(/[₹$,\s]/g, "")
                    .replace(/\(/g, "-")
                    .replace(/\)/g, "")
                    .trim();
                  const parsed = parseFloat(cleaned);
                  if (!isNaN(parsed) && parsed > 0) {
                    debit = parsed;
                  }
                }
              }
            }
            
            // Parse credit amount - ensure it's actually a number
            if (creditCell !== undefined && creditCell !== null && creditCell !== "") {
              const creditStr = String(creditCell).trim();
              // Skip if it looks like text (contains letters that indicate header/description rather than currency/numbers)
              // Allow abbreviations like "USD" but skip actual words like "Value Date", "Particulars"
              const hasLikelyText = creditStr.match(/[A-Z][a-z].*[a-z]/); // Words with mixed case
              const hasHeaderText = creditStr.toLowerCase().includes('value') || 
                                   creditStr.toLowerCase().includes('particulars') ||
                                   creditStr.toLowerCase().includes('date') ||
                                   creditStr.toLowerCase().includes('narration') ||
                                   creditStr.toLowerCase().includes('description');
              
              if (hasLikelyText || hasHeaderText || creditStr.includes('/') || 
                  creditStr.includes('IMPS') || creditStr.includes('NEFT')) {
                console.warn(`Row ${i + 1}: Credit cell contains text, skipping:`, creditStr);
                // Don't use this as credit amount - it's probably a description
              } else {
                if (typeof creditCell === 'number') {
                  credit = creditCell;
                } else {
                  // Remove formatting but preserve the full number
                  const cleaned = creditStr
                    .replace(/[₹$,\s]/g, "")
                    .replace(/\(/g, "-")
                    .replace(/\)/g, "")
                    .trim();
                  const parsed = parseFloat(cleaned);
                  if (!isNaN(parsed) && parsed > 0) {
                    credit = parsed;
                  }
                }
              }
            }
            
            if (balanceCell !== undefined && balanceCell !== null && balanceCell !== "") {
              if (typeof balanceCell === 'number') {
                balance = balanceCell;
              } else {
                const balanceStr = String(balanceCell)
                  .replace(/[₹$,\s]/g, "")
                  .replace(/\(/g, "-")
                  .replace(/\)/g, "")
                  .trim();
                const parsed = parseFloat(balanceStr);
                if (!isNaN(parsed)) {
                  balance = parsed;
                }
              }
            }
            
            // Debug logging for amount parsing
            if (debit > 0 || credit > 0) {
              console.log(`Row ${i + 1} amounts:`, {
                debitOriginal,
                debit,
                creditOriginal,
                credit,
                balanceOriginal,
                balance
              });
            }

            // More lenient: include row if it has a date OR has amounts OR has description
            const hasDate = dateStr && dateStr.length > 0;
            const hasAmounts = debit !== 0 || credit !== 0;
            const hasDescription = description && description.length > 0;

            if (!hasDate && !hasAmounts && !hasDescription) {
              skippedCount++;
              continue;
            }

            // Parse date - try multiple formats and Excel serial numbers
            let transactionDate: Date | null = null;
            let valueDate: Date | null = null;

            const dateFormats = [
              "dd/MM/yyyy",
              "dd-MM-yyyy",
              "yyyy-MM-dd",
              "MM/dd/yyyy",
              "dd.MM.yyyy",
              "yyyy/MM/dd",
              "d/M/yyyy",
              "d-M-yyyy",
              "d.M.yyyy",
            ];

            // Try parsing date string
            if (dateStr) {
              // First try Excel serial number (common in Excel exports)
              const excelDateNum = parseFloat(dateStr);
              if (!isNaN(excelDateNum) && excelDateNum > 25569 && excelDateNum < 1000000) {
                // Excel epoch starts from 1900-01-01
                try {
                  const calculatedDate = new Date((excelDateNum - 25569) * 86400 * 1000);
                  // Validate the calculated date is valid
                  if (!isNaN(calculatedDate.getTime()) && calculatedDate.getFullYear() > 1900 && calculatedDate.getFullYear() < 2100) {
                    transactionDate = calculatedDate;
                console.log("Parsed Excel serial date:", excelDateNum, "->", transactionDate);
                  }
                } catch (e) {
                  console.warn("Failed to parse Excel serial date:", excelDateNum);
                }
              } else {
                // Try date formats
                for (const format of dateFormats) {
                  try {
                    const parsed = parse(dateStr, format, new Date());
                    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
                      transactionDate = parsed;
                      break;
                    }
                  } catch {}
                }
              }
            }

            // If still no date but we have amounts/description, use a default date
            if (!transactionDate && (hasAmounts || hasDescription)) {
              // Use current date as fallback, or try to infer from context
              transactionDate = new Date();
              console.warn("No valid date found for row", i, "using current date");
            }

            // If absolutely no date and no data, skip
            if (!transactionDate) {
              skippedCount++;
              continue;
            }

            // Parse value date
            if (valueDateStr && valueDateStr !== dateStr) {
              for (const format of dateFormats) {
                try {
                  valueDate = parse(valueDateStr, format, new Date());
                  if (!isNaN(valueDate.getTime())) break;
                } catch {}
              }
            } else {
              valueDate = transactionDate;
            }

            // Track dates for statement period
            // Only track valid dates (not NaN)
            if (transactionDate && !isNaN(transactionDate.getTime())) {
            if (!minDate || transactionDate < minDate) minDate = transactionDate;
            if (!maxDate || transactionDate > maxDate) maxDate = transactionDate;
            }

            // Track opening/closing balance
            if (balance !== null) {
              if (openingBalance === null) openingBalance = balance;
              closingBalance = balance;
            }

            const transactionType = debit > 0 && credit > 0 ? "both" : debit > 0 ? "debit" : "credit";

            // Validate transaction date before using
            const validTransactionDate = transactionDate && !isNaN(transactionDate.getTime()) 
              ? transactionDate.toISOString().split("T")[0]
              : null;
            
            const validValueDate = valueDate && !isNaN(valueDate.getTime()) 
              ? valueDate.toISOString().split("T")[0]
              : null;

            // Only consider rows as transactions if they have:
            // 1. A valid transaction_date
            // 2. A valid transaction_type (not "both")
            // 3. A valid balance
            const hasValidTransactionDate = validTransactionDate !== null;
            const hasValidTransactionType = transactionType !== "both";
            const hasValidBalance = balance !== null && balance !== undefined;

            if (!hasValidTransactionDate || !hasValidTransactionType || !hasValidBalance) {
              skippedCount++;
              console.log(`Row ${i + 1} skipped - missing required fields:`, {
                hasValidTransactionDate,
                hasValidTransactionType,
                transactionType,
                hasValidBalance,
                balance
              });
              continue;
            }

            // Store all original row data in metadata for reference
            const rowData: Record<string, any> = {};
            headers.forEach((header, idx) => {
              if (row[idx] !== undefined && row[idx] !== null && row[idx] !== "") {
                rowData[header] = row[idx];
              }
            });

            transactions.push({
              transaction_date: validTransactionDate,
              value_date: validValueDate,
              description: description || "Transaction",
              reference_number: reference || null,
              debit_amount: debit,
              credit_amount: credit,
              balance: balance,
              transaction_type: transactionType,
              metadata: {
                row_number: i + 1,
                original_data: rowData,
                all_columns: headers.map((h, idx) => ({ header: h, value: row[idx] })),
                // Store original formatted amounts as they appear in Excel
                original_debit: debitOriginal,
                original_credit: creditOriginal,
                original_balance: balanceOriginal,
              },
            });
            
            parsedCount++;
          }

          console.log("Parsing complete:", {
            totalRows: jsonData.length,
            headerRow: headerRowIndex,
            parsedTransactions: parsedCount,
            skippedRows: skippedCount,
            transactionsFound: transactions.length
          });

          // Sort transactions by date to properly set opening and closing balances
          const sortedTransactions = [...transactions].sort((a, b) => {
            const dateA = new Date(a.transaction_date).getTime();
            const dateB = new Date(b.transaction_date).getTime();
            return dateA - dateB;
          });

          // Set opening balance from first transaction and closing balance from last transaction
          let finalOpeningBalance = openingBalance;
          let finalClosingBalance = closingBalance;
          
          // Get period dates from first and last transactions
          let periodStartDate: Date | null = null;
          let periodEndDate: Date | null = null;

          if (sortedTransactions.length > 0) {
            // If we have a balance column, use the first transaction's balance to calculate opening
            // Opening balance = Balance shown + Debits - Credits (reverse the transaction)
            if (sortedTransactions[0].balance !== null) {
              finalOpeningBalance = sortedTransactions[0].balance + sortedTransactions[0].debit_amount - sortedTransactions[0].credit_amount;
            }
            // Use the last transaction's balance as closing balance
            if (sortedTransactions[sortedTransactions.length - 1].balance !== null) {
              finalClosingBalance = sortedTransactions[sortedTransactions.length - 1].balance;
            }
            
            // Get period dates from first and last transactions
            const firstTransactionDate = new Date(sortedTransactions[0].transaction_date);
            const lastTransactionDate = new Date(sortedTransactions[sortedTransactions.length - 1].transaction_date);
            
            if (!isNaN(firstTransactionDate.getTime())) {
              periodStartDate = firstTransactionDate;
            }
            if (!isNaN(lastTransactionDate.getTime())) {
              periodEndDate = lastTransactionDate;
            }
          }

          // Calculate totals from transactions (fallback)
          let calculatedTotalDebits = transactions.reduce((sum, t) => sum + (t.debit_amount || 0), 0);
          let calculatedTotalCredits = transactions.reduce((sum, t) => sum + (t.credit_amount || 0), 0);
          
          // Try to extract totals from the summary section of the document
          // This is more accurate than calculating from transactions in case some rows are missing
          const tempMetadata = extractSummaryAndCustomerInfo(jsonData);
          
          // Extract amounts from ABOVE transactions
          const { totalDebitAmount: extractedDebitAmount, totalCreditAmount: extractedCreditAmount } = extractDebitCreditAmounts(jsonData, tempMetadata.headerRowIndex);
          
          // Extract counts from BELOW transactions
          const { totalDebits: extractedTotalDebits, totalCredits: extractedTotalCredits } = extractTotalsFromSummary(jsonData, tempMetadata.headerRowIndex, tempMetadata.summaryInfo);
          
          // Use extracted amounts if available, otherwise use calculated amounts
          const finalTotalDebits = extractedDebitAmount !== null ? extractedDebitAmount : calculatedTotalDebits;
          const finalTotalCredits = extractedCreditAmount !== null ? extractedCreditAmount : calculatedTotalCredits;

          const statement = {
            file_name: file.name,
            file_url: "", // Will be set after upload
            bank_name: null,
            account_number: null,
            statement_period_start: periodStartDate && !isNaN(periodStartDate.getTime()) ? periodStartDate.toISOString().split("T")[0] : null,
            statement_period_end: periodEndDate && !isNaN(periodEndDate.getTime()) ? periodEndDate.toISOString().split("T")[0] : null,
            total_debits: finalTotalDebits,
            total_credits: finalTotalCredits,
            opening_balance: finalOpeningBalance,
            closing_balance: finalClosingBalance,
            currency: company?.currency || "INR",
            metadata: {
              uploaded_at: new Date().toISOString(),
              // Use extracted transaction count if available (from summary), otherwise use parsed row count
              total_transactions: (extractedTotalDebits !== null && extractedTotalCredits !== null) 
                ? (extractedTotalDebits + extractedTotalCredits) 
                : transactions.length,
            },
          };

          resolve({ statement, transactions });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const excelFile = files.find(f => 
        f.name.endsWith('.xlsx') || 
        f.name.endsWith('.xls') || 
        f.name.endsWith('.csv')
      );

      if (excelFile) {
        await uploadStatement(excelFile);
      } else {
        toast({
          title: "Invalid file",
          description: "Please upload an Excel file (.xlsx, .xls, or .csv)",
          variant: "destructive",
        });
      }
    },
    [company, user]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadStatement(file);
    }
  };

  const uploadStatement = async (file: File) => {
    if (!user || !company) {
      toast({
        title: "Error",
        description: "Please log in to upload statements",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx, .xls, or .csv)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      // Sanitize filename to remove special characters that might cause issues
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${user.id}/statements/${Date.now()}_${sanitizedFileName}`;
      
      // Upload with proper content type
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let contentType = file.type || 'application/octet-stream';
      
      // Ensure correct MIME type for Excel files (browsers sometimes don't set this correctly)
      if (fileExt === 'xlsx') {
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (fileExt === 'xls') {
        contentType = 'application/vnd.ms-excel';
      } else if (fileExt === 'csv') {
        contentType = 'text/csv';
      }
      
      console.log('Uploading file:', {
        path: filePath,
        name: file.name,
        size: file.size,
        type: contentType,
        originalType: file.type,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("Bank Statements")
        .upload(filePath, file, {
          contentType: contentType,
          upsert: false,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error("Upload error details:", {
          error: uploadError,
          message: uploadError.message,
        });
        
        // Provide more helpful error messages
        if (uploadError.message?.includes('new row violates row-level security policy') || 
            uploadError.message?.includes('RLS policy')) {
          throw new Error('Permission denied. Please ensure you are logged in and have permission to upload statements.');
        }
        if (uploadError.message?.includes('File size exceeds') || 
            uploadError.message?.includes('too large')) {
          throw new Error('File size exceeds the 20MB limit. Please upload a smaller file.');
        }
        if (uploadError.message?.includes('Invalid file type') || 
            uploadError.message?.includes('MIME type') ||
            uploadError.message?.includes('not allowed')) {
          throw new Error('Invalid file type. The bucket needs to be updated to allow Excel files. Please contact your administrator or run the migration: 20251231030000_update_bank_statements_bucket_for_statements.sql');
        }
        if (uploadError.message?.includes('Bad Request') || uploadError.message?.includes('400')) {
          throw new Error(`Upload failed: ${uploadError.message || 'Bad Request. Please check file format and try again.'}`);
        }
        throw new Error(uploadError.message || 'Failed to upload file. Please try again.');
      }

      if (!uploadData) {
        throw new Error('Upload completed but no data returned');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("Bank Statements")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get file URL after upload');
      }

      console.log('File uploaded successfully:', urlData.publicUrl);

      // Parse Excel file
      const { statement, transactions } = await parseExcelFile(file);

      // Create statement with transactions
      await createStatement.mutateAsync({
        statement: {
          ...statement,
          file_url: urlData.publicUrl,
        },
        transactions,
      });

      toast({
        title: "Success",
        description: `Uploaded and parsed ${transactions.length} transactions`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload and parse statement",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: company?.currency || "INR",
    }).format(amount);
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bank Statements</h1>
            <p className="text-muted-foreground">
              Upload and manage your bank statements
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Statement</CardTitle>
          <CardDescription>
            Upload an Excel file (.xlsx, .xls, or .csv) containing your bank statement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
              ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-primary/50"}
            `}
            onClick={() => document.getElementById("statement-file-input")?.click()}
          >
            <input
              id="statement-file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            {isUploading ? (
              <>
                <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium">Processing statement...</p>
                <p className="text-sm text-muted-foreground">Please wait while we parse your file</p>
              </>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drag and drop your statement file here, or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports .xlsx, .xls, and .csv formats
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statements List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Statements</CardTitle>
          <CardDescription>
            View and manage your uploaded bank statements
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : statements && statements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Opening Balance</TableHead>
                  <TableHead>Closing Balance</TableHead>
                  <TableHead>Total Credits</TableHead>
                  <TableHead>Total Debits</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statements?.map((statement: any) => (
                  <TableRow
                    key={statement.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedStatementId(
                      selectedStatementId === statement.id ? null : statement.id
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{statement.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatementPeriod statementId={statement.id} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(statement.metadata as any)?.total_transactions || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(statement.opening_balance)}</TableCell>
                    <TableCell>{formatCurrency(statement.closing_balance)}</TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(statement.total_credits)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {formatCurrency(statement.total_debits)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(statement.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (statement.file_url) {
                              window.open(statement.file_url, "_blank");
                            }
                          }}
                          title="View Document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (statement.file_url) {
                              window.open(statement.file_url, "_blank");
                            }
                          }}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteStatementId(statement.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No statements uploaded</p>
              <p className="text-sm text-muted-foreground">
                Upload your first bank statement to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Detail */}
      {selectedStatementId && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction Details</CardTitle>
                <CardDescription>
                  Showing {sortedTransactions?.length || 0} transactions from the selected statement
                </CardDescription>
              </div>
              {sortedTransactions && sortedTransactions.length > 0 && (
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Debit Transactions</p>
                    <p className="text-red-600 font-bold text-lg">
                      {(sortedTransactions as any[]).filter((t: any) => t.debit_amount > 0).length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Credit Transactions</p>
                    <p className="text-green-600 font-bold text-lg">
                      {(sortedTransactions as any[]).filter((t: any) => t.credit_amount > 0).length}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transactionsLoading ? (
              <div className="p-6">
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : sortedTransactions && sortedTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Value Date</TableHead>
                      <TableHead className="min-w-[250px]">Transaction Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right min-w-[140px] font-semibold">Debit Amount</TableHead>
                      <TableHead className="text-right min-w-[140px] font-semibold">Credit Amount</TableHead>
                      <TableHead className="text-right min-w-[140px] font-semibold">Balance</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTransactions?.map((transaction: any, index: number) => {
                      const metadata = transaction.metadata as any;
                      const allColumns = metadata?.all_columns || [];
                      
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              // Extract Transaction Date from metadata column in its original format
                              const metadataDate = getTransactionDateFromMetadataOriginal(metadata);
                              // Use metadata date if available (already in original format like "14-May-2025")
                              if (metadataDate) {
                                return metadataDate;
                              } else if (transaction.transaction_date) {
                                // Fallback to transaction_date if metadata doesn't have date
                                return format(new Date(transaction.transaction_date), "MMM d, yyyy");
                              } else {
                                return "—";
                              }
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              // Extract Value Date from metadata column in its original format
                              const metadataValueDate = getValueDateFromMetadataOriginal(metadata);
                              // Use metadata date if available (already in original format like "14-May-2025")
                              if (metadataValueDate) {
                                return metadataValueDate;
                              } else if (transaction.value_date) {
                                // Fallback to value_date if metadata doesn't have date
                                return format(new Date(transaction.value_date), "MMM d, yyyy");
                              } else {
                                return "—";
                              }
                            })()}
                          </TableCell>
                          <TableCell className="min-w-[400px] max-w-[600px]">
                            <div className="space-y-1">
                              {/* Show full transaction description exactly as in Excel */}
                              <div className="text-sm font-medium break-words leading-relaxed" title={transaction.description}>
                                {transaction.description || "—"}
                              </div>
                              {allColumns.length > 0 && (
                                <details className="mt-2">
                                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                    View all {allColumns.length} columns
                                  </summary>
                                  <div className="mt-2 text-xs space-y-1 max-h-60 overflow-y-auto bg-muted/50 p-3 rounded border">
                                    {allColumns.map((col: any, idx: number) => (
                                      <div key={idx} className="flex justify-between gap-4 py-1 border-b border-border/50 last:border-0">
                                        <span className="font-semibold text-muted-foreground min-w-[120px]">{col.header}:</span>
                                        <span className="text-foreground break-words text-right flex-1">{String(col.value || "—")}</span>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{transaction.reference_number || "—"}</span>
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-semibold">
                            {(() => {
                              const metadata = transaction.metadata as any;
                              const originalDebit = metadata?.original_debit;
                              
                              // Always show debit amount if it exists
                              if (transaction.debit_amount > 0) {
                                // Prefer original Excel format, fallback to formatted
                                if (originalDebit && originalDebit !== "" && originalDebit !== "0") {
                                  return (
                                    <div className="whitespace-nowrap font-semibold">
                                      {originalDebit}
                                    </div>
                                  );
                                }
                                return (
                                  <div className="whitespace-nowrap font-semibold">
                                    {formatCurrency(transaction.debit_amount)}
                                  </div>
                                );
                              }
                              return <span className="text-muted-foreground">—</span>;
                            })()}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            {(() => {
                              const metadata = transaction.metadata as any;
                              const originalCredit = metadata?.original_credit;
                              
                              // Always show credit amount if it exists
                              if (transaction.credit_amount > 0) {
                                // ALWAYS prefer original Excel format if available (preserves exact formatting like "30,000.00")
                                if (originalCredit && originalCredit !== "" && originalCredit !== "0" && originalCredit !== "0.00") {
                                  return (
                                    <div className="whitespace-nowrap font-semibold">
                                      {originalCredit}
                                    </div>
                                  );
                                }
                                // Fallback to formatted currency only if original not available
                                return (
                                  <div className="whitespace-nowrap font-semibold">
                                    {formatCurrency(transaction.credit_amount)}
                                  </div>
                                );
                              }
                              return <span className="text-muted-foreground">—</span>;
                            })()}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {(() => {
                              const metadata = transaction.metadata as any;
                              const originalBalance = metadata?.original_balance;
                              // Show original Excel format if available, otherwise format the number
                              if (originalBalance && originalBalance !== "" && originalBalance !== "0") {
                                return <span className="whitespace-nowrap">{originalBalance}</span>;
                              }
                              return transaction.balance !== null && transaction.balance !== undefined ? (
                                <span className="whitespace-nowrap">{formatCurrency(transaction.balance)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              transaction.transaction_type === "debit" ? "destructive" :
                              transaction.transaction_type === "credit" ? "default" : "secondary"
                            }>
                              {transaction.transaction_type}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No transactions found. The Excel file may not have been parsed correctly.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Viewer Modal */}
      {viewerOpen && viewingStatement && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">{viewingStatement.file_name}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setViewerOpen(false);
                  setViewingStatement(null);
                  setExcelData([]);
                  setDocumentMetadata(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              {loadingDocument ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading document...</p>
                </div>
              ) : isExcelFile(viewingStatement.file_name) ? (
                // Excel file view
                excelData.length > 0 ? (
                  <div className="p-4 overflow-x-auto">

                    {/* Raw Data View - Display all data directly */}
                      <div className="mt-4 overflow-x-auto">
                        <Table className="text-sm border-collapse border border-gray-300">
                          <TableHeader>
                            <TableRow className="bg-gray-100">
                              {excelData[0]?.map((header: any, idx: number) => (
                                <TableHead key={idx} className="border border-gray-300 p-2 text-left font-semibold min-w-max">{header || `Col ${idx + 1}`}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {excelData.slice(1).map((row: any, rowIdx: number) => (
                              <TableRow key={rowIdx} className="hover:bg-gray-50">
                                {row.map((cell: any, cellIdx: number) => (
                                  <TableCell key={cellIdx} className="border border-gray-300 p-2 text-xs align-top break-words">
                                    {cell !== undefined && cell !== null ? String(cell) : '—'}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 text-yellow-600" />
                    <p>Could not parse Excel file</p>
                  </div>
                )
              ) : (
                // PDF/Image view
                <iframe
                  src={viewingStatement.file_url}
                  className="w-full h-full"
                  title={viewingStatement.file_name}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteStatementId} onOpenChange={() => setDeleteStatementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Statement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this statement? This will also delete all associated transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteStatementId) {
                  deleteStatement.mutate(deleteStatementId);
                  setDeleteStatementId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Statement;
