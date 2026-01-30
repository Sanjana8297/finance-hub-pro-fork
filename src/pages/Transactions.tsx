import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  FileSpreadsheet,
  ChevronLeft,
  Eye,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  X,
  File,
} from "lucide-react";
import { format } from "date-fns";
import { useBankStatements, useBankStatementTransactions, useUpdateBankStatementTransaction } from "@/hooks/useStatements";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const Transactions = () => {
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(-1);
  const [transactionStartRow, setTransactionStartRow] = useState<number>(-1);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [proofValues, setProofValues] = useState<Record<string, string>>({});
  const [uploadingProofs, setUploadingProofs] = useState<Record<string, boolean>>({});
  const { data: statements, isLoading } = useBankStatements();
  const { data: transactions, isLoading: transactionsLoading } = useBankStatementTransactions(selectedStatementId);
  const { data: company } = useCompany();
  const { user } = useAuth();
  const updateTransaction = useUpdateBankStatementTransaction();

  // Handle file upload for proof
  const handleProofFileUpload = async (transactionId: string, file: File) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to upload files",
        variant: "destructive",
      });
      return;
    }

    setUploadingProofs(prev => ({ ...prev, [transactionId]: true }));

    try {
      const fileExt = file.name.split(".").pop();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${user.id}/transaction-proofs/${transactionId}/${Date.now()}_${sanitizedFileName}`;

      // Determine content type
      let contentType = file.type || 'application/octet-stream';
      if (fileExt === 'pdf') {
        contentType = 'application/pdf';
      } else if (['jpg', 'jpeg'].includes(fileExt || '')) {
        contentType = 'image/jpeg';
      } else if (fileExt === 'png') {
        contentType = 'image/png';
      }

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, file, {
          contentType: contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get file URL after upload');
      }

      // Update proof value with the uploaded file URL
      setProofValues(prev => ({
        ...prev,
        [transactionId]: urlData.publicUrl
      }));

      // Save to database
      updateTransaction.mutate({
        transactionId,
        proof: urlData.publicUrl
      });

      toast({
        title: "File uploaded",
        description: "Proof file has been uploaded successfully",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingProofs(prev => ({ ...prev, [transactionId]: false }));
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: company?.currency || "INR",
    }).format(amount);
  };

  // Extract mode of payment from description (text before first "/")
  const extractModeOfPayment = (description: string | null) => {
    if (!description) return "—";
    const parts = String(description).split("/");
    return parts[0]?.trim() || String(description);
  };

  // Find header row and transaction start row
  const findHeaderRow = (data: any[][]) => {
    // Skip summary rows - look for transaction-specific headers
    const summaryKeywords = ["opening balance", "closing balance", "total debit", "total credit"];
    
    for (let i = 0; i < Math.min(50, data.length); i++) {
      const row = data[i] as any[];
      if (!row || row.length === 0) continue;

      const rowText = row.map((cell) => String(cell || "").toLowerCase().trim()).join(" ");
      
      // Skip if this looks like a summary row
      const isSummaryRow = summaryKeywords.some(keyword => rowText.includes(keyword));
      if (isSummaryRow) continue;

      // Look for transaction header keywords
      const headerKeywords = [
        "transaction date",
        "value date",
        "date",
        "particulars",
        "description",
        "narration",
        "debit",
        "credit",
        "balance",
        "cheque",
        "reference",
        "ref",
      ];
      
      const keywordCount = headerKeywords.filter((keyword) => rowText.includes(keyword)).length;
      
      // Must have "particulars" or "description" or "narration" to be a transaction header row
      // This distinguishes it from summary rows which don't have these
      const hasParticulars = rowText.includes("particulars") || rowText.includes("description") || rowText.includes("narration");
      const hasDate = rowText.includes("transaction date") || rowText.includes("value date") || (rowText.includes("date") && keywordCount >= 3);
      
      // Require at least 3 keywords AND must have particulars/description/narration
      // This ensures we get the transaction header, not the summary header
      if (keywordCount >= 3 && hasParticulars) {
        console.log(`Found transaction header row at index ${i}:`, row);
        return i;
      }
      
      // Fallback: if we have date and enough keywords but no particulars, still consider it
      // but only if it's clearly a transaction row (has cheque, reference, etc.)
      if (hasDate && keywordCount >= 4 && (rowText.includes("cheque") || rowText.includes("reference") || rowText.includes("ref"))) {
        console.log(`Found transaction header row at index ${i} (fallback):`, row);
        return i;
      }
    }
    return -1;
  };

  // Load Excel file
  const loadExcelFile = async (fileUrl: string) => {
    try {
      setLoadingExcel(true);
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

      // Find header row
      const headerIdx = findHeaderRow(paddedData);
      setHeaderRowIndex(headerIdx);
      
      if (headerIdx >= 0) {
        // Get headers
        const headers = paddedData[headerIdx].map((h: any) => String(h || "").trim());
        console.log('Setting headers from row', headerIdx, ':', headers);
        
        // Verify this is the correct row by checking for Particulars
        const hasParticulars = headers.some(h => 
          String(h || "").toLowerCase().includes("particulars") ||
          String(h || "").toLowerCase().includes("description") ||
          String(h || "").toLowerCase().includes("narration")
        );
        
        if (!hasParticulars) {
          console.warn('WARNING: Header row does not contain Particulars/Description/Narration!');
          console.warn('This might be the wrong row. Looking for transaction header...');
          
          // Try to find the correct row manually
          for (let i = headerIdx + 1; i < Math.min(headerIdx + 10, paddedData.length); i++) {
            const testRow = paddedData[i];
            if (!testRow) continue;
            const testHeaders = testRow.map((h: any) => String(h || "").trim());
            const testHasParticulars = testHeaders.some(h => 
              String(h || "").toLowerCase().includes("particulars") ||
              String(h || "").toLowerCase().includes("description") ||
              String(h || "").toLowerCase().includes("narration")
            );
            if (testHasParticulars) {
              console.log('Found correct header row at index', i, ':', testHeaders);
              setExcelHeaders(testHeaders);
              setTransactionStartRow(i + 1);
              setHeaderRowIndex(i);
              return;
            }
          }
        }
        
        setExcelHeaders(headers);
        setTransactionStartRow(headerIdx + 1);
      } else {
        console.error('Header row not found!');
      }
    } catch (err) {
      console.error('Error loading Excel file:', err);
      setExcelData([]);
      setExcelHeaders([]);
      setHeaderRowIndex(-1);
      setTransactionStartRow(-1);
    } finally {
      setLoadingExcel(false);
    }
  };

  const selectedStatement = statements?.find((s) => s.id === selectedStatementId);

  // Load Excel when statement is selected
  useEffect(() => {
    if (selectedStatement?.file_url) {
      const fileExtension = selectedStatement.file_name.split('.').pop()?.toLowerCase() || '';
      if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
        loadExcelFile(selectedStatement.file_url);
      }
    } else {
      setExcelData([]);
      setExcelHeaders([]);
      setHeaderRowIndex(-1);
      setTransactionStartRow(-1);
    }
  }, [selectedStatementId, selectedStatement?.file_url]);

  // Initialize proof values from transactions when they load
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const initialProofs: Record<string, string> = {};
      transactions.forEach((txn: any) => {
        const metadata = txn.metadata as any;
        // Initialize with existing proof or empty string
        initialProofs[txn.id] = metadata?.proof || "";
      });
      setProofValues(prev => ({
        ...prev,
        ...initialProofs
      }));
      console.log('Initialized proof values for', transactions.length, 'transactions');
    }
  }, [transactions]);

  if (selectedStatementId && selectedStatement) {
    return (
      <DashboardLayout>
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setSelectedStatementId(null)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Statements
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
            <p className="text-muted-foreground">
              {selectedStatement.file_name}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Statement Information</CardTitle>
                <CardDescription>
                  Period: {selectedStatement.statement_period_start && selectedStatement.statement_period_end ? 
                    `${format(new Date(selectedStatement.statement_period_start), "MMM d, yyyy")} - ${format(new Date(selectedStatement.statement_period_end), "MMM d, yyyy")}` : 'N/A'}
                </CardDescription>
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Opening Balance</p>
                  <p className="font-semibold">{formatCurrency(selectedStatement.opening_balance)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Closing Balance</p>
                  <p className="font-semibold">{formatCurrency(selectedStatement.closing_balance)}</p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {loadingExcel ? "Loading document..." : excelData.length > 0 
                ? `Showing transactions from the uploaded document` 
                : "No document data available"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingExcel ? (
              <div className="p-6 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Loading document...</span>
              </div>
            ) : headerRowIndex >= 0 && transactionStartRow >= 0 && excelData.length > 0 ? (
              <div className="overflow-x-auto">
                {(() => {
                  // Find Credit column index
                  const creditColIndex = excelHeaders.findIndex(h => 
                    String(h || "").toLowerCase().includes("credit")
                  );
                  
                  // Find particulars/description column for mode of payment
                  // Try multiple search strategies
                  let particularsColIndex = excelHeaders.findIndex(h => {
                    const headerLower = String(h || "").toLowerCase().trim();
                    return headerLower === "particulars" || headerLower.includes("particulars");
                  });
                  
                  // If not found, try other variations
                  if (particularsColIndex === -1) {
                    particularsColIndex = excelHeaders.findIndex(h => {
                      const headerLower = String(h || "").toLowerCase().trim();
                      return headerLower.includes("description") || 
                             headerLower.includes("narration") ||
                             headerLower === "particular" ||
                             headerLower === "desc" ||
                             headerLower === "details";
                    });
                  }
                  
                  // Debug logging
                  console.log('Excel Headers:', excelHeaders);
                  console.log('Particulars Column Index:', particularsColIndex);
                  if (particularsColIndex >= 0) {
                    console.log('Found Particulars column:', excelHeaders[particularsColIndex]);
                  } else {
                    console.warn('Particulars column not found! Available headers:', excelHeaders);
                  }
                  console.log('Credit Column Index:', creditColIndex);

                  // Build header row with Proof inserted after Credit and Particulars replaced with Mode of Payment
                  const buildHeaderRow = () => {
                    const headers: JSX.Element[] = [];
                    excelHeaders.forEach((header, idx) => {
                      const headerStr = String(header || "").trim().toLowerCase();
                      const isParticulars = idx === particularsColIndex && particularsColIndex >= 0;
                      
                      // Replace Particulars column header with "Mode of Payment"
                      if (isParticulars) {
                        headers.push(
                          <TableHead key={idx} className="border border-border p-2 text-left font-semibold min-w-[150px] bg-blue-50">
                            Mode of Payment
                          </TableHead>
                        );
                      } else {
                        headers.push(
                          <TableHead key={idx} className="border border-border p-2 text-left font-semibold min-w-max whitespace-nowrap">
                            {header || `Column ${idx + 1}`}
                          </TableHead>
                        );
                      }
                      // Insert Proof column after Credit
                      if (idx === creditColIndex && creditColIndex >= 0) {
                        headers.push(
                          <TableHead key={`proof-header`} className="border border-border p-2 text-left font-semibold min-w-[100px] bg-green-50">
                            Proof
                          </TableHead>
                        );
                      }
                    });
                    return headers;
                  };

                  return (
                    <Table className="border-collapse">
                      <TableHeader>
                        <TableRow className="bg-muted">
                          {buildHeaderRow()}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {excelData.slice(transactionStartRow).map((row: any, rowIdx: number) => {
                          // Skip completely empty rows
                          const hasData = row.some((cell: any) => 
                            cell !== undefined && cell !== null && String(cell).trim() !== ""
                          );
                          if (!hasData) return null;

                          // Extract mode of payment from particulars
                          const particularsValue = particularsColIndex >= 0 ? row[particularsColIndex] : null;
                          const modeOfPayment = extractModeOfPayment(particularsValue);

                          // Try to find matching transaction from database
                          // Match by date and amount
                          const dateColIndex = excelHeaders.findIndex(h => 
                            String(h || "").toLowerCase().includes("date") && 
                            !String(h || "").toLowerCase().includes("value")
                          );
                          const debitColIndex = excelHeaders.findIndex(h => 
                            String(h || "").toLowerCase().includes("debit")
                          );
                          const creditColIndexForMatch = excelHeaders.findIndex(h => 
                            String(h || "").toLowerCase().includes("credit")
                          );
                          
                          // Extract row data for matching
                          const rowDate = dateColIndex >= 0 ? row[dateColIndex] : null;
                          const rowDebit = debitColIndex >= 0 ? parseFloat(String(row[debitColIndex] || "").replace(/[^0-9.-]/g, "")) : 0;
                          const rowCredit = creditColIndexForMatch >= 0 ? parseFloat(String(row[creditColIndexForMatch] || "").replace(/[^0-9.-]/g, "")) : 0;
                          
                          let matchingTransaction: any = null;
                          if (transactions && transactions.length > 0) {
                            
                            // Try to match transaction - use row index as fallback if exact match fails
                            // First try exact match by date and amount
                            matchingTransaction = transactions.find((txn: any) => {
                              try {
                                const txnDate = new Date(txn.transaction_date).toISOString().split('T')[0];
                                let rowDateStr = null;
                                if (rowDate) {
                                  // Handle Excel date serial numbers
                                  if (typeof rowDate === 'number') {
                                    const excelEpoch = new Date(1899, 11, 30);
                                    const date = new Date(excelEpoch.getTime() + rowDate * 86400000);
                                    rowDateStr = date.toISOString().split('T')[0];
                                  } else {
                                    rowDateStr = new Date(rowDate).toISOString().split('T')[0];
                                  }
                                }
                                const dateMatch = rowDateStr && txnDate === rowDateStr;
                                const amountMatch = (rowDebit > 0 && Math.abs(txn.debit_amount - rowDebit) < 0.01) ||
                                                  (rowCredit > 0 && Math.abs(txn.credit_amount - rowCredit) < 0.01);
                                return dateMatch && amountMatch;
                              } catch (e) {
                                return false;
                              }
                            });
                            
                            // Fallback: match by row index if we have transactions in order
                            if (!matchingTransaction && transactions.length > rowIdx) {
                              // Try to match by position in the list (assuming transactions are in the same order)
                              const sortedTransactions = [...transactions].sort((a, b) => 
                                new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
                              );
                              if (rowIdx < sortedTransactions.length) {
                                matchingTransaction = sortedTransactions[rowIdx];
                              }
                            }
                          }

                          const transactionId = matchingTransaction?.id;
                          const currentProof = transactionId ? (proofValues[transactionId] || "") : "";
                          
                          // Debug: Log first few rows to verify matching
                          if (rowIdx < 3 && transactions && transactions.length > 0) {
                            console.log(`Row ${rowIdx} matching:`, {
                              hasTransaction: !!matchingTransaction,
                              transactionId,
                              transactionsAvailable: transactions.length,
                              rowDate: dateColIndex >= 0 ? row[dateColIndex] : null,
                              rowDebit,
                              rowCredit
                            });
                          }
                          
                          // Debug logging
                          if (rowIdx < 3) {
                            console.log(`Row ${rowIdx}:`, {
                              transactionId,
                              hasTransaction: !!matchingTransaction,
                              currentProof,
                              transactionsCount: transactions?.length
                            });
                          }

                          // Build data row with Proof inserted after Credit and Particulars replaced with Mode of Payment
                          const cells: JSX.Element[] = [];
                          row.forEach((cell: any, cellIdx: number) => {
                            // Replace Particulars column value with extracted Mode of Payment
                            const isParticularsColumn = cellIdx === particularsColIndex && particularsColIndex >= 0;
                            
                            if (isParticularsColumn) {
                              cells.push(
                                <TableCell 
                                  key={cellIdx} 
                                  className="border border-border p-2 text-xs align-top break-words bg-blue-50/30"
                                >
                                  <div className="font-medium">{modeOfPayment}</div>
                                </TableCell>
                              );
                            } else {
                              cells.push(
                                <TableCell 
                                  key={cellIdx} 
                                  className="border border-border p-2 text-xs align-top break-words"
                                >
                                  {cell !== undefined && cell !== null ? String(cell) : '—'}
                                </TableCell>
                              );
                            }
                            // Insert Proof column after Credit
                            if (cellIdx === creditColIndex && creditColIndex >= 0) {
                              cells.push(
                                <TableCell key={`proof-${rowIdx}`} className="border border-border p-2 text-xs align-top break-words bg-green-50/30">
                                  {transactionId ? (
                                    <div className="space-y-1 min-w-[200px]">
                                      {currentProof ? (
                                        <div className="flex items-center gap-2 mb-1">
                                          {currentProof.startsWith('http') || currentProof.startsWith('/') ? (
                                            <a
                                              href={currentProof}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs underline truncate"
                                            >
                                              <LinkIcon className="h-3 w-3" />
                                              <span className="truncate max-w-[150px]">View Proof</span>
                                            </a>
                                          ) : (
                                            <a
                                              href={currentProof}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs underline truncate"
                                            >
                                              <File className="h-3 w-3" />
                                              <span className="truncate max-w-[150px]">View File</span>
                                            </a>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5"
                                            onClick={() => {
                                              setProofValues(prev => ({
                                                ...prev,
                                                [transactionId]: ""
                                              }));
                                              updateTransaction.mutate({
                                                transactionId,
                                                proof: ""
                                              });
                                            }}
                                            title="Clear proof"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : null}
                                      <div className="flex gap-1">
                                        <Input
                                          value={currentProof}
                                          onChange={(e) => {
                                            const newValue = e.target.value;
                                            setProofValues(prev => ({
                                              ...prev,
                                              [transactionId]: newValue
                                            }));
                                          }}
                                          onBlur={(e) => {
                                            if (transactionId) {
                                              const proofValue = e.target.value.trim();
                                              // Save even if empty to clear existing proof
                                              updateTransaction.mutate({
                                                transactionId,
                                                proof: proofValue
                                              });
                                            }
                                          }}
                                          placeholder="Enter URL or upload file"
                                          className="h-8 text-xs flex-1"
                                        />
                                        <input
                                          type="file"
                                          id={`proof-file-${transactionId}`}
                                          className="hidden"
                                          accept="image/*,application/pdf"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file && transactionId) {
                                              handleProofFileUpload(transactionId, file);
                                            }
                                            // Reset input
                                            e.target.value = '';
                                          }}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => {
                                            document.getElementById(`proof-file-${transactionId}`)?.click();
                                          }}
                                          disabled={uploadingProofs[transactionId]}
                                          title="Upload file"
                                        >
                                          {uploadingProofs[transactionId] ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Upload className="h-3 w-3" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : transactions && transactions.length > 0 ? (
                                    // Show editable field even if no exact match - use row index as fallback
                                    (() => {
                                      // Try to get transaction by row index as fallback
                                      const sortedTransactions = [...transactions].sort((a, b) => 
                                        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
                                      );
                                      const fallbackTransaction = rowIdx >= 0 && rowIdx < sortedTransactions.length 
                                        ? sortedTransactions[rowIdx] 
                                        : null;
                                      const fallbackTransactionId = fallbackTransaction?.id;
                                      const fallbackProof = fallbackTransactionId ? (proofValues[fallbackTransactionId] || "") : "";
                                      
                                      if (fallbackTransactionId) {
                                        return (
                                          <div className="space-y-1 min-w-[200px]">
                                            {fallbackProof ? (
                                              <div className="flex items-center gap-2 mb-1">
                                                {fallbackProof.startsWith('http') || fallbackProof.startsWith('/') ? (
                                                  <a
                                                    href={fallbackProof}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs underline truncate"
                                                  >
                                                    <LinkIcon className="h-3 w-3" />
                                                    <span className="truncate max-w-[150px]">View Proof</span>
                                                  </a>
                                                ) : (
                                                  <a
                                                    href={fallbackProof}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs underline truncate"
                                                  >
                                                    <File className="h-3 w-3" />
                                                    <span className="truncate max-w-[150px]">View File</span>
                                                  </a>
                                                )}
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-5 w-5"
                                                  onClick={() => {
                                                    setProofValues(prev => ({
                                                      ...prev,
                                                      [fallbackTransactionId]: ""
                                                    }));
                                                    updateTransaction.mutate({
                                                      transactionId: fallbackTransactionId,
                                                      proof: ""
                                                    });
                                                  }}
                                                  title="Clear proof"
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            ) : null}
                                            <div className="flex gap-1">
                                              <Input
                                                value={fallbackProof}
                                                onChange={(e) => {
                                                  const newValue = e.target.value;
                                                  setProofValues(prev => ({
                                                    ...prev,
                                                    [fallbackTransactionId]: newValue
                                                  }));
                                                }}
                                                onBlur={(e) => {
                                                  if (fallbackTransactionId) {
                                                    const proofValue = e.target.value.trim();
                                                    updateTransaction.mutate({
                                                      transactionId: fallbackTransactionId,
                                                      proof: proofValue
                                                    });
                                                  }
                                                }}
                                                placeholder="Enter URL or upload file"
                                                className="h-8 text-xs flex-1"
                                              />
                                              <input
                                                type="file"
                                                id={`proof-file-${fallbackTransactionId}`}
                                                className="hidden"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file && fallbackTransactionId) {
                                                    handleProofFileUpload(fallbackTransactionId, file);
                                                  }
                                                  e.target.value = '';
                                                }}
                                              />
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => {
                                                  document.getElementById(`proof-file-${fallbackTransactionId}`)?.click();
                                                }}
                                                disabled={uploadingProofs[fallbackTransactionId]}
                                                title="Upload file"
                                              >
                                                {uploadingProofs[fallbackTransactionId] ? (
                                                  <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                  <Upload className="h-3 w-3" />
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="text-muted-foreground text-xs italic">
                                          No transaction match
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </TableCell>
                              );
                            }
                          });

                          return (
                            <TableRow key={rowIdx} className="hover:bg-muted/50">
                              {cells}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  );
                })()}
              </div>
            ) : excelData.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                <p>Could not load document data.</p>
                <p className="text-sm mt-2">The file may not be in Excel format or could not be parsed.</p>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No transaction data found in the document.
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              View and manage transaction details from bank statements
            </p>
          </div>
        </div>
      </div>

      {/* Statements List */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Statements</CardTitle>
          <CardDescription>
            Select a statement to view its transaction details
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
                {statements.map((statement: any) => (
                  <TableRow
                    key={statement.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedStatementId(statement.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{statement.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {statement.statement_period_start && statement.statement_period_end ? (
                        <div className="text-sm">
                          {format(new Date(statement.statement_period_start), "MMM d, yyyy")} -{" "}
                          {format(new Date(statement.statement_period_end), "MMM d, yyyy")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStatementId(statement.id);
                        }}
                        title="View Transactions"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No statements found</p>
              <p className="text-sm text-muted-foreground">
                Upload statements from the Statement page to view transactions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Transactions;
