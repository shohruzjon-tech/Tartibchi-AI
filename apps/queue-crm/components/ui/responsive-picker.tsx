"use client";

import { ReactNode, useState, useEffect } from "react";
import { Modal } from "./modal";
import { Drawer } from "./drawer";

interface ResponsivePickerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}

export function ResponsivePicker({
  isOpen,
  onClose,
  title,
  children,
}: ResponsivePickerProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} title={title} side="right">
        {children}
      </Drawer>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      {children}
    </Modal>
  );
}
