import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { format } from "date-fns";

interface Payslip {
  id: string;
  employee: {
    name: string;
    position: string;
    avatar: string;
  };
  period: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: "paid" | "pending" | "processing";
  payDate: string;
}

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
    marginBottom: 40,
  },
  companyInfo: {
    maxWidth: 200,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  payslipTitle: {
    textAlign: "right",
  },
  payslipLabel: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  payslipPeriod: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 4,
  },
  payslipDate: {
    fontSize: 9,
    color: "#6b7280",
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-end",
  },
  statusPaid: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusProcessing: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  employeeSection: {
    marginBottom: 30,
  },
  sectionLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  employeePosition: {
    fontSize: 10,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 10,
    color: "#374151",
  },
  descriptionCol: {
    flex: 2,
  },
  amountCol: {
    flex: 1,
    textAlign: "right",
  },
  totalsSection: {
    alignItems: "flex-end",
    marginBottom: 40,
  },
  totalsBox: {
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  totalValue: {
    fontSize: 10,
    color: "#111827",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: "#111827",
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
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
});

interface PayslipPDFProps {
  payslip: Payslip;
  companyName?: string;
  companyAddress?: string;
}

const PayslipPDFDocument = ({
  payslip,
  companyName = "Your Company",
  companyAddress = "123 Business Street\nCity, State 12345\ncontact@company.com",
}: PayslipPDFProps) => {
  const getStatusStyle = () => {
    switch (payslip.status) {
      case "paid":
        return styles.statusPaid;
      case "pending":
        return styles.statusPending;
      case "processing":
        return styles.statusProcessing;
      default:
        return styles.statusPending;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyDetails}>{companyAddress}</Text>
          </View>
          <View style={styles.payslipTitle}>
            <Text style={styles.payslipLabel}>PAYSLIP</Text>
            <Text style={styles.payslipPeriod}>{payslip.period}</Text>
            <Text style={styles.payslipDate}>
              Pay Date: {payslip.payDate}
            </Text>
            <View style={[styles.statusBadge, getStatusStyle()]}>
              <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                {payslip.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Employee Info */}
        <View style={styles.employeeSection}>
          <Text style={styles.sectionLabel}>Employee</Text>
          <Text style={styles.employeeName}>{payslip.employee.name}</Text>
          <Text style={styles.employeePosition}>
            {payslip.employee.position}
          </Text>
        </View>

        {/* Earnings Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.descriptionCol]}>
              Earnings
            </Text>
            <Text style={[styles.tableHeaderText, styles.amountCol]}>
              Amount
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.descriptionCol]}>
              Basic Salary
            </Text>
            <Text style={[styles.tableCell, styles.amountCol]}>
              {formatCurrency(payslip.basicSalary)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.descriptionCol]}>
              Allowances
            </Text>
            <Text style={[styles.tableCell, styles.amountCol]}>
              {formatCurrency(payslip.allowances)}
            </Text>
          </View>
        </View>

        {/* Deductions Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.descriptionCol]}>
              Deductions
            </Text>
            <Text style={[styles.tableHeaderText, styles.amountCol]}>
              Amount
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.descriptionCol]}>
              Total Deductions
            </Text>
            <Text style={[styles.tableCell, styles.amountCol]}>
              {formatCurrency(payslip.deductions)}
            </Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Gross Pay</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(payslip.basicSalary + payslip.allowances)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Deductions</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(payslip.deductions)}
              </Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Net Pay</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(payslip.netPay)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This is a computer-generated payslip. • {payslip.period}
        </Text>
      </Page>
    </Document>
  );
};

export async function generatePayslipPDF(
  payslip: Payslip,
  companyName?: string,
  companyAddress?: string
): Promise<Blob> {
  const doc = (
    <PayslipPDFDocument
      payslip={payslip}
      companyName={companyName}
      companyAddress={companyAddress}
    />
  );
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
