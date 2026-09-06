"use client";

import { useScrollEvent } from "@/components/smooth-scroll";
import { transform, useReducedMotion } from "motion/react";
import {
  Children,
  type CSSProperties,
  isValidElement,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

type Mark = {
  italic?: boolean;
  href?: string;
  className?: string;
};

type Token = Mark & { char: string; index: number };

type Word = {
  tokens: Token[];
  start: number;
  space: boolean;
  lineBreak: boolean;
};

function flatten(
  node: ReactNode,
  mark: Mark = {},
): Array<Mark & { char: string }> {
  return Children.toArray(node).flatMap((child) => {
    if (typeof child === "number") {
      return flatten(String(child), mark);
    }
    if (typeof child === "string") {
      return Array.from(child).map((char) => ({
        ...mark,
        char: /\s/.test(char) ? " " : char,
      }));
    }
    if (
      !isValidElement<{
        children?: ReactNode;
        href?: string;
        className?: string;
      }>(child)
    ) {
      return [];
    }
    const type = child.type;
    if (type === "br") {
      return [{ ...mark, char: "\n" }];
    }
    const next: Mark = { ...mark };
    if (type === "i" || type === "em") next.italic = true;
    if (type === "a") {
      next.href = child.props.href;
      next.className = child.props.className;
    }
    return flatten(child.props.children, next);
  });
}

function collapse(tokens: Array<Mark & { char: string }>): Token[] {
  const next: Token[] = [];
  for (const token of tokens) {
    const prev = next.at(-1);
    if (token.char === " " && (prev?.char === " " || prev?.char === "\n")) {
      continue;
    }
    if (token.char === "\n" && prev?.char === " ") {
      next.pop();
    }
    next.push({ ...token, index: next.length });
  }
  return next;
}

function groupWords(tokens: Token[]): Word[] {
  const words: Word[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.char === "\n") {
      words.push({ tokens: [token], start: i, space: false, lineBreak: true });
      continue;
    }
    const space = token.char === " ";
    const prev = words.at(-1);
    if (prev && !prev.lineBreak && prev.space === space && !space) {
      prev.tokens.push(token);
      continue;
    }
    words.push({ tokens: [token], start: i, space, lineBreak: false });
  }
  return words;
}

function groupMarks(tokens: Token[]) {
  const runs: Array<Mark & { tokens: Token[] }> = [];
  for (const token of tokens) {
    const prev = runs.at(-1);
    if (
      prev &&
      prev.italic === token.italic &&
      prev.href === token.href &&
      prev.className === token.className
    ) {
      prev.tokens.push(token);
      continue;
    }
    runs.push({
      tokens: [token],
      italic: token.italic,
      href: token.href,
      className: token.className,
    });
  }
  return runs;
}

function Char({ char, index }: { char: string; index: number }) {
  return (
    <span
      style={
        {
          "--i": index,
          opacity:
            "clamp(0, calc((var(--reveal) * (var(--count) + 1) - var(--i)) / 2), 1)",
        } as CSSProperties
      }
    >
      {char}
    </span>
  );
}

function MarkedChars({ tokens }: { tokens: Token[] }) {
  return groupMarks(tokens).map((run) => {
    const chars = run.tokens.map((token) => (
      <Char key={token.index} char={token.char} index={token.index} />
    ));
    const key = run.tokens[0]?.index ?? 0;
    if (run.href) {
      return (
        <a key={key} href={run.href} className={run.className}>
          {chars}
        </a>
      );
    }
    if (run.italic) {
      return <i key={key}>{chars}</i>;
    }
    return <span key={key}>{chars}</span>;
  });
}

type Props = {
  children: ReactNode;
};

const SplitText = ({ children }: Props) => {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const reduceRef = useRef(reduceMotion);
  reduceRef.current = reduceMotion;

  const tokens = useMemo(() => collapse(flatten(children)), [children]);
  const words = useMemo(() => groupWords(tokens), [tokens]);
  const plain = useMemo(
    () => tokens.map((token) => token.char).join(""),
    [tokens],
  );
  const count = Math.max(tokens.length, 1);

  const syncReveal = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceRef.current) {
      el.style.setProperty("--reveal", "1");
      return;
    }
    const rect = el.getBoundingClientRect();
    const progress = transform(
      rect.top,
      [window.innerHeight * 0.9, window.innerHeight * 0.6],
      [0, 1],
      { clamp: true },
    );
    el.style.setProperty("--reveal", String(progress));
  }, []);

  useLayoutEffect(() => {
    syncReveal();
    window.addEventListener("resize", syncReveal);
    return () => window.removeEventListener("resize", syncReveal);
  }, [syncReveal]);

  useScrollEvent(syncReveal);

  return (
    <>
      <span className="sr-only">{plain}</span>
      <span
        ref={ref}
        aria-hidden
        style={{ "--reveal": 0, "--count": count } as CSSProperties}
      >
        {words.map((word) =>
          word.lineBreak ? (
            <br key={`b-${word.start}`} />
          ) : word.space ? (
            <MarkedChars key={`s-${word.start}`} tokens={word.tokens} />
          ) : (
            <span
              key={`w-${word.start}`}
              className="inline-block max-w-full whitespace-nowrap"
            >
              <MarkedChars tokens={word.tokens} />
            </span>
          ),
        )}
      </span>
    </>
  );
};

export default SplitText;
