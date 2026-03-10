import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { numberToWords } from "@/lib/utils";

interface PayslipEarnings {
  basic: number;
  houseRentAllowance: number;
  conveyanceAllowance: number;
  medicalReimbursement: number;
  otherBenefit: number;
  specialAllowance: number;
}

interface PayslipEarningsYTD {
  basic: number;
  houseRentAllowance: number;
  conveyanceAllowance: number;
  medicalReimbursement: number;
  otherBenefit: number;
  specialAllowance: number;
}

interface PayslipDeductions {
  professionalTax: number;
}

interface PayslipDeductionsYTD {
  professionalTax: number;
}

interface PayslipComponent {
  label: string;
  amount: number;
  ytd: number;
}

interface Payslip {
  id: string;
  employee: {
    name: string;
    position: string;
    employeeId?: string;
    dateOfJoining?: string;
    bankAccountNo?: string;
    avatar: string;
  };
  period: string;
  payDate: string;
  paidDays: number;
  lopDays: number;
  earnings: PayslipEarnings;
  earningsYTD: PayslipEarningsYTD;
  deductions: PayslipDeductions;
  deductionsYTD: PayslipDeductionsYTD;
  customEarnings?: PayslipComponent[];
  customDeductions?: PayslipComponent[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  status: "paid" | "pending" | "processing";
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 9,
    color: "#000000",
    lineHeight: 1.4,
  },
  payslipTitleContainer: {
    alignItems: "flex-end",
  },
  payslipTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "right",
  },
  employeeSummary: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#000000",
    padding: 10,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 4,
    fontSize: 9,
  },
  summaryLabel: {
    fontWeight: "bold",
    width: "40%",
    color: "#000000",
  },
  summaryValue: {
    width: "60%",
    color: "#000000",
  },
  netPayHighlight: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  daysInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    fontSize: 9,
  },
  table: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#000000",
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingVertical: 6,
    paddingHorizontal: 8,
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 5,
    paddingHorizontal: 8,
    width: "100%",
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
  },
  tableCell: {
    fontSize: 9,
    color: "#000000",
  },
  earningsCol: {
    flex: 3,
    paddingRight: 4,
  },
  deductionsCol: {
    flex: 3,
    paddingRight: 4,
    paddingLeft: 4,
  },
  amountCol: {
    flex: 2,
    textAlign: "right",
    paddingLeft: 4,
    paddingRight: 4,
  },
  ytdCol: {
    flex: 2,
    textAlign: "right",
    paddingLeft: 4,
    paddingRight: 4,
  },
  totalsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#f9f9f9",
    width: "100%",
  },
  totalsLabel: {
    fontSize: 9,
    fontWeight: "bold",
    flex: 3,
    color: "#000000",
    paddingRight: 4,
  },
  totalsAmount: {
    fontSize: 9,
    fontWeight: "bold",
    flex: 2,
    textAlign: "right",
    color: "#000000",
    paddingLeft: 4,
    paddingRight: 4,
  },
  totalsYTD: {
    fontSize: 9,
    fontWeight: "bold",
    flex: 2,
    textAlign: "right",
    color: "#000000",
    paddingLeft: 4,
    paddingRight: 4,
  },
  netPayableSection: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#000000",
    padding: 10,
  },
  netPayableTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  netPayableFormula: {
    fontSize: 9,
    color: "#000000",
    marginBottom: 6,
  },
  netPayableAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  amountInWords: {
    fontSize: 9,
    color: "#000000",
    fontStyle: "italic",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#666666",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
  },
});

interface PayslipPDFProps {
  payslip: Payslip;
  companyName?: string;
  companyAddress?: string;
}

