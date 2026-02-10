// import { useState } from "react";
// import { DashboardLayout } from "@/components/layout/DashboardLayout";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import {
//   FileText,
//   Download,
//   TrendingUp,
//   TrendingDown,
//   DollarSign,
//   Users,
//   Calendar,
//   Loader2,
// } from "lucide-react";
// import { generateReportPDF, downloadPDF } from "@/components/reports/ReportGenerator";
// import { CustomReportDialog } from "@/components/reports/CustomReportDialog";
// import { useInvoices, useInvoiceStats } from "@/hooks/useInvoices";
// import { useExpenses, useExpenseStats } from "@/hooks/useExpenses";
// import { useEmployees } from "@/hooks/useEmployees";
// import { useCompany } from "@/hooks/useCompany";
// import { useToast } from "@/hooks/use-toast";
// import { format, startOfMonth, endOfMonth } from "date-fns";
// import { formatCurrency } from "@/lib/utils";

// const reports = [
//   {
//     id: "1",
//     name: "Income Report",
//     description: "Detailed breakdown of all income sources",
//     icon: TrendingUp,
//     color: "bg-success/10 text-success",
//   },
//   {
//     id: "2",
//     name: "Expense Report",
//     description: "Complete expense analysis by category",
//     icon: TrendingDown,
//     color: "bg-destructive/10 text-destructive",
//   },
//   {
//     id: "3",
//     name: "Profit & Loss",
//     description: "Monthly P&L statement with comparisons",
//     icon: DollarSign,
//     color: "bg-primary/10 text-primary",
//   },
//   {
//     id: "4",
//     name: "Payroll Report",
//     description: "Employee payroll summary and deductions",
//     icon: Users,
//     color: "bg-info/10 text-info",
//   },
//   {
//     id: "5",
//     name: "Tax Report",
//     description: "Tax summary for compliance and filing",
//     icon: FileText,
//     color: "bg-warning/10 text-warning",
//   },
//   {
//     id: "6",
//     name: "Monthly Summary",
//     description: "Complete monthly financial overview",
//     icon: Calendar,
//     color: "bg-muted text-muted-foreground",
//   },
// ];

// const Reports = () => {
//   const [generatingId, setGeneratingId] = useState<string | null>(null);
//   const [downloadingId, setDownloadingId] = useState<string | null>(null);
//   const [customReportOpen, setCustomReportOpen] = useState(false);
//   const { toast } = useToast();
//   const { data: company } = useCompany();
//   const { data: invoices } = useInvoices();
//   const { data: invoiceStats } = useInvoiceStats();
//   const { data: expenses } = useExpenses();
//   const { data: expenseStats } = useExpenseStats();
//   const { data: employees } = useEmployees();

//   const currentDate = new Date();
//   const currentMonth = format(currentDate, "MMMM yyyy");
//   const monthStart = startOfMonth(currentDate);
//   const monthEnd = endOfMonth(currentDate);

//   const generateReportData = (reportId: string) => {
//     const period = currentMonth;

//     switch (reportId) {
//       case "1": // Income Report
//         const paidInvoices = invoices?.filter((inv) => inv.status === "paid") || [];
//         const totalIncome = invoiceStats?.paidAmount || 0;
//         const pendingIncome = invoiceStats?.pendingAmount || 0;
        
//         return {
//           title: "Income Report",
//           period,
//           companyName: company?.name,
//           sections: [
//             {
//               title: "Income Sources",
//               items: [
//                 { label: "Paid Invoices", value: paidInvoices.length },
//                 { label: "Total Paid Amount", value: totalIncome },
//                 { label: "Pending Amount", value: pendingIncome },
//                 { label: "Overdue Amount", value: invoiceStats?.overdueAmount || 0 },
//               ],
//             },
//           ],
//           totals: [
//             { label: "Total Revenue", value: invoiceStats?.totalRevenue || 0 },
//             { label: "Collected Revenue", value: totalIncome },
//             { label: "Outstanding Revenue", value: pendingIncome + (invoiceStats?.overdueAmount || 0) },
//           ],
//         };

//       case "2": // Expense Report
//         const totalExpenses = expenseStats?.totalAmount || 0;
//         const approvedExpenses = expenseStats?.approvedAmount || 0;
//         const pendingExpenses = expenseStats?.pendingAmount || 0;
        
//         return {
//           title: "Expense Report",
//           period,
//           companyName: company?.name,
//           sections: [
//             {
//               title: "Expense Summary",
//               items: [
//                 { label: "Total Expenses", value: expenses?.length || 0 },
//                 { label: "Approved Expenses", value: approvedExpenses },
//                 { label: "Pending Expenses", value: pendingExpenses },
//                 { label: "This Month Count", value: expenseStats?.thisMonthCount || 0 },
//               ],
//             },
//           ],
//           totals: [
//             { label: "Total Expense Amount", value: totalExpenses },
//             { label: "Approved Amount", value: approvedExpenses },
//             { label: "Pending Amount", value: pendingExpenses },
//           ],
//         };

