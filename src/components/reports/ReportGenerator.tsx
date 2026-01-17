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
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  date: {
    fontSize: 9,
    color: "#9ca3af",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  label: {
    fontSize: 10,
    color: "#6b7280",
  },
  value: {
    fontSize: 10,
    color: "#111827",
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#111827",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
  },
  totalValue: {
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

interface ReportData {
  title: string;
  period: string;
  companyName?: string;
  sections: {
    title: string;
    items: { label: string; value: string | number }[];
  }[];
  totals?: { label: string; value: string | number }[];
}

const ReportPDFDocument = ({ data }: { data: ReportData }) => {
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num || 0);
  };

  const formatValue = (value: string | number) => {
    if (typeof value === "number") {
      return formatCurrency(value);
    }
    return value;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>
            {data.companyName || "Financial Report"}
          </Text>
          <Text style={styles.date}>Period: {data.period}</Text>
          <Text style={styles.date}>
            Generated: {format(new Date(), "MMMM d, yyyy")}
          </Text>
        </View>

        {/* Sections */}
        {data.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.row}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.value}>{formatValue(item.value)}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Totals */}
        {data.totals && data.totals.length > 0 && (
          <View style={styles.section}>
            {data.totals.map((total, index) => (
              <View
                key={index}
                style={
                  index === data.totals!.length - 1
                    ? styles.totalRow
                    : styles.row
                }
              >
                <Text
                  style={
                    index === data.totals!.length - 1
                      ? styles.totalLabel
                      : styles.label
                  }
                >
                  {total.label}
                </Text>
                <Text
                  style={
                    index === data.totals!.length - 1
                      ? styles.totalValue
                      : styles.value
                  }
                >
                  {formatValue(total.value)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          This is a computer-generated report • {data.period}
        </Text>
      </Page>
    </Document>
  );
};

export async function generateReportPDF(data: ReportData): Promise<Blob> {
  const doc = <ReportPDFDocument data={data} />;
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
