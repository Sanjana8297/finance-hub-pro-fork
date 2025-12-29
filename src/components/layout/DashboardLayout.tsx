import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { 
  LucideIcon,
  LayoutDashboard,
  Receipt,
  FileText,
  CreditCard,
  Users,
  UserCog,
  FileBarChart,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  Building2,
  Wallet
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Receipts", href: "/receipts", icon: Receipt, badge: 12 },
  { label: "Invoices", href: "/invoices", icon: FileText, badge: 5 },
  { label: "Expenses", href: "/expenses", icon: CreditCard },
  { label: "Payroll", href: "/payroll", icon: Wallet },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Reports", href: "/reports", icon: FileBarChart },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Audit Logs", href: "/audit-logs", icon: ScrollText },
  { label: "Users", href: "/users", icon: UserCog },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getRoleDisplay = () => {
    if (roles.includes("super_admin")) return "Super Admin";
    if (roles.includes("admin")) return "Admin";
    if (roles.includes("finance_manager")) return "Finance Manager";
    if (roles.includes("accountant")) return "Accountant";
    if (roles.includes("hr")) return "HR";
    if (roles.includes("auditor")) return "Auditor";
    return "Employee";
  };
  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-all duration-300 gradient-hero",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold text-white">FinanceHub</h1>
                <p className="text-[10px] text-white/60">Enterprise Suite</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <ul className="space-y-1.5">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href} className="animate-slide-in-left" style={{ animationDelay: `${index * 0.05}s` }}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-white text-primary shadow-lg"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "")} />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className={cn(
                            "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                            isActive ? "bg-primary text-white" : "bg-white/20 text-white"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse Button */}
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <Button
            variant="glass"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("w-full justify-center", collapsed && "px-0")}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300", collapsed ? "ml-20" : "ml-64")}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-6">
            {/* Search */}
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions, invoices, employees..."
                className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                      3
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                    <span className="text-sm font-medium">Invoice #1234 is overdue</span>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                    <span className="text-sm font-medium">New receipt uploaded</span>
                    <span className="text-xs text-muted-foreground">5 hours ago</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                    <span className="text-sm font-medium">Payroll processed for Dec</span>
                    <span className="text-xs text-muted-foreground">1 day ago</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email || 'user'}`} />
                      <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left md:block">
                      <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{getRoleDisplay()}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                  <DropdownMenuItem>Company Settings</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
