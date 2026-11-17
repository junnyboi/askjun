/**
 * NewChatDialog — asks before the conversation is cleared.
 * Opened by the "New chat" button and by Escape.
 */
import { useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function NewChatDialog({ open, onOpenChange, onConfirm }: NewChatDialogProps) {
  // The dialog has no trigger element (Escape opens it too), so remember what had
  // focus and hand it back when the dialog is cancelled.
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={() => {
          restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          const previous = restoreFocusRef.current;
          // After a confirmed reset the old element is gone; Home focuses the new input instead
          if (previous?.isConnected) {
            event.preventDefault();
            previous.focus();
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Start a new chat?</AlertDialogTitle>
          <AlertDialogDescription>
            This clears the current conversation. It can't be brought back.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="hover:bg-muted">Keep chatting</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>New chat</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
