import { cn } from '@/shared/ui/cn';

interface FreeCutLogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: 'h-7 w-auto',
    text: 'text-base',
    gap: 'gap-1.5',
  },
  md: {
    icon: 'h-9 w-auto',
    text: 'text-xl',
    gap: 'gap-2',
  },
  lg: {
    icon: 'h-12 w-auto',
    text: 'text-3xl',
    gap: 'gap-3',
  },
};

const LOGO_PNG = '/assets/logo/CutFlow.png';

export function FreeCutLogo({ variant = 'full', size = 'md', className }: FreeCutLogoProps) {
  const config = sizeConfig[size];

  if (variant === 'icon') {
    return (
      <img
        src={LOGO_PNG}
        alt="CutFlow"
        className={cn(config.icon, 'shrink-0', className)}
        loading="eager"
        decoding="async"
      />
    );
  }

  return (
    <div className={cn('flex items-center', config.gap, className)}>
      <img
        src={LOGO_PNG}
        alt="CutFlow"
        className={cn(config.icon, 'shrink-0')}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

