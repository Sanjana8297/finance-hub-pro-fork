// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { Tables } from "@/integrations/supabase/types";
// import { format } from "date-fns";

// // export type AuditLog = Tables<"audit_logs"> & {
// //   profiles?: {
// //     full_name: string | null;
// //     email: string | null;
// //     avatar_url: string | null;
// //   } | null;
// // };

// export function useAuditLogs() {
//   return useQuery({
//     queryKey: ["audit-logs"],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from("audit_logs")
//         .select(`
//           *,
//           profiles:user_id (
//             full_name,
//             email,
//             avatar_url
//           )
//         `)
//         .order("created_at", { ascending: false })
//         .limit(1000); // Limit to recent 1000 logs

//       if (error) throw error;
//       return data as AuditLog[];
//     },
//   });
// }
