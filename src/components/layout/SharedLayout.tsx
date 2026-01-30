import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Share2 } from "lucide-react";

interface SharedLayoutProps {
  children: ReactNode;
}

/**
 * Simplified layout for shared/public views that don't require authentication
 */
export function SharedLayout({ children }: SharedLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col">
        {/* Simple header for shared view */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <h1 className="text-lg font-semibold">FinanceHub</h1>
            </div>
            <div className="flex flex-1 items-center justify-end space-x-4">
              <Badge variant="secondary" className="flex items-center gap-2">
                <Share2 className="h-3 w-3" />
                Shared View (Read-Only)
              </Badge>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
