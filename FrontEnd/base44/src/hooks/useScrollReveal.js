// Returns Framer Motion props to spread onto a <motion.*> element for a
// scroll-triggered reveal — a small convenience so every section doesn't
// repeat the same initial/whileInView/viewport/transition block, while still
// allowing each section to vary direction/delay so the page doesn't use the
// exact same reveal everywhere.
const OFFSETS = {
  up: { y: 36 },
  left: { x: -36 },
  right: { x: 36 },
  scale: { scale: 0.92 },
};

export function useScrollReveal({ direction = 'up', delay = 0, amount = 0.15, reduceMotion = false } = {}) {
  if (reduceMotion) {
    return { initial: false, animate: { opacity: 1 }, viewport: { once: true, amount } };
  }
  const offset = OFFSETS[direction] || OFFSETS.up;
  return {
    initial: { opacity: 0, ...offset },
    whileInView: { opacity: 1, x: 0, y: 0, scale: 1 },
    viewport: { once: true, amount },
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
  };
}

// For a parent grid using variants + staggerChildren.
export function staggerContainer(staggerChildren = 0.08) {
  return {
    hidden: {},
    show: { transition: { staggerChildren } },
  };
}

export function staggerItem(direction = 'up') {
  const offset = OFFSETS[direction] || OFFSETS.up;
  return {
    hidden: { opacity: 0, ...offset },
    show: { opacity: 1, x: 0, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };
}
