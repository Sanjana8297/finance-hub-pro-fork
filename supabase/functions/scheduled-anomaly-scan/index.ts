import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Anomaly detection configuration
const ANOMALY_CONFIG = {
  highAmountMultiplier: 2.5,
  minHighAmount: 500,
  rapidSuccessionHours: 2,
  rapidSuccessionCount: 3,
  thresholdLimits: [100, 500, 1000, 2500, 5000],
  thresholdProximity: 0.05,
  analysisWindow: 7, // Look at last 7 days for daily digest
};

interface ExpenseData {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  department: string | null;
  status: string | null;
  created_by: string | null;
  created_at: string;
  category_id: string | null;
  expense_categories: { name: string } | null;
}

interface Anomaly {
  id: string;
  expenseId: string;
  type: string;
  severity: string;
  description: string;
  details: string;
  expense: {
    id: string;
    description: string;
    amount: number;
    expense_date: string;
    department: string | null;
    category_name: string | null;
    submitter_name: string | null;
  };
}

const anomalyTypeLabels: Record<string, string> = {
  high_amount: "Unusually High Amount",
  duplicate: "Potential Duplicate",
  rapid_succession: "Rapid Submission",
  threshold_gaming: "Near Approval Threshold",
};

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

function detectAnomalies(expenses: ExpenseData[], profilesMap: Map<string, string>): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  if (!expenses || expenses.length === 0) return anomalies;

  // Calculate category averages
  const categoryStats = new Map<string, { total: number; count: number; amounts: number[] }>();
  expenses.forEach(exp => {
    const catId = exp.category_id || "uncategorized";
    const stats = categoryStats.get(catId) || { total: 0, count: 0, amounts: [] };
    stats.total += Number(exp.amount);
    stats.count++;
    stats.amounts.push(Number(exp.amount));
    categoryStats.set(catId, stats);
  });

  // Group expenses by user
  const userExpenses = new Map<string, ExpenseData[]>();
  expenses.forEach(exp => {
    if (!exp.created_by) return;
    const existing = userExpenses.get(exp.created_by) || [];
    existing.push(exp);
    userExpenses.set(exp.created_by, existing);
  });

  expenses.forEach((expense) => {
    const amount = Number(expense.amount);
    const expenseData = {
      id: expense.id,
      description: expense.description,
      amount: amount,
      expense_date: expense.expense_date,
      department: expense.department,
      category_name: expense.expense_categories?.name || null,
      submitter_name: expense.created_by ? profilesMap.get(expense.created_by) || null : null,
    };

    // 1. High amount anomaly
    const catId = expense.category_id || "uncategorized";
    const catStats = categoryStats.get(catId);
    if (catStats && catStats.count >= 3) {
      const average = catStats.total / catStats.count;
      const stdDev = Math.sqrt(
        catStats.amounts.reduce((sum, amt) => sum + Math.pow(amt - average, 2), 0) / catStats.count
      );
      
      if (amount > average + (stdDev * ANOMALY_CONFIG.highAmountMultiplier) && 
          amount >= ANOMALY_CONFIG.minHighAmount) {
        anomalies.push({
          id: `high-${expense.id}`,
          expenseId: expense.id,
          type: "high_amount",
          severity: amount > average * 5 ? "high" : amount > average * 3 ? "high" : "medium",
          description: "Unusually high amount",
          details: `$${amount.toLocaleString()} is ${((amount / average - 1) * 100).toFixed(0)}% above category average of $${average.toFixed(2)}`,
          expense: expenseData,
        });
      }
    }

    // 2. Duplicate detection
    const duplicates = expenses.filter(e => 
      e.id !== expense.id &&
      Number(e.amount) === amount &&
      e.description.toLowerCase() === expense.description.toLowerCase() &&
      isSameDay(new Date(e.expense_date), new Date(expense.expense_date))
    );
    
    if (duplicates.length > 0) {
      anomalies.push({
        id: `duplicate-${expense.id}`,
        expenseId: expense.id,
        type: "duplicate",
        severity: "high",
        description: "Potential duplicate expense",
        details: `Found ${duplicates.length} other expense(s) with same amount ($${amount}), description, and date`,
        expense: expenseData,
      });
    }

    // 3. Rapid succession
    if (expense.created_by) {
      const userExps = userExpenses.get(expense.created_by) || [];
      const expTime = new Date(expense.created_at).getTime();
      const nearbyExpenses = userExps.filter(e => {
        const timeDiff = Math.abs(new Date(e.created_at).getTime() - expTime);
        return e.id !== expense.id && timeDiff <= ANOMALY_CONFIG.rapidSuccessionHours * 60 * 60 * 1000;
      });
      
      if (nearbyExpenses.length >= ANOMALY_CONFIG.rapidSuccessionCount - 1) {
        anomalies.push({
          id: `rapid-${expense.id}`,
          expenseId: expense.id,
          type: "rapid_succession",
          severity: "high",
          description: "Rapid expense submission",
          details: `${nearbyExpenses.length + 1} expenses submitted within ${ANOMALY_CONFIG.rapidSuccessionHours} hours`,
          expense: expenseData,
        });
      }
    }

    // 4. Threshold gaming
    for (const threshold of ANOMALY_CONFIG.thresholdLimits) {
      const proximityAmount = threshold * ANOMALY_CONFIG.thresholdProximity;
      if (amount >= threshold - proximityAmount && amount < threshold) {
        anomalies.push({
          id: `threshold-${expense.id}-${threshold}`,
          expenseId: expense.id,
          type: "threshold_gaming",
          severity: "high",
          description: "Amount near approval threshold",
          details: `Amount of $${amount} is just ${(threshold - amount).toFixed(2)} below the $${threshold} threshold`,
          expense: expenseData,
        });
        break;
      }
    }
  });

  // Deduplicate and keep only high severity
  const uniqueAnomalies = new Map<string, Anomaly>();
  anomalies.forEach(anomaly => {
    if (anomaly.severity !== "high") return;
    const key = `${anomaly.expenseId}-${anomaly.type}`;
    if (!uniqueAnomalies.has(key)) {
      uniqueAnomalies.set(key, anomaly);
    }
  });

  return Array.from(uniqueAnomalies.values());
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Scheduled anomaly scan triggered at:", new Date().toISOString());

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get expenses from the last 7 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ANOMALY_CONFIG.analysisWindow);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    console.log(`Scanning expenses since ${cutoffDateStr}`);

    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select(`
        id,
        description,
        amount,
        expense_date,
        department,
        status,
        created_by,
        created_at,
        category_id,
        expense_categories (name)
      `)
      .gte("expense_date", cutoffDateStr)
      .order("created_at", { ascending: false });

    if (expensesError) {
      console.error("Error fetching expenses:", expensesError);
      throw new Error("Failed to fetch expenses");
    }

    console.log(`Found ${expenses?.length || 0} expenses to analyze`);

    if (!expenses || expenses.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No expenses to analyze",
        anomaliesFound: 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch profiles for submitter names
    const creatorIds = [...new Set(expenses.map(e => e.created_by).filter(Boolean))] as string[];
    const profilesMap = new Map<string, string>();
    
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", creatorIds);
      
      profiles?.forEach(p => {
        if (p.full_name) profilesMap.set(p.id, p.full_name);
      });
    }

    // Map expenses to handle the array return type from Supabase
    const mappedExpenses: ExpenseData[] = (expenses || []).map(exp => ({
      ...exp,
      expense_categories: Array.isArray(exp.expense_categories) 
        ? exp.expense_categories[0] || null 
        : exp.expense_categories,
    }));

    // Detect anomalies
    const anomalies = detectAnomalies(mappedExpenses, profilesMap);
    console.log(`Found ${anomalies.length} high-severity anomalies`);

    if (anomalies.length === 0) {
      console.log("No high-severity anomalies found, skipping email");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No high-severity anomalies detected",
        anomaliesFound: 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get all finance managers to notify
    const { data: financeUsers, error: usersError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["super_admin", "admin", "finance_manager"]);

    if (usersError || !financeUsers || financeUsers.length === 0) {
      console.log("No finance users found to notify");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No managers to notify",
        anomaliesFound: anomalies.length 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userIds = financeUsers.map(u => u.user_id);
    const { data: recipientProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, company_id")
      .in("id", userIds);

    const validRecipients = recipientProfiles?.filter(p => p.email) || [];

    if (validRecipients.length === 0) {
      console.log("No recipients with valid email found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No recipients with email",
        anomaliesFound: anomalies.length 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Build email HTML
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const anomaliesHtml = anomalies.map(anomaly => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <span style="background-color: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">HIGH</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #111827; font-weight: 500;">${anomalyTypeLabels[anomaly.type] || anomaly.type}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${anomaly.expense.description}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <span style="font-weight: 600;">${formatCurrency(anomaly.expense.amount)}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${anomaly.expense.submitter_name || "Unknown"}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${formatDate(anomaly.expense.expense_date)}
        </td>
      </tr>
      <tr>
        <td colspan="6" style="padding: 8px 12px 16px 12px; background-color: #fef2f2; font-size: 13px; color: #6b7280;">
          <strong>Details:</strong> ${anomaly.details}
        </td>
      </tr>
    `).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Daily Expense Anomaly Digest</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #fee2e2; color: #dc2626; font-size: 28px; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                📊
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #111827;">Daily Anomaly Digest</h1>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">${today}</p>
            </div>

            <!-- Summary -->
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #374151; font-size: 14px;">
                <strong>Daily Scan Results:</strong> ${anomalies.length} high-severity anomal${anomalies.length > 1 ? "ies" : "y"} 
                detected in expenses from the past ${ANOMALY_CONFIG.analysisWindow} days. 
                These require your attention.
              </p>
            </div>

            <!-- Stats Row -->
            <div style="display: flex; gap: 16px; margin-bottom: 24px;">
              <div style="flex: 1; background-color: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;">Expenses Scanned</p>
                <p style="margin: 0; color: #111827; font-size: 24px; font-weight: 700;">${expenses.length}</p>
              </div>
              <div style="flex: 1; background-color: #fee2e2; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="margin: 0 0 4px 0; color: #dc2626; font-size: 12px;">Anomalies Found</p>
                <p style="margin: 0; color: #dc2626; font-size: 24px; font-weight: 700;">${anomalies.length}</p>
              </div>
              <div style="flex: 1; background-color: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;">Total Flagged</p>
                <p style="margin: 0; color: #111827; font-size: 24px; font-weight: 700;">${formatCurrency(anomalies.reduce((sum, a) => sum + a.expense.amount, 0))}</p>
              </div>
            </div>

            <!-- Anomalies Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Severity</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Type</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Description</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Amount</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Submitted By</th>
                  <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Date</th>
                </tr>
              </thead>
              <tbody>
                ${anomaliesHtml}
              </tbody>
            </table>

            <!-- CTA -->
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              Please log in to your expense management system to review these flagged expenses and take appropriate action.
            </p>

            <!-- Footer -->
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              This is an automated daily digest from your expense anomaly detection system.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send emails
    let successCount = 0;
    for (const profile of validRecipients) {
      console.log(`Sending daily digest to ${profile.email}`);

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Expense Alerts <onboarding@resend.dev>",
          to: [profile.email],
          subject: `📊 Daily Digest: ${anomalies.length} Expense Anomal${anomalies.length > 1 ? "ies" : "y"} Detected`,
          html: emailHtml,
        }),
      });

      const emailResult = await emailResponse.json();
      const notificationStatus = emailResponse.ok ? "sent" : "failed";

      // Log notification
      await supabase.from("notifications").insert({
        company_id: profile.company_id,
        user_id: profile.id,
        type: "email",
        category: "anomaly_digest",
        title: `Daily Anomaly Digest`,
        message: `${anomalies.length} high-severity anomal${anomalies.length > 1 ? "ies" : "y"} detected`,
        recipient_email: profile.email,
        recipient_name: profile.full_name,
        status: notificationStatus,
        metadata: { 
          anomaly_count: anomalies.length,
          total_amount: anomalies.reduce((sum, a) => sum + a.expense.amount, 0),
          expense_ids: anomalies.map(a => a.expenseId),
          scan_date: new Date().toISOString(),
        },
        error_message: emailResponse.ok ? null : (emailResult.message || "Failed to send email"),
      });

      if (emailResponse.ok) successCount++;
    }

    console.log(`Daily digest sent to ${successCount}/${validRecipients.length} recipients`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        anomaliesFound: anomalies.length,
        emailsSent: successCount,
        totalRecipients: validRecipients.length,
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in scheduled-anomaly-scan:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