//       case "3": // Profit & Loss
//         const revenue = invoiceStats?.paidAmount || 0;
//         const expensesTotal = expenseStats?.approvedAmount || 0;
//         const profit = revenue - expensesTotal;
//         const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
        
//         return {
//           title: "Profit & Loss Statement",
//           period,
//           companyName: company?.name,
//           sections: [
//             {
//               title: "Revenue",
//               items: [
//                 { label: "Total Revenue", value: invoiceStats?.totalRevenue || 0 },
//                 { label: "Collected Revenue", value: revenue },
//               ],
//             },
//             {
//               title: "Expenses",
//               items: [
//                 { label: "Total Expenses", value: expenseStats?.totalAmount || 0 },
//                 { label: "Approved Expenses", value: expensesTotal },
//               ],
//             },
//           ],
//           totals: [
//             { label: "Net Profit", value: profit },
//             { label: "Profit Margin", value: `${profitMargin.toFixed(2)}%` },
//           ],
//         };

//       case "4": // Payroll Report
//         const totalEmployeesCount = employees?.length || 0;
//         const activeEmployees = employees?.filter((e) => e.status === "active").length || 0;
//         const totalPayroll = employees?.reduce((sum, e) => sum + (Number(e.salary) || 0), 0) || 0;
//         const monthlyPayroll = totalPayroll / 12;
        
//         return {
//           title: "Payroll Report",
//           period,
//           companyName: company?.name,
//           sections: [
//             {
//               title: "Employee Summary",
//               items: [
//                 { label: "Total Employees", value: totalEmployeesCount },
//                 { label: "Active Employees", value: activeEmployees },
//                 { label: "On Leave", value: (employees?.filter((e) => e.status === "on-leave").length || 0) },
//               ],
//             },
//           ],
//           totals: [
//             { label: "Annual Payroll", value: totalPayroll },
//             { label: "Monthly Payroll", value: monthlyPayroll },
//           ],
//         };

//       case "5": // Tax Report
//         const taxableIncome = (invoiceStats?.paidAmount || 0) - (expenseStats?.approvedAmount || 0);
//         // Note: Tax rate should be configured in company settings or tax configuration
//         // Using a placeholder rate - this should be made configurable
//         const taxRate = 0.18; // Default 18% GST rate for India
//         const estimatedTax = taxableIncome * taxRate;
        
//         return {
//           title: "Tax Report",
//           period,
//           companyName: company?.name,
//           sections: [
//             {
//               title: "Tax Information",
//               items: [
//                 { label: "Taxable Income", value: taxableIncome },
//                 { label: "Estimated Tax Rate", value: `${(taxRate * 100).toFixed(0)}%` },
//                 { label: "Tax ID", value: company?.tax_id || company?.gstin || "N/A" },
//                 { label: "PAN", value: company?.pan || "N/A" },
//               ],
//             },
//           ],
//           totals: [
//             { label: "Estimated Tax Liability", value: estimatedTax },
//           ],
//         };

//       case "6": // Monthly Summary
//         const monthlyRevenue = invoiceStats?.paidAmount || 0;
//         const monthlyExpenses = expenseStats?.approvedAmount || 0;
//         const monthlyProfit = monthlyRevenue - monthlyExpenses;
        
//         return {
//           title: "Monthly Summary",
//           period,
//           companyName: company?.name,
//           sections: [
//             {
//               title: "Revenue",
//               items: [
//                 { label: "Total Revenue", value: invoiceStats?.totalRevenue || 0 },
//                 { label: "Collected", value: monthlyRevenue },
//                 { label: "Pending", value: invoiceStats?.pendingAmount || 0 },
//               ],
//             },
//             {
//               title: "Expenses",
//               items: [
//                 { label: "Total Expenses", value: expenseStats?.totalAmount || 0 },
//                 { label: "Approved", value: monthlyExpenses },
//                 { label: "Pending", value: expenseStats?.pendingAmount || 0 },
//               ],
//             },
//             {
//               title: "Employees",
//               items: [
//                 { label: "Total Employees", value: employees?.length || 0 },
//                 { label: "Active", value: employees?.filter((e) => e.status === "active").length || 0 },
//               ],
//             },
//           ],
//           totals: [
//             { label: "Net Profit", value: monthlyProfit },
//             { label: "Profit Margin", value: monthlyRevenue > 0 ? `${((monthlyProfit / monthlyRevenue) * 100).toFixed(2)}%` : "0%" },
//           ],
//         };

//       default:
//         return null;
//     }
//   };

//   const handleGenerate = async (reportId: string) => {
//     try {
//       setGeneratingId(reportId);
//       const reportData = generateReportData(reportId);
      
//       if (!reportData) {
//         toast({
//           title: "Error",
//           description: "Unable to generate report data",
//           variant: "destructive",
//         });
//         return;
//       }

//       const blob = await generateReportPDF(reportData);
//       const report = reports.find((r) => r.id === reportId);
//       const filename = `${report?.name.toLowerCase().replace(/\s+/g, "-")}-${format(currentDate, "yyyy-MM")}.pdf`;
      
//       downloadPDF(blob, filename);
      
