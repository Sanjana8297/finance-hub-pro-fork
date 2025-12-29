import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendExpenseNotificationRequest {
  expenseId: string;
  action: "approved" | "rejected";
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send expense notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { expenseId, action, notes }: SendExpenseNotificationRequest = await req.json();
    console.log(`Sending ${action} notification for expense ${expenseId}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch expense details
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .select(`
        *,
        expense_categories:category_id(name)
      `)
      .eq("id", expenseId)
      .single();

    if (expenseError || !expense) {
      console.error("Error fetching expense:", expenseError);
      throw new Error("Expense not found");
    }

    // Get the expense submitter's profile and email
    if (!expense.created_by) {
      console.log("No creator found for expense, skipping notification");
      return new Response(JSON.stringify({ success: true, message: "No creator to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: submitterProfile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", expense.created_by)
      .single();

    if (profileError || !submitterProfile?.email) {
      console.error("Error fetching submitter profile:", profileError);
      throw new Error("Submitter email not found");
    }

    // Get approver's name
    let approverName = "A manager";
    if (expense.approved_by) {
      const { data: approverProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", expense.approved_by)
        .single();
      
      if (approverProfile?.full_name) {
        approverName = approverProfile.full_name;
      }
    }

    console.log(`Sending notification to ${submitterProfile.email}`);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: expense.currency || "USD",
      }).format(amount);
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const isApproved = action === "approved";
    const statusColor = isApproved ? "#059669" : "#dc2626";
    const statusBgColor = isApproved ? "#d1fae5" : "#fee2e2";
    const statusText = isApproved ? "Approved" : "Rejected";
    const statusIcon = isApproved ? "✓" : "✗";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Expense ${statusText}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background-color: ${statusBgColor}; color: ${statusColor}; font-size: 28px; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                ${statusIcon}
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #111827;">Expense ${statusText}</h1>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">${expense.description}</p>
            </div>

            <!-- Greeting -->
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Hi ${submitterProfile.full_name || "there"},
            </p>

            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              ${isApproved 
                ? `Great news! Your expense request has been approved by ${approverName}.`
                : `Your expense request has been reviewed and unfortunately was not approved by ${approverName}.`
              }
            </p>

            <!-- Expense Details Box -->
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Description:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500;">${expense.description}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Amount:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500;">${formatCurrency(expense.amount)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Category:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500;">${expense.expense_categories?.name || "Uncategorized"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Date:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500;">${formatDate(expense.expense_date)}</span>
              </div>
              <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #111827; font-size: 16px; font-weight: 600;">Status:</span>
                  <span style="background-color: ${statusBgColor}; color: ${statusColor}; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600;">${statusText}</span>
                </div>
              </div>
            </div>

            ${notes ? `
              <!-- Rejection Reason -->
              <div style="background-color: ${isApproved ? "#f0fdf4" : "#fef2f2"}; border-left: 4px solid ${statusColor}; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #374151; font-size: 12px; font-weight: 600;">${isApproved ? "Notes:" : "Reason for Rejection:"}</p>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">${notes}</p>
              </div>
            ` : ""}

            ${!isApproved ? `
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                If you believe this was a mistake or have additional information to provide, please contact your manager or resubmit the expense with the necessary documentation.
              </p>
            ` : `
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                The reimbursement will be processed according to your company's payment schedule.
              </p>
            `}

            <!-- Footer -->
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This is an automated notification from your expense management system.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Expenses <onboarding@resend.dev>",
        to: [submitterProfile.email],
        subject: `Expense ${statusText}: ${expense.description} - ${formatCurrency(expense.amount)}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    const notificationStatus = emailResponse.ok ? "sent" : "failed";
    const notificationTitle = `Expense ${statusText}: ${expense.description}`;

    // Log notification to database
    await supabase.from("notifications").insert({
      company_id: expense.company_id,
      user_id: expense.created_by,
      type: "email",
      category: "expense",
      title: notificationTitle,
      message: isApproved 
        ? `Your expense of ${formatCurrency(expense.amount)} has been approved`
        : `Your expense of ${formatCurrency(expense.amount)} has been rejected`,
      recipient_email: submitterProfile.email,
      recipient_name: submitterProfile.full_name,
      status: notificationStatus,
      metadata: { 
        expense_id: expenseId, 
        action,
        amount: expense.amount,
        approver_name: approverName
      },
      error_message: emailResponse.ok ? null : (emailResult.message || "Failed to send email"),
      created_by: expense.approved_by,
    });

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-expense-notification:", error);
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
