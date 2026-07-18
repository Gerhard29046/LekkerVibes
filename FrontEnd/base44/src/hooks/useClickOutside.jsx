import { useEffect, useRef } from 'react';

// Closes an open dropdown/menu on outside click or Escape. Returns a ref to
// attach to the dropdown's outermost container (trigger button + panel).
// Every dropdown/popover in the app (navbar, hero, profile menus, card
// overflow menus, etc.) shares this one hook rather than reimplementing
// dismissal per component.
export function useClickOutside(isOpen, onClose) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // pointerdown (not click/mousedown) so touch and mouse dismiss on the
    // initial tap/press rather than waiting for a full click cycle — the
    // difference is most noticeable on mobile, where 'click' can lag or,
    // combined with synthetic event ordering, sometimes never fire outside
    // the element at all.
    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return ref;
}
