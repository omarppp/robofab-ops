'use client';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title = 'تأكيد الحذف', message = 'هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.', loading
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-1">{title}</h3>
          <p className="text-slate-400 text-sm">{message}</p>
        </div>
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>إلغاء</Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} loading={loading}>حذف</Button>
        </div>
      </div>
    </Modal>
  );
}
