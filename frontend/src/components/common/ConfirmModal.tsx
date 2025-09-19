// src/components/common/ConfirmModal.tsx
import * as React from 'react';
import { Button } from '@/components/UiComponents/button';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm: () => void;
  danger?: boolean;
  footer?: React.ReactNode;
  children?: React.ReactNode;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onClose,
  onConfirm,
  danger,
  footer,
  children,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
        {children}
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            className="border-[#E5E7EB] bg-white hover:bg-white/90"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            className={danger ? 'bg-rose-600 hover:bg-rose-700' : ''}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
