// src/pages/pets/PetAddModal.tsx
import * as React from 'react';
import { Modal } from '@/components/common/Modal';
import { PetCategoryPicker } from './PetCategoryPicker';
import { PetCreateForm } from './PetCreateForm';

export function PetAddModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (pet: any) => void;
}) {
  const [step, setStep] = React.useState<'pick' | 'form'>('pick');
  const [picked, setPicked] = React.useState<{ _id: string; name: string } | null>(null);

  React.useEffect(() => {
    if (!open) {
      setStep('pick');
      setPicked(null);
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={step === 'pick' ? 'Choose Pet Category' : 'Create Pet'}>
      {step === 'pick' ? (
        <PetCategoryPicker
          onPick={(c) => {
            setPicked({ _id: c._id, name: c.name });
            setStep('form');
          }}
        />
      ) : picked ? (
        <PetCreateForm
          speciesCategoryId={picked._id}
          speciesCategoryName={picked.name}
          onCancel={() => setStep('pick')}
          onCreated={(pet) => {
            onCreated(pet);
            onClose();
          }}
        />
      ) : null}
    </Modal>
  );
}
