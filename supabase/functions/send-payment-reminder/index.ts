import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  invoiceId?: string;
  sendAll?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Payment reminder function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invoiceId, sendAll }: ReminderRequest = await req.json();
    console.log("Request params:", { invoiceId, sendAll });

    let invoicesToRemind = [];

    if (invoiceId) {
      const { data: invoice, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (error) throw error;
      if (!invoice) throw new Error("Invoice not found");
      
      invoicesToRemind = [invoice];
    } else if (sendAll) {
      const today = new Date().toISOString().split("T")[0];
      const { data: invoices, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("status", "sent")
        .lt("due_date", today);

      if (error) throw error;
      invoicesToRemind = invoices || [];
    }

    console.log(`Found ${invoicesToRemind.length} invoices to remind`);

    const results = [];

    for (const invoice of invoicesToRemind) {
      if (!invoice.client_email) {
        console.log(`Skipping invoice ${invoice.invoice_number} - no client email`);
        results.push({
          invoiceId: invoice.id,
          success: false,
          error: "No client email address",
        });
        continue;
      }

      const { data: company } = await supabase
        .from("companies")
        .select("name, email, phone")
        .eq("id", invoice.company_id)
        .maybeSingle();

      const companyName = company?.name || "Our Company";
      const companyEmail = company?.email || "";
      const companyPhone = company?.phone || "";
      
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: invoice.currency || "USD",
        }).format(amount);
      };

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Reminder</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Payment Reminder</h1>
          </div>
          
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Dear ${invoice.client_name},</p>
            
            <p>This is a friendly reminder that your invoice is now <strong style="color: #dc2626;">${daysOverdue} days overdue</strong>.</p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f97316; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">Invoice Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Invoice Number:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right;">${invoice.invoice_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Due Date:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #dc2626;">${new Date(invoice.due_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Amount Due:</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 20px; color: #dc2626;">${formatCurrency(invoice.total)}</td>
                </tr>
              </table>
            </div>
            
            <p>Please arrange payment at your earliest convenience to avoid any late fees or service interruptions.</p>
            
            <p>If you have already made the payment, please disregard this notice. If you have any questions or need to discuss payment arrangements, please don't hesitate to contact us.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
            
            <p style="font-size: 14px; color: #666;">
              Best regards,<br>
              <strong>${companyName}</strong><br>
              ${companyEmail ? `<a href="mailto:${companyEmail}" style="color: #f97316;">${companyEmail}</a><br>` : ""}
              ${companyPhone ? companyPhone : ""}
            </p>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px;">
            This is an automated payment reminder from ${companyName}
          </p>
        </body>
        </html>
      `;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${companyName} <onboarding@resend.dev>`,
            to: [invoice.client_email],
            subject: `Payment Reminder: Invoice ${invoice.invoice_number} is ${daysOverdue} Days Overdue`,
            html: emailHtml,
          }),
        });

        const emailResult = await emailResponse.json();
        const notificationStatus = emailResponse.ok ? "sent" : "failed";

        // Log notification to database
        await supabase.from("notifications").insert({
          company_id: invoice.company_id,
          type: "email",
          category: "payment_reminder",
          title: `Payment reminder: Invoice ${invoice.invoice_number}`,
          message: `${daysOverdue} days overdue - ${formatCurrency(invoice.total)}`,
          recipient_email: invoice.client_email,
          recipient_name: invoice.client_name,
          status: notificationStatus,
          metadata: { 
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            amount: invoice.total,
            days_overdue: daysOverdue
          },
          error_message: emailResponse.ok ? null : (emailResult.message || "Failed to send email"),
          created_by: invoice.created_by,
        });

        if (!emailResponse.ok) {
          console.error(`Failed to send reminder for ${invoice.invoice_number}:`, emailResult);
          results.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            success: false,
            error: emailResult.message || "Failed to send email",
          });
          continue;
        }

        console.log(`Reminder sent for invoice ${invoice.invoice_number}:`, emailResult);
        
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          success: true,
          emailId: emailResult.id,
        });
      } catch (emailError: any) {
        console.error(`Failed to send reminder for ${invoice.invoice_number}:`, emailError);
        results.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          success: false,
          error: emailError.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Sent ${successCount}/${results.length} reminders successfully`);

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
    console.error("Error in send-payment-reminder function:", error);
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
