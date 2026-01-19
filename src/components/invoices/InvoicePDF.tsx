import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from "@react-pdf/renderer";
import { Invoice, InvoiceItem } from "@/hooks/useInvoices";
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
    marginBottom: 40,
  },
  companyInfo: {
    maxWidth: 200,
  },
  logoContainer: {
    marginBottom: 12,
    width: 120,
    height: 60,
  },
  logo: {
    width: 120,
    height: 60,
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
  invoiceTitle: {
    textAlign: "right",
  },
  invoiceLabel: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 4,
  },
  invoiceDate: {
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
  statusSent: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  statusDraft: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
  },
  clientSection: {
    flexDirection: "row",
    marginBottom: 30,
  },
  billTo: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  clientDetails: {
    fontSize: 9,
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
    flex: 3,
  },
  qtyCol: {
    flex: 1,
    textAlign: "center",
  },
  priceCol: {
    flex: 1,
    textAlign: "right",
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
  notesSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 1.5,
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
  dueDate: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 4,
  },
  dueDateText: {
    fontSize: 9,
    color: "#92400e",
    textAlign: "center",
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
  items: InvoiceItem[];
  companyName?: string;
  companyAddress?: string;
  companyLogo?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
}

const InvoicePDFDocument = ({
  invoice,
  items,
  companyName = "Your Company",
  companyAddress = "123 Business Street\nCity, State 12345",
  companyLogo,
  companyEmail,
  companyPhone,
  companyWebsite,
}: InvoicePDFProps) => {
  const getStatusStyle = () => {
    switch (invoice.status) {
      case "paid":
        return styles.statusPaid;
      case "sent":
        return styles.statusSent;
      default:
        return styles.statusDraft;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: invoice.currency || "INR",
    }).format(amount);
  };

  // Format company address with additional details
  const formatCompanyDetails = () => {
    let details = companyAddress || "";
    if (companyEmail) {
      details += (details ? "\n" : "") + companyEmail;
    }
    if (companyPhone) {
      details += (details ? "\n" : "") + companyPhone;
    }
    if (companyWebsite) {
      details += (details ? "\n" : "") + companyWebsite;
    }
    return details;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {companyLogo ? (
              <View style={styles.logoContainer}>
                <Image 
                  src={companyLogo}
                  style={styles.logo}
                />
              </View>
            ) : null}
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyDetails}>{formatCompanyDetails()}</Text>
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.invoiceDate}>
              Issued: {format(new Date(invoice.issue_date), "MMMM d, yyyy")}
            </Text>
            <View style={[styles.statusBadge, getStatusStyle()]}>
              <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                {invoice.status?.toUpperCase() || "DRAFT"}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.clientSection}>
          <View style={styles.billTo}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.clientName}>{invoice.client_name}</Text>
            {invoice.client_email && (
              <Text style={styles.clientDetails}>{invoice.client_email}</Text>
            )}
            {invoice.client_address && (
              <Text style={styles.clientDetails}>{invoice.client_address}</Text>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.descriptionCol]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.qtyCol]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.priceCol]}>
              Unit Price
            </Text>
            <Text style={[styles.tableHeaderText, styles.amountCol]}>
              Amount
            </Text>
          </View>
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.descriptionCol]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.qtyCol]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.priceCol]}>
                {formatCurrency(Number(item.unit_price))}
              </Text>
              <Text style={[styles.tableCell, styles.amountCol]}>
                {formatCurrency(Number(item.amount))}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(Number(invoice.subtotal))}
              </Text>
            </View>
            {Number(invoice.tax_rate) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Tax ({invoice.tax_rate}%)
                </Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(Number(invoice.tax_amount || 0))}
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Due</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(Number(invoice.total))}
              </Text>
            </View>
          </View>
        </View>

        {/* Due Date Notice */}
        {invoice.status !== "paid" && (
          <View style={styles.dueDate}>
            <Text style={styles.dueDateText}>
              Payment due by {format(new Date(invoice.due_date), "MMMM d, yyyy")}
            </Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business! • {invoice.invoice_number}
        </Text>
      </Page>
    </Document>
  );
};

export async function generateInvoicePDF(
  invoice: Invoice,
  items: InvoiceItem[],
  companyName?: string,
  companyAddress?: string,
  companyLogo?: string,
  companyEmail?: string,
  companyPhone?: string,
  companyWebsite?: string
): Promise<Blob> {
  const doc = (
    <InvoicePDFDocument
      invoice={invoice}
      items={items}
      companyName={companyName}
      companyAddress={companyAddress}
      companyLogo={companyLogo}
      companyEmail={companyEmail}
      companyPhone={companyPhone}
      companyWebsite={companyWebsite}
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
