'use client';

import { usePathname } from 'next/navigation';
import GridContainer from './grid';
import Link from './link';
import { cn } from '@/lib/utils';

const Header = () => {
  const pathname = usePathname();

  return (
    <GridContainer asChild className="fixed inset-x-0 top-0 z-10 w-full">
      <header>
        <div className="col-start-6 col-end-13 flex items-center justify-end gap-6">
          <div>
            <Link href="/about" className={cn(pathname.startsWith('/about') && 'text-highlight')}>
              About
            </Link>
          </div>
          <div>
            <Link href="/" className={cn(pathname === '/' && 'text-highlight')}>
              Projects
            </Link>
          </div>
          <div>
            <Link href="/blog" className={cn(pathname.startsWith('/blog') && 'text-highlight')}>
              Blog
            </Link>
          </div>
        </div>
      </header>
    </GridContainer>
  );
};

export default Header;
