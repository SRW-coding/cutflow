import { Link, useNavigate } from '@tanstack/react-router';
import { LogOut, UserCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
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
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/infrastructure/api/auth';

type HeaderProfileMenuProps = {
  profileTo: '/dashboard/profile' | '/admin/profile';
  displayName: string;
  email: string;
  variant?: 'user' | 'admin';
};

export function HeaderProfileMenu({
  profileTo,
  displayName,
  email,
}: HeaderProfileMenuProps) {
  const navigate = useNavigate();
  const { clearAuth, tokens } = useAuthStore();

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle compact />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cutflow-nav-profile-btn h-9 w-9 shrink-0 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white [&_svg]:h-6 [&_svg]:w-6 [&_svg]:stroke-white"
            aria-label="Account menu"
          >
            <UserCircle className="h-6 w-6" aria-hidden />
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
    </div>
  );
}