const PayslipPDFDocument = ({
  payslip,
  companyName,
  companyAddress,
}: PayslipPDFProps) => {
  const formatCurrency = (amount: number) => {
    // Format with Rs. prefix to avoid rendering issues with rupee symbol
    const formatted = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `Rs. ${formatted}`;
  };

  const formatCurrencyNoSymbol = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  const customEarnings = payslip.customEarnings || [];
  const customDeductions = payslip.customDeductions || [];
  const fixedEarningRows: PayslipComponent[] = [
    { label: "Basic", amount: payslip.earnings.basic, ytd: payslip.earningsYTD.basic },
    { label: "House Rent Allowance", amount: payslip.earnings.houseRentAllowance, ytd: payslip.earningsYTD.houseRentAllowance },
    { label: "Conveyance Allowance", amount: payslip.earnings.conveyanceAllowance, ytd: payslip.earningsYTD.conveyanceAllowance },
    { label: "Medical Reimbursement", amount: payslip.earnings.medicalReimbursement, ytd: payslip.earningsYTD.medicalReimbursement },
    { label: "Other Benefit", amount: payslip.earnings.otherBenefit, ytd: payslip.earningsYTD.otherBenefit },
    { label: "Special Allowance", amount: payslip.earnings.specialAllowance, ytd: payslip.earningsYTD.specialAllowance },
  ];
  const allDeductions: PayslipComponent[] = [
    { label: "Professional Tax", amount: payslip.deductions.professionalTax, ytd: payslip.deductionsYTD.professionalTax },
    ...customDeductions,
  ];
  const extraCustomEarnings = customEarnings;
  const extraCustomDeductions = allDeductions.slice(fixedEarningRows.length);
  const customRowCount = Math.max(extraCustomEarnings.length, extraCustomDeductions.length);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {companyName || "Techvitta Innovations Pvt Ltd"}
            </Text>
            <Text style={styles.companyAddress}>
              {companyAddress || "Plot No 19, Opp Cyber Pearl, Hitech City, Madhapur, Hyderabad Telangana 500081\nIndia"}
            </Text>
          </View>
          <View style={styles.payslipTitleContainer}>
            <Text style={styles.payslipTitle}>Payslip For the Month</Text>
            <Text style={styles.payslipTitle}>{payslip.period}</Text>
          </View>
        </View>

        {/* Employee Summary */}
        <View style={styles.employeeSummary}>
          <Text style={styles.summaryTitle}># EMPLOYEE SUMMARY</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Employee Name :</Text>
            <Text style={styles.summaryValue}>{payslip.employee.name}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Designation :</Text>
            <Text style={styles.summaryValue}>{payslip.employee.position}</Text>
          </View>
          
          {payslip.employee.employeeId && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Employee ID :</Text>
              <Text style={styles.summaryValue}>{payslip.employee.employeeId}</Text>
            </View>
          )}
          
          {payslip.employee.dateOfJoining && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date of Joining :</Text>
              <Text style={styles.summaryValue}>
                {format(new Date(payslip.employee.dateOfJoining), "dd/MM/yyyy")}
              </Text>
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pay Period :</Text>
            <Text style={styles.summaryValue}>{payslip.period}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pay Date :</Text>
            <Text style={styles.summaryValue}>
              {format(new Date(payslip.payDate), "dd/MM/yyyy")}
            </Text>
          </View>

          <Text style={styles.netPayHighlight}>
            {formatCurrency(payslip.netPay)}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: "bold", textAlign: "center", marginBottom: 4 }}>
            Total Net Pay
          </Text>

          <View style={styles.daysInfo}>
            <Text style={{ fontSize: 9 }}>Paid Days : {payslip.paidDays}</Text>
            <Text style={{ fontSize: 9 }}>LOP Days : {payslip.lopDays}</Text>
          </View>

          {payslip.employee.bankAccountNo && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Bank Account No :</Text>
              <Text style={styles.summaryValue}>{payslip.employee.bankAccountNo}</Text>
            </View>
          )}
        </View>

        {/* Earnings and Deductions Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.earningsCol]}>EARNINGS</Text>
            <Text style={[styles.tableHeaderText, styles.amountCol]}>AMOUNT</Text>
            <Text style={[styles.tableHeaderText, styles.ytdCol]}>YTD</Text>
            <Text style={[styles.tableHeaderText, styles.deductionsCol]}>DEDUCTIONS</Text>
            <Text style={[styles.tableHeaderText, styles.amountCol]}>AMOUNT</Text>
            <Text style={[styles.tableHeaderText, styles.ytdCol]}>YTD</Text>
          </View>

          {fixedEarningRows.map((earning, index) => {
            const deduction = allDeductions[index];

            return (
              <View style={styles.tableRow} key={`fixed-row-${index}`}>
                <Text style={[styles.tableCell, styles.earningsCol]}>{earning.label}</Text>
                <Text style={[styles.tableCell, styles.amountCol]}>
                  {formatCurrencyNoSymbol(earning.amount)}
                </Text>
                <Text style={[styles.tableCell, styles.ytdCol]}>
                  {formatCurrencyNoSymbol(earning.ytd)}
                </Text>
                <Text style={[styles.tableCell, styles.deductionsCol]}>{deduction?.label || ""}</Text>
                <Text style={[styles.tableCell, styles.amountCol]}>
                  {deduction ? formatCurrencyNoSymbol(deduction.amount) : ""}
                </Text>
                <Text style={[styles.tableCell, styles.ytdCol]}>
                  {deduction ? formatCurrencyNoSymbol(deduction.ytd) : ""}
                </Text>
              </View>
            );
          })}

          {Array.from({ length: customRowCount }).map((_, index) => {
            const earning = extraCustomEarnings[index];
            const deduction = extraCustomDeductions[index];

            return (
              <View style={styles.tableRow} key={`custom-row-${index}`}>
                <Text style={[styles.tableCell, styles.earningsCol]}>{earning?.label || ""}</Text>
                <Text style={[styles.tableCell, styles.amountCol]}>
                  {earning ? formatCurrencyNoSymbol(earning.amount) : ""}
                </Text>
                <Text style={[styles.tableCell, styles.ytdCol]}>
                  {earning ? formatCurrencyNoSymbol(earning.ytd) : ""}
                </Text>
                <Text style={[styles.tableCell, styles.deductionsCol]}>{deduction?.label || ""}</Text>
                <Text style={[styles.tableCell, styles.amountCol]}>
                  {deduction ? formatCurrencyNoSymbol(deduction.amount) : ""}
                </Text>
                <Text style={[styles.tableCell, styles.ytdCol]}>
                  {deduction ? formatCurrencyNoSymbol(deduction.ytd) : ""}
                </Text>
              </View>
            );
          })}

          {/* Totals */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Gross Earnings</Text>
            <Text style={styles.totalsAmount}>
              {formatCurrencyNoSymbol(payslip.grossEarnings)}
            </Text>
            <Text style={styles.totalsYTD}></Text>
            <Text style={styles.totalsLabel}>Total Deductions</Text>
            <Text style={styles.totalsAmount}>
              {formatCurrencyNoSymbol(payslip.totalDeductions)}
            </Text>
            <Text style={styles.totalsYTD}></Text>
          </View>
        </View>

        {/* Net Payable Section */}
        <View style={styles.netPayableSection}>
          <Text style={styles.netPayableTitle}>TOTAL NET PAYABLE</Text>
          <Text style={styles.netPayableFormula}>
            Gross Earnings - Total Deductions
          </Text>
          <Text style={styles.netPayableAmount}>
            {formatCurrency(payslip.netPay)}
          </Text>
          <Text style={styles.amountInWords}>
            Amount In Words : Indian Rupee {numberToWords(payslip.netPay)}
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          -- This is a system-generated document. --
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

export type { Payslip, PayslipComponent, PayslipEarnings, PayslipEarningsYTD, PayslipDeductions, PayslipDeductionsYTD };
