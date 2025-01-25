import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

type Props = {
  className?: string;
  asChild?: boolean;
} & React.PropsWithChildren;

const GridContainer = ({ children, asChild, className }: Props) => {
  const Comp = asChild ? Slot : 'div';

  return <Comp className={cn('grid grid-cols-12 gap-x-6 p-12', className)}>{children}</Comp>;
};

export default GridContainer;
