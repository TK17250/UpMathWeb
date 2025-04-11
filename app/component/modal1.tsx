'use client';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ReactNode, useState, useEffect } from 'react';

interface ConfirmationModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmButtonText: string;
  cancelButtonText: string;
  icon?: ReactNode;
}

export default function ConfirmationModal({
  open,
  setOpen,
  onConfirm,
  title,
  message,
  confirmButtonText,
  cancelButtonText,
  icon = <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-yellow-500" />
}: ConfirmationModalProps) {
  // Track animation state
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Handle close with animation
  const handleClose = () => {
    setIsExiting(true);
    
    // Wait for exit animation to complete
    setTimeout(() => {
      setOpen(false);
      setIsExiting(false);
    }, 300);
  };

  // Handle confirm with animation
  const handleConfirm = () => {
    setIsExiting(true);
    
    // Wait for exit animation to complete
    setTimeout(() => {
      setOpen(false);
      setIsExiting(false);
      onConfirm();
    }, 300);
  };

  // Set visible after component mounts (for entry animation)
  useEffect(() => {
    if (open) {
      setIsVisible(true);
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      className="relative z-10"
    >
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes zoomOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
        }
      `}</style>

      <DialogBackdrop
        className={`
          fixed inset-0 bg-black/50
          ${isExiting ? 'animate-[fadeOut_300ms_ease-in-out_forwards]' : 'animate-[fadeIn_300ms_ease-in-out_forwards]'}
        `}
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            className={`
              relative overflow-hidden rounded-lg bg-[#2D4A5B] px-4 pt-5 pb-4 text-left shadow-xl
              sm:my-8 sm:w-full sm:max-w-lg sm:p-6
              ${isExiting 
                ? 'animate-[zoomOut_300ms_cubic-bezier(0.4,0,0.2,1)_forwards]' 
                : 'animate-[zoomIn_300ms_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]'
              }
              transform-gpu
            `}
          >
            <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md bg-[#2D4A5B] text-white hover:text-gray-300 focus:outline-hidden cursor-pointer transition-all duration-300 outline-none"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:size-10">
                {icon}
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <DialogTitle as="h3" className="text-base font-bold text-[#80ED99]">
                  {title}
                </DialogTitle>
                <div className="mt-2">
                  {typeof message === 'string' ? (
                    <p className="text-sm text-white">{message}</p>
                  ) : (
                    message
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex w-full justify-center rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-600 transition-all duration-300 sm:ml-3 sm:w-auto cursor-pointer"
              >
                {confirmButtonText}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-xs sm:mt-0 sm:w-auto cursor-pointer bg-[#203D4F] hover:text-[#80ED99] hover:bg-[#002D4A] transition-all duration-300 text-white"
              >
                {cancelButtonText}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}