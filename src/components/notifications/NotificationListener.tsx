import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle, XCircle, Clock, FileText, DollarSign, Receipt, Bell } from "lucide-react";

const categoryIcons: Record<string, typeof Mail> = {
  invoice: FileText,
  expense: DollarSign,
  payment_reminder: Clock,
  receipt: Receipt,
  system: Bell,
};

export function NotificationListener() {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel("global-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const notification = payload.new as {
            id: string;
            title: string;
            message: string | null;
            category: string;
            status: string;
            recipient_name: string | null;
          };

          console.log("New notification received:", notification);

          const CategoryIcon = categoryIcons[notification.category] || Mail;
          const isSuccess = notification.status === "sent";

          toast({
            title: notification.title,
            description: notification.message || `Notification ${notification.status}`,
            variant: isSuccess ? "default" : "destructive",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return null;
}
