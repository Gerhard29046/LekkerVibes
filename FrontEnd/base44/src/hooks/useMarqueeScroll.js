import { useRef, useEffect, useCallback } from 'react';

// A continuously-scrolling, seamlessly-looping horizontal track — the hero
// event carousel needs constant right-to-left motion that smoothly eases to
// a slower speed on hover/focus and back, plus drag/swipe, none of which
// Swiper's autoplay can do smoothly at once (changing its `speed`/`delay`
// on a running autoplay causes a visible jump, not a deceleration). This is
// a small requestAnimationFrame loop instead: velocity eases toward a
// target each frame (never an abrupt stop/start), and the caller renders
// its item list twice back-to-back so the offset can wrap seamlessly at
// the halfway point.
//
// Usage: render `[...items, ...items]` inside a flex track, spread
// `containerProps` onto the outer (overflow-hidden) wrapper and attach
// `trackRef` to the inner flex track.
export function useMarqueeScroll({ reduceMotion, normalDurationSec = 40, slowDurationSec = 100 } = {}) {
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0); // px/sec, negative = moving left
  const halfWidthRef = useRef(0);
  const rafRef = useRef(null);
  const slowRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    // Content is rendered twice back-to-back; half the scrollWidth is one
    // full loop, which is what the offset wraps against.
    halfWidthRef.current = track.scrollWidth / 2;
  }, []);

  const applyTransform = useCallback(() => {
    const track = trackRef.current;
    const halfWidth = halfWidthRef.current;
    if (!track || !halfWidth) return;
    let offset = offsetRef.current % halfWidth;
    if (offset < 0) offset += halfWidth;
    offsetRef.current = offset;
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
  }, []);

  useEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measure]);

  useEffect(() => {
    if (reduceMotion) return undefined; // static unless dragged or nudged by an arrow

    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!draggingRef.current && halfWidthRef.current) {
        const targetSpeed = slowRef.current ? slowDurationSec : normalDurationSec;
        const targetVelocity = -(halfWidthRef.current / targetSpeed);
        // Ease current velocity toward the target rather than snapping —
        // this is what makes hover feel like a slow-down, not a stop.
        velocityRef.current += (targetVelocity - velocityRef.current) * Math.min(dt * 2.2, 1);
        offsetRef.current += velocityRef.current * dt;
        applyTransform();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reduceMotion, normalDurationSec, slowDurationSec, applyTransform]);

  const setSlow = useCallback((value) => { slowRef.current = value; }, []);

  const handlePointerDown = useCallback((e) => {
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    offsetRef.current = dragStartOffsetRef.current - dx;
    applyTransform();
  }, [applyTransform]);

  const stopDragging = useCallback(() => { draggingRef.current = false; }, []);

  // Smoothly nudges by one card-width for the arrow buttons — a direct
  // jump would fight the continuous motion, so this eases toward the new
  // offset over a short window instead of setting it instantly.
  const nudge = useCallback((deltaPx) => {
    const start = offsetRef.current;
    const target = start + deltaPx;
    const duration = 420;
    const startTime = performance.now();
    draggingRef.current = true; // pause the ambient loop while the eased nudge runs
    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - t) * (1 - t) * (1 - t);
      offsetRef.current = start + (target - start) * eased;
      applyTransform();
      if (t < 1) requestAnimationFrame(step);
      else draggingRef.current = false;
    };
    requestAnimationFrame(step);
  }, [applyTransform]);

  return {
    trackRef,
    measure,
    setSlow,
    nudge,
    containerHandlers: {
      onPointerEnter: () => setSlow(true),
      onPointerLeave: () => setSlow(false),
      onFocus: () => setSlow(true),
      onBlur: () => setSlow(false),
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: stopDragging,
      onPointerCancel: stopDragging,
    },
  };
}
