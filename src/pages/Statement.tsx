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
} from "lucide-react";
import { format, parse } from "date-fns";
import { useBankStatements, useBankStatementTransactions, useCreateBankStatement, useDeleteBankStatement } from "@/hooks/useStatements";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

const Statement = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteStatementId, setDeleteStatementId] = useState<string | null>(null);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);

  const { data: statements, isLoading } = useBankStatements();
  const { data: transactions, isLoading: transactionsLoading } = useBankStatementTransactions(selectedStatementId);
  const createStatement = useCreateBankStatement();
  const deleteStatement = useDeleteBankStatement();
  const { data: company } = useCompany();
  const { user } = useAuth();

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
          const workbook = XLSX.read(data, { type: "array" });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

          // Find header row (usually first row with column names)
          let headerRowIndex = 0;
          for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i] as any[];
            if (row && row.some(cell => 
              typeof cell === 'string' && (
                cell.toLowerCase().includes('date') ||
                cell.toLowerCase().includes('description') ||
                cell.toLowerCase().includes('debit') ||
                cell.toLowerCase().includes('credit') ||
                cell.toLowerCase().includes('amount') ||
                cell.toLowerCase().includes('balance')
              )
            )) {
              headerRowIndex = i;
              break;
            }
          }

          const headers = (jsonData[headerRowIndex] as any[]).map((h: any) => 
            String(h || "").toLowerCase().trim()
          );

          // Map common column names
          const dateCol = headers.findIndex(h => 
            h.includes('date') || h.includes('transaction date') || h.includes('value date')
          );
          const valueDateCol = headers.findIndex(h => 
            h.includes('value date') && !h.includes('transaction')
          );
          const descCol = headers.findIndex(h => 
            h.includes('description') || h.includes('narration') || h.includes('particulars') || h.includes('details')
          );
          const refCol = headers.findIndex(h => 
            h.includes('reference') || h.includes('ref') || h.includes('cheque') || h.includes('chq')
          );
          const debitCol = headers.findIndex(h => 
            h.includes('debit') || h.includes('withdrawal') || h.includes('dr')
          );
          const creditCol = headers.findIndex(h => 
            h.includes('credit') || h.includes('deposit') || h.includes('cr')
          );
          const balanceCol = headers.findIndex(h => 
            h.includes('balance') || h.includes('closing balance')
          );

          const transactions: any[] = [];
          let openingBalance: number | null = null;
          let closingBalance: number | null = null;
          let minDate: Date | null = null;
          let maxDate: Date | null = null;

          // Parse transactions
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (!row || row.length === 0) continue;

            // Skip empty rows
            if (row.every(cell => !cell || String(cell).trim() === '')) continue;

            const dateStr = dateCol >= 0 ? String(row[dateCol] || "").trim() : "";
            const valueDateStr = valueDateCol >= 0 ? String(row[valueDateCol] || "").trim() : dateStr;
            const description = descCol >= 0 ? String(row[descCol] || "").trim() : "";
            const reference = refCol >= 0 ? String(row[refCol] || "").trim() : "";
            
            // Parse amounts - handle various formats
            const debitStr = debitCol >= 0 ? String(row[debitCol] || "0").trim().replace(/,/g, "") : "0";
            const creditStr = creditCol >= 0 ? String(row[creditCol] || "0").trim().replace(/,/g, "") : "0";
            const balanceStr = balanceCol >= 0 ? String(row[balanceCol] || "").trim().replace(/,/g, "") : "";

            const debit = parseFloat(debitStr) || 0;
            const credit = parseFloat(creditStr) || 0;
            const balance = balanceStr ? parseFloat(balanceStr) : null;

            // Skip if no date and no amounts
            if (!dateStr && debit === 0 && credit === 0) continue;

            // Parse date - try multiple formats
            let transactionDate: Date | null = null;
            let valueDate: Date | null = null;

            const dateFormats = [
              "dd/MM/yyyy",
              "dd-MM-yyyy",
              "yyyy-MM-dd",
              "MM/dd/yyyy",
              "dd.MM.yyyy",
              "yyyy/MM/dd",
            ];

            for (const format of dateFormats) {
              try {
                if (dateStr) {
                  transactionDate = parse(dateStr, format, new Date());
                  if (!isNaN(transactionDate.getTime())) break;
                }
              } catch {}
            }

            if (!transactionDate && dateStr) {
              // Try Excel date serial number
              const excelDate = parseFloat(dateStr);
              if (!isNaN(excelDate) && excelDate > 25569) {
                // Excel epoch starts from 1900-01-01
                transactionDate = new Date((excelDate - 25569) * 86400 * 1000);
              }
            }

            if (!transactionDate) continue;

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
            if (!minDate || transactionDate < minDate) minDate = transactionDate;
            if (!maxDate || transactionDate > maxDate) maxDate = transactionDate;

            // Track opening/closing balance
            if (balance !== null) {
              if (openingBalance === null) openingBalance = balance;
              closingBalance = balance;
            }

            const transactionType = debit > 0 && credit > 0 ? "both" : debit > 0 ? "debit" : "credit";

            transactions.push({
              transaction_date: transactionDate.toISOString().split("T")[0],
              value_date: valueDate ? valueDate.toISOString().split("T")[0] : null,
              description: description || "N/A",
              reference_number: reference || null,
              debit_amount: debit,
              credit_amount: credit,
              balance: balance,
              transaction_type: transactionType,
            });
          }

          // Calculate totals
          const totalDebits = transactions.reduce((sum, t) => sum + (t.debit_amount || 0), 0);
          const totalCredits = transactions.reduce((sum, t) => sum + (t.credit_amount || 0), 0);

          const statement = {
            file_name: file.name,
            file_url: "", // Will be set after upload
            bank_name: null,
            account_number: null,
            statement_period_start: minDate ? minDate.toISOString().split("T")[0] : null,
            statement_period_end: maxDate ? maxDate.toISOString().split("T")[0] : null,
            total_debits: totalDebits,
            total_credits: totalCredits,
            opening_balance: openingBalance,
            closing_balance: closingBalance,
            currency: company?.currency || "INR",
            metadata: {
              uploaded_at: new Date().toISOString(),
              total_transactions: transactions.length,
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
        .from("receipts")
        .upload(filePath, file, {
          contentType: contentType,
          upsert: false,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error("Upload error details:", {
          error: uploadError,
          message: uploadError.message,
          statusCode: uploadError.statusCode,
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
          throw new Error('Invalid file type. The bucket needs to be updated to allow Excel files. Please contact your administrator or run the migration: 20251231030000_update_receipts_bucket_for_statements.sql');
        }
        if (uploadError.statusCode === '400') {
          throw new Error(`Upload failed: ${uploadError.message || 'Bad Request. Please check file format and try again.'}`);
        }
        throw new Error(uploadError.message || 'Failed to upload file. Please try again.');
      }

      if (!uploadData) {
        throw new Error('Upload completed but no data returned');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("receipts")
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
                {statements.map((statement) => (
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
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Detailed transaction list for selected statement
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {transactionsLoading ? (
              <div className="p-6">
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : transactions && transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.transaction_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="truncate">{transaction.description}</p>
                      </TableCell>
                      <TableCell>
                        {transaction.reference_number || "—"}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {transaction.debit_amount > 0 ? formatCurrency(transaction.debit_amount) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {transaction.credit_amount > 0 ? formatCurrency(transaction.credit_amount) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(transaction.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                No transactions found
              </div>
            )}
          </CardContent>
        </Card>
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
