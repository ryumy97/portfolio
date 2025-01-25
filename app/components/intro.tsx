'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, delay } from 'motion';
import { cn } from '@/lib/utils';
import { DEFAULT_EASING } from '../utils/animation';
import { create } from 'zustand';

const useIntroStore = create<{
  isPlaying: boolean;
}>(() => ({
  isPlaying: true,
}));

type COLORS = 'error' | 'sucess' | 'warning' | 'default' | 'highlight' | 'opposite';

const Intro = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spacingRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useState('');
  const [secondText, setSecondText] = useState<React.ReactNode>('');
  const [background, setBackground] = useState<COLORS>('default');

  useEffect(() => {
    const animation = async () => {
      if (!containerRef.current || !spacingRef.current) return;

      // Question
      const targetText = 'Who am I?';

      await animate(0, targetText.length, {
        duration: 0.5,
        ease: 'linear',
        onUpdate(latest) {
          setText(targetText.slice(0, Math.floor(latest)));
        },
        delay: 0.5,
      });

      animate(
        spacingRef.current,
        {
          height: '2.5rem',
        },
        {
          duration: 0.3,
          ease: DEFAULT_EASING,
        }
      );

      // Answer 1
      const targetSecondText = `I'm In Ha Ryu`;

      await animate(0, targetSecondText.length, {
        duration: 0.75,
        ease: 'linear',
        onUpdate(latest) {
          setSecondText(targetSecondText.slice(0, Math.floor(latest)));
        },
        delay: 1,
      });

      const targetTexts: {
        text: React.ReactNode;
        color: COLORS;
      }[] = [
        {
          text: (
            <>
              {`I'm`} <i>a developer</i>
            </>
          ),
          color: 'error',
        },
        {
          text: (
            <>
              {`I'm`} <i>an enthusiast</i>
            </>
          ),
          color: 'highlight',
        },
        {
          text: (
            <>
              I love <i>Interaction</i>
            </>
          ),
          color: 'sucess',
        },
        {
          text: (
            <>
              {`I'm`} <i>Creative</i>
            </>
          ),
          color: 'warning',
        },
        {
          text: (
            <>
              {`I'm a`} <i>developer</i>
            </>
          ),
          color: 'default',
        },
        {
          text: (
            <>
              {`I'm`} <i>Ryumy</i>
            </>
          ),
          color: 'opposite',
        },
      ];

      delay(async () => {
        await animate(0, 5, {
          duration: 1,
          ease: 'linear',
          onUpdate(latest) {
            setSecondText(targetTexts[Math.floor(latest)].text);
            setBackground(targetTexts[Math.floor(latest)].color);
          },
        });
      }, 0.2);

      await animate(
        containerRef.current,
        {
          y: '100%',
        },
        {
          ease: DEFAULT_EASING,
          duration: 0.6,
          delay: 1.5,
        }
      );

      useIntroStore.setState({ isPlaying: false });
    };

    animation();
  }, []);

  return (
    <div
      className={cn(
        'font-display absolute inset-0 flex h-full w-full flex-col items-end justify-center pr-8 text-9xl',
        {
          'text-foreground bg-background': background === 'default',
          'bg-error text-error-foreground': background === 'error',
          'bg-sucess text-sucess-foreground': background === 'sucess',
          'bg-warning text-warning-foreground': background === 'warning',
          'bg-highlight text-highlight-foreground': background === 'highlight',
          'text-background bg-foreground': background === 'opposite',
        }
      )}
      ref={containerRef}
    >
      <div className="flex h-32">{text}</div>
      <div ref={spacingRef}></div>
      <div className="flex h-32 whitespace-pre">{secondText}</div>
    </div>
  );
};

export default Intro;
