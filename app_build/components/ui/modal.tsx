import * as React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface ModalProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  title?: string;
  description?: string;
}

const Modal = ({ children, trigger, title, description }: ModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogContent className="space-y-4">{children}</DialogContent>
        <DialogFooter>
          <DialogTrigger asChild>
            <button variant="outline" onClick={() => {
              // Close dialog logic would go here
            }}>
              Close
            </button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { Modal };