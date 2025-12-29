import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send invoice email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, recipientEmail, message }: SendInvoiceRequest = await req.json();
    console.log(`Sending invoice ${invoiceId} to ${recipientEmail}`);

    if (!recipientEmail) {
      throw new Error("Recipient email is required");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Error fetching invoice:", invoiceError);
      throw new Error("Invoice not found");
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId);

    if (itemsError) {
      console.error("Error fetching invoice items:", itemsError);
    }

    console.log("Invoice found:", invoice.invoice_number);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: invoice.currency || "USD",
      }).format(amount);
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    // Build items HTML
    const itemsHtml = (items || []).map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280; text-align: right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #111827; text-align: right; font-weight: 500;">${formatCurrency(item.amount)}</td>
      </tr>
    `).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.invoice_number}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; color: #111827;">Invoice</h1>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">${invoice.invoice_number}</p>
            </div>

            <!-- Greeting -->
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Dear ${invoice.client_name},
            </p>

            ${message ? `
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                ${message}
              </p>
            ` : `
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                Please find your invoice details below. We appreciate your business!
              </p>
            `}

            <!-- Invoice Summary Box -->
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Issue Date:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500;">${formatDate(invoice.issue_date)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 14px;">Due Date:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 500;">${formatDate(invoice.due_date)}</span>
              </div>
              <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #111827; font-size: 18px; font-weight: 600;">Amount Due:</span>
                  <span style="color: #111827; font-size: 20px; font-weight: 700;">${formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            <!-- Items Table -->
            ${items && items.length > 0 ? `
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Description</th>
                    <th style="padding: 12px; text-align: center; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Price</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            ` : ""}

            <!-- Totals -->
            <div style="text-align: right; margin-bottom: 24px;">
              <div style="margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Subtotal: </span>
                <span style="color: #111827; font-size: 14px;">${formatCurrency(invoice.subtotal)}</span>
              </div>
              ${invoice.tax_amount && invoice.tax_amount > 0 ? `
                <div style="margin-bottom: 8px;">
                  <span style="color: #6b7280; font-size: 14px;">Tax (${invoice.tax_rate}%): </span>
                  <span style="color: #111827; font-size: 14px;">${formatCurrency(invoice.tax_amount)}</span>
                </div>
              ` : ""}
              <div style="border-top: 2px solid #111827; padding-top: 8px; margin-top: 8px;">
                <span style="color: #111827; font-size: 16px; font-weight: 600;">Total: </span>
                <span style="color: #111827; font-size: 18px; font-weight: 700;">${formatCurrency(invoice.total)}</span>
              </div>
            </div>

            <!-- Payment Due Notice -->
            <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                Payment due by <strong>${formatDate(invoice.due_date)}</strong>
              </p>
            </div>

            ${invoice.notes ? `
              <!-- Notes -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #374151; font-size: 12px; font-weight: 600;">Notes:</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">${invoice.notes}</p>
              </div>
            ` : ""}

            <!-- Footer -->
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Thank you for your business!
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
        from: "Invoices <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `Invoice ${invoice.invoice_number} - ${formatCurrency(invoice.total)} due ${formatDate(invoice.due_date)}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    const notificationStatus = emailResponse.ok ? "sent" : "failed";

    // Log notification to database
    await supabase.from("notifications").insert({
      company_id: invoice.company_id,
      type: "email",
      category: "invoice",
      title: `Invoice ${invoice.invoice_number} sent`,
      message: `Invoice for ${formatCurrency(invoice.total)} sent to ${invoice.client_name}`,
      recipient_email: recipientEmail,
      recipient_name: invoice.client_name,
      status: notificationStatus,
      metadata: { 
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        amount: invoice.total
      },
      error_message: emailResponse.ok ? null : (emailResult.message || "Failed to send email"),
      created_by: invoice.created_by,
    });

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResult);

    // Update invoice status to sent if it was draft
    if (invoice.status === "draft") {
      await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", invoiceId);
    }

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invoice-email:", error);
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
