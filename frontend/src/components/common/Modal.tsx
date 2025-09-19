// src/components/common/Modal.tsx
import * as React from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    // Remember the element that opened the modal to restore focus later
    triggerRef.current = (document.activeElement as HTMLElement) || null;

    // Lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Close on Escape
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeydown);

    // Initial focus to the modal container (tabbable via tabIndex)
    contentRef.current?.focus();

    return () => {
      // Restore scroll
      document.body.style.overflow = prevOverflow;
      // Cleanup
      document.removeEventListener('keydown', handleKeydown);
      // Restore focus to trigger
      triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;

    const getFocusable = (): HTMLElement[] => {
      const root = contentRef.current;
      if (!root) return [];
      const nodes = root.querySelectorAll<HTMLElement>(
        'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(nodes).filter((el) => {
        const disabled = el.hasAttribute('disabled');
        const hidden = el.offsetParent === null && el.getClientRects().length === 0;
        return !disabled && !hidden;
      });
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusable();
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inModal = active ? contentRef.current?.contains(active) : false;

      if (e.shiftKey) {
        // Shift+Tab: if on first or outside modal, wrap to last
        if (!inModal || active === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        // Tab: if on last or outside modal, wrap to first
        if (!inModal || active === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[15] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40"
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
      />
      <div
        ref={contentRef}
        tabIndex={-1}
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl outline-none"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 id="modal-title" className="text-lg font-semibold">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition"
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
