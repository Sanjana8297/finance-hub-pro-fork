import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnomalyData {
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

interface SendAnomalyAlertRequest {
  anomalies: AnomalyData[];
  companyId?: string;
}

const anomalyTypeLabels: Record<string, string> = {
  high_amount: "Unusually High Amount",
  duplicate: "Potential Duplicate",
  rapid_succession: "Rapid Submission",
  threshold_gaming: "Near Approval Threshold",
  unusual_category: "Unusual Category",
  weekend_expense: "Weekend Expense",
  round_amount: "Round Amount",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Send anomaly alert function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { anomalies, companyId }: SendAnomalyAlertRequest = await req.json();
    console.log(`Sending alerts for ${anomalies.length} high-severity anomalies`);

    if (!anomalies || anomalies.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No anomalies to report" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with finance access (admins, finance managers, accountants)
    const { data: financeUsers, error: usersError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["super_admin", "admin", "finance_manager"]);

    if (usersError) {
      console.error("Error fetching finance users:", usersError);
      throw new Error("Failed to fetch finance users");
    }

    if (!financeUsers || financeUsers.length === 0) {
      console.log("No finance users found to notify");
      return new Response(JSON.stringify({ success: true, message: "No managers to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get email addresses for finance users
    const userIds = financeUsers.map(u => u.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email, company_id")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw new Error("Failed to fetch user profiles");
    }

    // Filter by company if provided
    const recipientProfiles = companyId 
      ? profiles?.filter(p => p.company_id === companyId && p.email) 
      : profiles?.filter(p => p.email);

    if (!recipientProfiles || recipientProfiles.length === 0) {
      console.log("No recipients with email found");
      return new Response(JSON.stringify({ success: true, message: "No recipients with email" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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

    // Build HTML for anomalies list
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
          <title>Expense Anomaly Alert</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #fee2e2; color: #dc2626; font-size: 28px; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                ⚠
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #111827;">High-Severity Anomalies Detected</h1>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                ${anomalies.length} expense${anomalies.length > 1 ? "s have" : " has"} been flagged for immediate review
              </p>
            </div>

            <!-- Summary -->
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #374151; font-size: 14px;">
                <strong>Action Required:</strong> The following expenses have been flagged as high-severity anomalies. 
                These may indicate unusual spending patterns, potential duplicates, or possible policy violations that require your attention.
              </p>
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

            <!-- Total Impact -->
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">Total Amount Flagged:</span>
                <span style="color: #111827; font-size: 20px; font-weight: 700;">
                  ${formatCurrency(anomalies.reduce((sum, a) => sum + a.expense.amount, 0))}
                </span>
              </div>
            </div>

            <!-- CTA -->
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              Please log in to your expense management system to review these flagged expenses and take appropriate action.
            </p>

            <!-- Footer -->
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              This is an automated alert from your expense anomaly detection system.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send emails to all finance managers
    const emailPromises = recipientProfiles.map(async (profile) => {
      console.log(`Sending anomaly alert to ${profile.email}`);

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Expense Alerts <onboarding@resend.dev>",
          to: [profile.email],
          subject: `🚨 Alert: ${anomalies.length} High-Severity Expense Anomal${anomalies.length > 1 ? "ies" : "y"} Detected`,
          html: emailHtml,
        }),
      });

      const emailResult = await emailResponse.json();
      const notificationStatus = emailResponse.ok ? "sent" : "failed";

      // Log notification to database
      await supabase.from("notifications").insert({
        company_id: companyId || profile.company_id,
        user_id: profile.id,
        type: "email",
        category: "anomaly_alert",
        title: `High-Severity Anomalies Detected`,
        message: `${anomalies.length} expense${anomalies.length > 1 ? "s have" : " has"} been flagged for immediate review`,
        recipient_email: profile.email,
        recipient_name: profile.full_name,
        status: notificationStatus,
        metadata: { 
          anomaly_count: anomalies.length,
          total_amount: anomalies.reduce((sum, a) => sum + a.expense.amount, 0),
          expense_ids: anomalies.map(a => a.expenseId),
        },
        error_message: emailResponse.ok ? null : (emailResult.message || "Failed to send email"),
      });

      return { profile: profile.email, success: emailResponse.ok, result: emailResult };
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Sent ${successCount}/${results.length} anomaly alert emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: results.length,
        results 
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-anomaly-alert:", error);
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
