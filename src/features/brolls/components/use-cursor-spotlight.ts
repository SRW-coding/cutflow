import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';

/**
 * Reusable mouse-following spotlight (aether.mom style).
 *
 * Returns the props you need to wire onto any element rendered with the
 * `.cursor-spotlight` CSS class:
 *   - `rootRef` to measure the element
 *   - `spotStyle` to apply the `--spot-x`/`--spot-y` CSS variables
 *   - `setSpotFromEvent` for pointermove / pointerenter
 *   - `active` + `setActive` for the entry/leave animation
 *
 * The glow size can be tuned via the `--spot-size` CSS variable (default 240px)
 * by setting it inline on the consuming element, e.g.
 *   style={{ ...spotStyle, '--spot-size': '120px' }}.
 */
export function useCursorSpotlight<T extends HTMLElement = HTMLElement>() {
  const rootRef = useRef<T>(null);
  const [active, setActive] = useState(false);
  const target = useRef({ x: 50, y: 50 });
  const current = useRef({ x: 50, y: 50 });
  const [spotStyle, setSpotStyle] = useState<CSSProperties>({
    '--spot-x': '50%',
    '--spot-y': '50%',
    '--glow-sx': '0px',
    '--glow-sy': '0px',
  } as CSSProperties);

  const toSpotStyle = (x: number, y: number): CSSProperties =>
    ({
      '--spot-x': `${x}%`,
      '--spot-y': `${y}%`,
      '--glow-sx': `${((x - 50) / 50) * 14}px`,
      '--glow-sy': `${((y - 50) / 50) * 14}px`,
    }) as CSSProperties;

  useLayoutEffect(() => {
    if (!active) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      const t = target.current;
      current.current = { ...t };
      setSpotStyle(toSpotStyle(t.x, t.y));
      return;
    }
    let raf = 0;
    const tick = () => {
      const c = current.current;
      const t = target.current;
      c.x += (t.x - c.x) * 0.32;
      c.y += (t.y - c.y) * 0.32;
      setSpotStyle(toSpotStyle(c.x, c.y));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const setSpotFromEvent = useCallback(
    (e: ReactPointerEvent<T>) => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      target.current = { x, y };
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!active || reducedMotion) {
        current.current = { x, y };
        setSpotStyle(toSpotStyle(x, y));
      }
    },
    [active],
  );

  return { rootRef, active, setActive, spotStyle, setSpotFromEvent };
}
