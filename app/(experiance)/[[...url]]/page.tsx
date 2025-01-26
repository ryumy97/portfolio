'use server';

import { TransitionIn } from '@/app/components/transition';
import { notFound } from 'next/navigation';
import Homepage from '../pages/homepage';

const PageContent: Record<string, React.ReactNode> = {
  '/': <Homepage />,
};

const Page = async ({ params }: { params: Promise<{ url: string[] }> }) => {
  const url = (await params).url;

  const path = `/${url?.join('/') || ''}`;

  const Content = PageContent[path];

  if (!Content) {
    return notFound();
  }

  return <TransitionIn>{Content}</TransitionIn>;
};

export default Page;
