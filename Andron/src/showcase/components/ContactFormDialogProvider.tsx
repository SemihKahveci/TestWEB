"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import ContactFormDialog from "@/showcase/components/ContactFormDialog";

const OpenContactFormContext = createContext<(() => void) | null>(null);

export function useOpenContactFormDialog() {
  const open = useContext(OpenContactFormContext);
  if (!open) {
    throw new Error("useOpenContactFormDialog, ContactFormDialogProvider içinde kullanılmalıdır.");
  }
  return open;
}

export function ContactFormDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openDialog = useCallback(() => setOpen(true), []);

  return (
    <OpenContactFormContext.Provider value={openDialog}>
      {children}
      <ContactFormDialog open={open} onOpenChange={setOpen} />
    </OpenContactFormContext.Provider>
  );
}
