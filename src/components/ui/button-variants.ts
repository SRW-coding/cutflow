import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'broll-gradient-btn border-0 text-white shadow-md hover:brightness-95 active:brightness-90 [&_svg]:stroke-white [&_svg]:text-white',
        gradient:
          'broll-gradient-btn border-0 text-white shadow-md hover:brightness-95 active:brightness-90 [&_svg]:stroke-white [&_svg]:text-white',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground [&_svg]:cutflow-gradient-icon',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 [&_svg]:cutflow-gradient-icon',
        ghost: 'hover:bg-accent hover:text-accent-foreground [&_svg]:cutflow-gradient-icon',
        link: 'text-[#fd8b0c] underline-offset-4 hover:text-[#fb0302] hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
