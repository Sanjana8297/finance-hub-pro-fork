import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#111827",
    paddingBottom: 20,
  },
  companyInfo: {
    maxWidth: 250,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  companyDetails: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  reportTitle: {
    textAlign: "right",
  },
  reportLabel: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  reportPeriod: {
    fontSize: 10,
    color: "#6b7280",
  },
  reportDate: {
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 4,
  },
  summarySection: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 15,
  },
  summaryBox: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  summaryValueGreen: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#16a34a",
  },
  summaryValueYellow: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ca8a04",
  },
  summaryValueRed: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#dc2626",
  },
  groupSection: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  groupName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
  },
  groupStats: {
    flexDirection: "row",
    gap: 15,
  },
  groupCount: {
    fontSize: 9,
    color: "#6b7280",
  },
  groupTotal: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
  },
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#fafafa",
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
  },
  descriptionCol: {
    flex: 3,
  },
  dateCol: {
    flex: 1.5,
  },
  statusCol: {
    flex: 1,
  },
  amountCol: {
    flex: 1.2,
    textAlign: "right",
  },
  statusApproved: {
    color: "#16a34a",
    fontWeight: "bold",
  },
  statusPending: {
    color: "#ca8a04",
    fontWeight: "bold",
  },
  statusRejected: {
    color: "#dc2626",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 15,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 15,
    marginTop: 10,
  },
});

interface GroupedData {
  groupName: string;
  expenses: Array<{
    id: string;
    description: string;
    amount: number;
    expense_date: string;
    status: string;
    department: string | null;
    category_name: string | null;
    submitter_name: string | null;
  }>;
  total: number;
  count: number;
}

interface ExpenseReportPDFProps {
  filters: {
    startDate: Date;
    endDate: Date;
    groupBy: string;
    status: string | null;
    department: string | null;
  };
  grouped: GroupedData[];
  summary: {
    totalAmount: number;
    approvedAmount: number;
    pendingAmount: number;
    rejectedAmount: number;
    totalCount: number;
  };
  companyName?: string;
  companyAddress?: string;
}

const ExpenseReportPDFDocument = ({
  filters,
  grouped,
  summary,
  companyName = "Your Company",
  companyAddress,
}: ExpenseReportPDFProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return styles.statusApproved;
      case "pending":
        return styles.statusPending;
      case "rejected":
        return styles.statusRejected;
      default:
        return styles.tableCell;
    }
  };

  const groupByLabel = {
    category: "Category",
    department: "Department",
    status: "Status",
    employee: "Employee",
  }[filters.groupBy] || "Category";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyName}</Text>
            {companyAddress && (
              <Text style={styles.companyDetails}>{companyAddress}</Text>
            )}
          </View>
          <View style={styles.reportTitle}>
            <Text style={styles.reportLabel}>EXPENSE REPORT</Text>
            <Text style={styles.reportPeriod}>
              {format(filters.startDate, "MMM d, yyyy")} -{" "}
              {format(filters.endDate, "MMM d, yyyy")}
            </Text>
            <Text style={styles.reportDate}>
              Generated: {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
            </Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.totalAmount)}
            </Text>
            <Text style={styles.groupCount}>{summary.totalCount} expenses</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Approved</Text>
            <Text style={styles.summaryValueGreen}>
              {formatCurrency(summary.approvedAmount)}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValueYellow}>
              {formatCurrency(summary.pendingAmount)}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Rejected</Text>
            <Text style={styles.summaryValueRed}>
              {formatCurrency(summary.rejectedAmount)}
            </Text>
          </View>
        </View>

        {/* Breakdown by Group */}
        <Text style={styles.breakdownTitle}>Breakdown by {groupByLabel}</Text>

        {grouped.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.groupSection} wrap={false}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupName}>{group.groupName}</Text>
              <View style={styles.groupStats}>
                <Text style={styles.groupCount}>{group.count} expenses</Text>
                <Text style={styles.groupTotal}>
                  {formatCurrency(group.total)}
                </Text>
              </View>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.descriptionCol]}>
                  Description
                </Text>
                <Text style={[styles.tableHeaderText, styles.dateCol]}>
                  Date
                </Text>
                <Text style={[styles.tableHeaderText, styles.statusCol]}>
                  Status
                </Text>
                <Text style={[styles.tableHeaderText, styles.amountCol]}>
                  Amount
                </Text>
              </View>
              {group.expenses.map((expense, index) => (
                <View
                  key={expense.id}
                  style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <Text style={[styles.tableCell, styles.descriptionCol]}>
                    {expense.description.length > 40
                      ? expense.description.substring(0, 40) + "..."
                      : expense.description}
                  </Text>
                  <Text style={[styles.tableCell, styles.dateCol]}>
                    {format(new Date(expense.expense_date), "MMM d, yyyy")}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.statusCol,
                      getStatusStyle(expense.status),
                    ]}
                  >
                    {expense.status.charAt(0).toUpperCase() +
                      expense.status.slice(1)}
                  </Text>
                  <Text style={[styles.tableCell, styles.amountCol]}>
                    {formatCurrency(expense.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          Expense Report • {format(filters.startDate, "MMM d")} -{" "}
          {format(filters.endDate, "MMM d, yyyy")} • {companyName}
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export async function generateExpenseReportPDF(
  props: ExpenseReportPDFProps
): Promise<Blob> {
  const doc = <ExpenseReportPDFDocument {...props} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
