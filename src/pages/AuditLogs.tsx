// import { useState } from "react";
// import { DashboardLayout } from "@/components/layout/DashboardLayout";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   Search,
//   Filter,
//   Download,
//   LogIn,
//   LogOut,
//   Edit,
//   Trash2,
//   Plus,
//   Eye,
//   Settings,
//   Shield,
// } from "lucide-react";
// import { useAuditLogs } from "@/hooks/useAuditLogs";
// import { format } from "date-fns";
// import { Loader2 } from "lucide-react";

// interface AuditLogDisplay {
//   id: string;
//   user: {
//     name: string;
//     email: string;
//     avatar: string;
//   };
//   action: string;
//   actionType: "login" | "logout" | "create" | "update" | "delete" | "approve";
//   tableName: string;
//   recordId: string;
//   timestamp: string;
//   ipAddress: string;
// }

// const actionConfig = {
//   login: { icon: LogIn, color: "bg-success/10 text-success", label: "Login" },
//   logout: { icon: LogOut, color: "bg-muted text-muted-foreground", label: "Logout" },
//   create: { icon: Plus, color: "bg-info/10 text-info", label: "Create" },
//   update: { icon: Edit, color: "bg-warning/10 text-warning", label: "Update" },
//   delete: { icon: Trash2, color: "bg-destructive/10 text-destructive", label: "Delete" },
//   approve: { icon: Shield, color: "bg-primary/10 text-primary", label: "Approve" },
// };

// const AuditLogs = () => {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
//   const [userFilter, setUserFilter] = useState<string>("all");
//   const { data: auditLogsData, isLoading } = useAuditLogs();

//   // Transform database audit logs to display format
//   const auditLogs: AuditLogDisplay[] = (auditLogsData || []).map((log) => {
//     const profile = log.profiles;
//     const userName = profile?.full_name || profile?.email || "Unknown User";
//     const userEmail = profile?.email || "N/A";
//     const avatarSeed = profile?.full_name?.toLowerCase().replace(/\s+/g, "-") || profile?.email?.split("@")[0] || "user";
    
//     // Determine action type from action string
//     const actionLower = log.action.toLowerCase();
//     let actionType: "login" | "logout" | "create" | "update" | "delete" | "approve" = "update";
//     if (actionLower.includes("login") || actionLower.includes("logged in")) {
//       actionType = "login";
//     } else if (actionLower.includes("logout") || actionLower.includes("logged out")) {
//       actionType = "logout";
//     } else if (actionLower.includes("created") || actionLower.includes("create")) {
//       actionType = "create";
//     } else if (actionLower.includes("deleted") || actionLower.includes("delete")) {
//       actionType = "delete";
//     } else if (actionLower.includes("approved") || actionLower.includes("approve")) {
//       actionType = "approve";
//     }

//     return {
//       id: log.id,
//       user: {
//         name: userName,
//         email: userEmail,
//         avatar: avatarSeed,
//       },
//       action: log.action,
//       actionType,
//       tableName: log.table_name,
//       recordId: log.record_id || "-",
//       timestamp: format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss"),
//       ipAddress: log.ip_address || "N/A",
//     };
//   });

//   // Get unique users
//   const uniqueUsers = [...new Set(auditLogs.map((log) => log.user.name))];

//   // Filter audit logs based on search query and filters
//   const filteredLogs = auditLogs.filter((log) => {
//     const matchesSearch =
//       !searchQuery ||
//       log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       log.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       log.tableName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       log.recordId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       log.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase());

//     const matchesActionType = actionTypeFilter === "all" || log.actionType === actionTypeFilter;
//     const matchesUser = userFilter === "all" || log.user.name === userFilter;

//     return matchesSearch && matchesActionType && matchesUser;
//   });

//   return (
//     <DashboardLayout>
//       {/* Page Header */}
//       <div className="mb-8">
//         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
//             <p className="text-muted-foreground">
//               Track all system activities and user actions
//             </p>
//           </div>
//           <Button variant="outline">
//             <Download className="mr-2 h-4 w-4" />
//             Export Logs
//           </Button>
//         </div>
//       </div>

