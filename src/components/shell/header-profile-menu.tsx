import { Link, useNavigate } from '@tanstack/react-router';
import { LogOut, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/shared/ui/cn';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/infrastructure/api/auth';

type HeaderProfileMenuProps = {
  profileTo: '/dashboard/profile' | '/admin/profile';
  displayName: string;
  email: string;
  /** Visually separate admin vs user chrome */
  variant?: 'user' | 'admin';
};

export function HeaderProfileMenu({
  profileTo,
  displayName,
  email,
  variant = 'user',
}: HeaderProfileMenuProps) {
  const navigate = useNavigate();
  const { clearAuth, tokens } = useAuthStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-9 w-9 shrink-0 rounded-full border border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            variant === 'admin' && 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
          )}
          aria-label="Account menu"
        >
          <UserCircle className="h-5 w-5" />
          <span className="sr-only">Open account menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={profileTo} className="cursor-pointer gap-2">
            <UserCircle className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          onClick={() => {
            const rt = tokens?.refreshToken;
            if (rt) authApi.logout(rt).catch(() => {});
            clearAuth();
            toast.success('Signed out');
            void navigate({ to: '/login' });
          }}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
