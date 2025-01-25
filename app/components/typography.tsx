import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

type Props = {
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
};

export const HugeTitle = ({ children, asChild, className }: Props) => {
  const Comp = asChild ? Slot : 'h1';

  return (
    <Comp className={cn('text-foreground font-display bg-clip-text text-9xl', className)}>
      {children}
    </Comp>
  );
};

export const Subtitle = ({ children, asChild, className }: Props) => {
  const Comp = asChild ? Slot : 'p';

  return <Comp className={cn('text-foreground font-body text-4xl', className)}>{children}</Comp>;
};

export const LinkLabel = ({ children, asChild, className }: Props) => {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp className={cn('text-foreground font-mono text-sm uppercase', className)}>{children}</Comp>
  );
};