//       {/* Stats */}
//       <div className="mb-6 grid gap-4 sm:grid-cols-4">
//         <Card variant="stat" className="p-4">
//           <p className="text-sm text-muted-foreground">Total Actions</p>
//           <p className="text-2xl font-bold">12,458</p>
//         </Card>
//         <Card variant="stat" className="p-4">
//           <p className="text-sm text-muted-foreground">Today</p>
//           <p className="text-2xl font-bold">156</p>
//         </Card>
//         <Card variant="stat" className="p-4">
//           <p className="text-sm text-muted-foreground">Active Users</p>
//           <p className="text-2xl font-bold">24</p>
//         </Card>
//         <Card variant="stat" className="p-4">
//           <p className="text-sm text-muted-foreground">Failed Logins</p>
//           <p className="text-2xl font-bold text-destructive">3</p>
//         </Card>
//       </div>

//       {/* Filters & Search */}
//       <Card className="mb-6">
//         <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//             <Input 
//               placeholder="Search logs..." 
//               className="pl-10"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//           <div className="flex gap-2">
//             <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
//               <SelectTrigger className="w-full sm:w-[160px]">
//                 <SelectValue placeholder="Action Type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Actions</SelectItem>
//                 <SelectItem value="login">Login</SelectItem>
//                 <SelectItem value="logout">Logout</SelectItem>
//                 <SelectItem value="create">Create</SelectItem>
//                 <SelectItem value="update">Update</SelectItem>
//                 <SelectItem value="delete">Delete</SelectItem>
//                 <SelectItem value="approve">Approve</SelectItem>
//               </SelectContent>
//             </Select>
//             <Select value={userFilter} onValueChange={setUserFilter}>
//               <SelectTrigger className="w-full sm:w-[180px]">
//                 <SelectValue placeholder="User" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Users</SelectItem>
//                 {uniqueUsers.map((user) => (
//                   <SelectItem key={user} value={user}>
//                     {user}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Audit Logs Table */}
//       <Card>
//         <CardContent className="p-0">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>User</TableHead>
//                 <TableHead>Action</TableHead>
//                 <TableHead>Type</TableHead>
//                 <TableHead>Table</TableHead>
//                 <TableHead>Record ID</TableHead>
//                 <TableHead>Timestamp</TableHead>
//                 <TableHead>IP Address</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {isLoading ? (
//                 <TableRow>
//                   <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
//                     Loading audit logs...
//                   </TableCell>
//                 </TableRow>
//               ) : filteredLogs.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
//                     No audit logs found
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 filteredLogs.map((log) => {
//                 const config = actionConfig[log.actionType];
//                 const Icon = config.icon;
//                 return (
//                   <TableRow key={log.id}>
//                     <TableCell>
//                       <div className="flex items-center gap-2">
//                         <Avatar className="h-7 w-7">
//                           <AvatarImage
//                             src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${log.user.avatar}`}
//                           />
//                           <AvatarFallback>{log.user.name.charAt(0)}</AvatarFallback>
//                         </Avatar>
//                         <div>
//                           <p className="text-sm font-medium">{log.user.name}</p>
//                           <p className="text-xs text-muted-foreground">{log.user.email}</p>
//                         </div>
//                       </div>
//                     </TableCell>
//                     <TableCell className="max-w-[200px]">
//                       <p className="truncate text-sm">{log.action}</p>
//                     </TableCell>
//                     <TableCell>
//                       <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${config.color}`}>
//                         <Icon className="h-3 w-3" />
//                         {config.label}
//                       </div>
//                     </TableCell>
//                     <TableCell>
//                       <Badge variant="muted">{log.tableName}</Badge>
//                     </TableCell>
//                     <TableCell className="font-mono text-xs text-muted-foreground">
//                       {log.recordId}
//                     </TableCell>
//                     <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
//                       {log.timestamp}
//                     </TableCell>
//                     <TableCell className="font-mono text-xs text-muted-foreground">
//                       {log.ipAddress}
//                     </TableCell>
//                   </TableRow>
//                 );
//               })
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//     </DashboardLayout>
//   );
// };

// export default AuditLogs;