//       toast({
//         title: "Report generated",
//         description: `${report?.name} has been generated and downloaded`,
//       });
//     } catch (error) {
//       console.error("Report generation failed:", error);
//       toast({
//         title: "Generation failed",
//         description: "Failed to generate report. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setGeneratingId(null);
//     }
//   };

//   const handleDownload = async (reportId: string) => {
//     try {
//       setDownloadingId(reportId);
//       const reportData = generateReportData(reportId);
      
//       if (!reportData) {
//         toast({
//           title: "Error",
//           description: "Unable to generate report data",
//           variant: "destructive",
//         });
//         return;
//       }

//       const blob = await generateReportPDF(reportData);
//       const report = reports.find((r) => r.id === reportId);
//       const filename = `${report?.name.toLowerCase().replace(/\s+/g, "-")}-${format(currentDate, "yyyy-MM")}.pdf`;
      
//       downloadPDF(blob, filename);
      
//       toast({
//         title: "Report downloaded",
//         description: `${report?.name} has been downloaded`,
//       });
//     } catch (error) {
//       console.error("Report download failed:", error);
//       toast({
//         title: "Download failed",
//         description: "Failed to download report. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setDownloadingId(null);
//     }
//   };

//   return (
//     <DashboardLayout>
//       {/* Page Header */}
//       <div className="mb-8">
//         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
//             <p className="text-muted-foreground">
//               Generate and export financial reports
//             </p>
//           </div>
//           <div className="flex gap-3">
//             <Button variant="outline">
//               <Calendar className="mr-2 h-4 w-4" />
//               {currentMonth}
//             </Button>
//             <Button onClick={() => setCustomReportOpen(true)}>
//               <FileText className="mr-2 h-4 w-4" />
//               Custom Report
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Reports Grid */}
//       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//         {reports.map((report) => {
//           const Icon = report.icon;
//           return (
//             <Card key={report.id} variant="stat" className="p-6">
//               <div className="flex items-start justify-between mb-4">
//                 <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${report.color}`}>
//                   <Icon className="h-6 w-6" />
//                 </div>
//                 <Badge variant="muted">PDF / Excel</Badge>
//               </div>
//               <h3 className="text-lg font-semibold mb-1">{report.name}</h3>
//               <p className="text-sm text-muted-foreground mb-4">
//                 {report.description}
//               </p>
//               <div className="flex items-center justify-between pt-4 border-t border-border/50">
//                 <div className="flex gap-2">
//                   <Button 
//                     variant="outline" 
//                     size="sm"
//                     onClick={() => handleDownload(report.id)}
//                     disabled={downloadingId === report.id || generatingId === report.id}
//                   >
//                     {downloadingId === report.id ? (
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                     ) : (
//                       <Download className="h-4 w-4" />
//                     )}
//                   </Button>
//                   <Button 
//                     size="sm"
//                     onClick={() => handleGenerate(report.id)}
//                     disabled={generatingId === report.id || downloadingId === report.id}
//                   >
//                     {generatingId === report.id ? (
//                       <>
//                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                         Generating...
//                       </>
//                     ) : (
//                       "Generate"
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             </Card>
//           );
//         })}
//       </div>

//       {/* Quick Stats */}
//       <div className="mt-8">
//         <h2 className="text-xl font-semibold mb-4">Quick Summary - {currentMonth}</h2>
//         <div className="grid gap-4 sm:grid-cols-4">
//           <Card variant="stat" className="p-4">
//             <p className="text-sm text-muted-foreground">Total Revenue</p>
//             <p className="text-2xl font-bold text-success">
//               {formatCurrency(invoiceStats?.totalRevenue || 0, company?.currency || "INR")}
//             </p>
//           </Card>
//           <Card variant="stat" className="p-4">
//             <p className="text-sm text-muted-foreground">Total Expenses</p>
//             <p className="text-2xl font-bold text-destructive">
//               {formatCurrency(expenseStats?.totalAmount || 0, company?.currency || "INR")}
//             </p>
//           </Card>
//           <Card variant="stat" className="p-4">
//             <p className="text-sm text-muted-foreground">Net Profit</p>
//             <p className="text-2xl font-bold">
//               {formatCurrency(
//                 (invoiceStats?.paidAmount || 0) - (expenseStats?.approvedAmount || 0),
//                 company?.currency || "INR"
//               )}
//             </p>
//           </Card>
//           <Card variant="stat" className="p-4">
//             <p className="text-sm text-muted-foreground">Profit Margin</p>
//             <p className="text-2xl font-bold">
//               {invoiceStats?.paidAmount && invoiceStats.paidAmount > 0
//                 ? `${(((invoiceStats.paidAmount - (expenseStats?.approvedAmount || 0)) / invoiceStats.paidAmount) * 100).toFixed(1)}%`
//                 : "0%"}
//             </p>
//           </Card>
//         </div>
//       </div>

//       {/* Custom Report Dialog */}
//       <CustomReportDialog
//         open={customReportOpen}
//         onOpenChange={setCustomReportOpen}
//       />
//     </DashboardLayout>
//   );
// };

// export default Reports;
