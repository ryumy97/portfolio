'use client';

import { AnimatePresence, motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import React, { ReactNode } from 'react';
import { create, StoreApi } from 'zustand';
import { DEFAULT_EASING } from '../utils/animation';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
  (window.document?.createElement || window.navigator?.product === 'ReactNative')
    ? React.useLayoutEffect
    : React.useEffect;

type Props = { children: React.ReactNode };

type State = {
  current: Array<React.ReactNode>;
  version: number;
  set: StoreApi<State>['setState'];
};

function tunnel() {
  const useStore = create<State>((set) => ({
    current: new Array<ReactNode>(),
    version: 0,
    set,
  }));

  return {
    In: ({ children }: Props) => {
      const set = useStore((state) => state.set);
      const version = useStore((state) => state.version);

      /* When this component mounts, we increase the store's version number.
      This will cause all existing rats to re-render (just like if the Out component
      were mapping items to a list.) The re-rendering will cause the final 
      order of rendered components to match what the user is expecting. */
      useIsomorphicLayoutEffect(() => {
        set((state) => ({
          version: state.version + 1,
        }));
      }, []);

      /* Any time the children _or_ the store's version number change, insert
      the specified React children into the list of rats. */
      useIsomorphicLayoutEffect(() => {
        set(({ current }) => ({
          current: [...current, children],
        }));

        return () =>
          set(({ current }) => ({
            current: current.filter((c) => c !== children),
          }));
      }, [children, version]);

      return null;
    },

    Out: () => {
      const current = useStore((state) => state.current);
      return <AnimatePresence mode="popLayout">{current}</AnimatePresence>;
    },
  };
}

const Transition = tunnel();

const TransitionItem = ({ children }: Props) => {
  return (
    <motion.div
      className="bg-background absolute inset-0 overflow-auto"
      initial={{ x: '50%', y: '-100%', rotate: '-20deg' }}
      animate={{ x: 0, y: 0, rotate: '0deg' }}
      exit={{ z: -10 }}
      transition={{ duration: 0.5, ease: DEFAULT_EASING }}
    >
      {children}
    </motion.div>
  );
};

export const TransitionIn = ({ children }: Props) => {
  const pathname = usePathname();

  return (
    <Transition.In>
      <TransitionItem key={pathname}>{children}</TransitionItem>
    </Transition.In>
  );
};

export const TransitionOut = Transition.Out;
