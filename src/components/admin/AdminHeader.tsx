import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { RefreshCw, Bell, Activity } from "lucide-react";
import zenkaLogo from "@/assets/zenka-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface AdminHeaderProps {
  user: any;
  onRefresh: () => void;
  pendingCount: number;
}

export const AdminHeader = ({ user, onRefresh, pendingCount }: AdminHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <img src={zenkaLogo} alt="Zenka" className="h-10 w-auto flex-shrink-0" />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            Super Admin
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Full system control & monitoring</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem className="text-sm">
              <span className="font-medium">Pending Actions: {pendingCount}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
        <UserMenu userName={user?.user_metadata?.full_name || "Super Admin"} userEmail={user?.email} />
      </div>
    </div>
  );
};
