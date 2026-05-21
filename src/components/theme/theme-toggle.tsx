import { Check, ChevronDown, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/shared/ui/cn';
import { useTheme } from '@/shared/theme/theme-provider';

type ThemeToggleProps = {
  compact?: boolean;
  className?: string;
  /** `nav` = black header bars; `surface` = editor / light panels */
  variant?: 'nav' | 'surface';
};

const navChrome =
  'border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white [&_svg]:stroke-white [&_svg]:text-white';
const surfaceChrome =
  'border-border bg-muted/40 text-foreground hover:bg-muted/60 hover:text-foreground';

/** Theme picker — `nav` stays dark on black headers; `surface` follows editor chrome. */
export function ThemeToggle({
  compact = true,
  className,
  variant = 'nav',
}: ThemeToggleProps) {
  const { setTheme, isDark } = useTheme();
  const onNav = variant === 'nav';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'cutflow-theme-toggle inline-flex shrink-0 items-center justify-center gap-1 rounded-md border text-sm font-medium shadow-sm transition-colors',
            onNav ? navChrome : surfaceChrome,
            compact ? 'h-8 min-w-[4.25rem] px-2' : 'h-9 min-w-[5rem] gap-2 px-3',
            className,
          )}
          aria-label={isDark ? 'Dark mode' : 'Light mode'}
        >
          {isDark ? (
            <Moon className={cn('h-4 w-4 shrink-0', onNav && 'text-white')} aria-hidden />
          ) : (
            <Sun className={cn('h-4 w-4 shrink-0', onNav && 'text-white')} aria-hidden />
          )}
          <ChevronDown
            className={cn('h-3.5 w-3.5 shrink-0', onNav ? 'text-white/70' : 'text-muted-foreground')}
            aria-hidden
          />
          {!compact ? <span className={onNav ? 'text-white' : undefined}>Theme</span> : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          'cutflow-theme-toggle-menu min-w-[10rem]',
          onNav
            ? 'border-white/15 bg-[#151515] text-white'
            : 'border-border bg-popover text-popover-foreground',
        )}
      >
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={cn(
            'cursor-pointer gap-2',
            onNav ? 'text-white focus:bg-white/10 focus:text-white' : 'focus:bg-accent focus:text-accent-foreground',
          )}
        >
          <Sun className="h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1">Light mode</span>
          {!isDark ? <Check className="h-4 w-4 shrink-0 text-[#fd8b0c]" aria-hidden /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={cn(
            'cursor-pointer gap-2',
            onNav ? 'text-white focus:bg-white/10 focus:text-white' : 'focus:bg-accent focus:text-accent-foreground',
          )}
        >
          <Moon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1">Dark mode</span>
          {isDark ? <Check className="h-4 w-4 shrink-0 text-[#fd8b0c]" aria-hidden /> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
