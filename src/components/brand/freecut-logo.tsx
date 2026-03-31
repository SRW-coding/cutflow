import { cn } from '@/shared/ui/cn';

interface FreeCutLogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: 'w-5 h-5',
    text: 'text-base',
    gap: 'gap-1.5',
  },
  md: {
    icon: 'w-7 h-7',
    text: 'text-xl',
    gap: 'gap-2',
  },
  lg: {
    icon: 'w-10 h-10',
    text: 'text-3xl',
    gap: 'gap-3',
  },
};

function ScissorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
    >
      <circle style={{ fill: '#FFAD9E' }} cx="256" cy="256" r="256" />
      <path
        style={{ fill: '#FF6262' }}
        d="M116.652,343.919l166.633,166.633c121.335-12.857,217.357-110.47,227.762-232.52l-53.924-53.924
	l-9.912-4.741l-52.87-52.464L116.652,343.919z"
      />
      <path
        style={{ fill: '#366695' }}
        d="M380.407,351.389H131.591c-10.314,0-18.677-8.361-18.677-18.675V179.286
	c0-10.314,8.361-18.677,18.677-18.677h248.816c10.314,0,18.675,8.361,18.675,18.677v153.428
	C399.084,343.028,390.723,351.389,380.407,351.389z"
      />
      <path
        style={{ fill: '#273B7A' }}
        d="M380.407,160.611H255.424v190.779h124.983c10.314,0,18.675-8.361,18.675-18.675V179.288
	C399.084,168.972,390.723,160.611,380.407,160.611z"
      />
      <circle style={{ fill: '#FFEDB5' }} cx="256" cy="271.894" r="47.695" />
      <path
        style={{ fill: '#FEE187' }}
        d="M256,224.204c-0.193,0-0.383,0.012-0.574,0.014v95.36c0.191,0.002,0.381,0.016,0.574,0.016
	c26.341,0,47.695-21.354,47.695-47.695S282.341,224.204,256,224.204z"
      />
      <path
        style={{ fill: '#263A7A' }}
        d="M247.361,251.218l28.839,16.649c3.103,1.791,3.103,6.27,0,8.061l-28.839,16.649
	c-3.103,1.791-6.982-0.448-6.982-4.03v-33.301C240.381,251.666,244.258,249.427,247.361,251.218z"
      />
      <path
        style={{ fill: '#121149' }}
        d="M276.201,267.867l-20.775-11.995v32.049l20.775-11.995
	C279.304,274.137,279.304,269.659,276.201,267.867z"
      />
      <rect x="112.916" y="184.458" style={{ fill: '#C1C7D3' }} width="286.168" height="23.847" />
      <rect x="255.431" y="184.458" style={{ fill: '#919FB5' }} width="143.653" height="23.847" />
      <path
        style={{ fill: '#121149' }}
        d="M320.455,383.497l-26.571,1.877l1.87-26.572l140.09-140.126c4.479-4.479,11.74-4.48,16.217-0.003
	l8.482,8.482c4.479,4.477,4.479,11.738,0,16.219L320.455,383.497z"
      />
      <path
        style={{ fill: '#09092D' }}
        d="M456.88,223.489L295.079,385.289l25.374-1.793l140.09-140.124c4.479-4.479,4.479-11.74,0-16.219
	L456.88,223.489z"
      />
    </svg>
  );
}

export function FreeCutLogo({ variant = 'full', size = 'md', className }: FreeCutLogoProps) {
  const config = sizeConfig[size];

  if (variant === 'icon') {
    return <ScissorIcon className={cn(config.icon, 'text-primary', className)} />;
  }

  return (
    <div className={cn('flex items-center', config.gap, className)}>
      <ScissorIcon className={cn(config.icon, 'text-primary')} />
      <span
        className={cn(
          config.text,
          'font-semibold tracking-tight text-foreground'
        )}
      >
        CutFlow
      </span>
    </div>
  );
}

