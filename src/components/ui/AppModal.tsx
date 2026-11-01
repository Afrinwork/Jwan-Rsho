import { useEffect, useId } from "react";
import { Modal, ModalProps } from "react-native";
import { create } from "zustand";

// Time a closing Modal needs to be gone for good (its fade/slide-out).
const CLOSE_GAP_MS = 400;

type ModalSlot = {
  // The one Modal on screen, null = none.
  shownId: string | null;
  // When the last one was closed, so the next waits for it to be gone.
  closedAt: number;
  claim: (id: string) => void;
  release: (id: string) => void;
};

const useModalSlot = create<ModalSlot>((set) => ({
  shownId: null,
  closedAt: 0,
  claim: (id) => set((state) => (state.shownId === null ? { shownId: id } : state)),
  release: (id) => set((state) => (state.shownId === id ? { shownId: null, closedAt: Date.now() } : state)),
}));

// Drop-in for React Native's Modal that never lets two of them overlap: a
// Modal opening on top of another one, or while another is still closing,
// left an invisible native window on Android that swallowed every touch —
// the app looked frozen until it was restarted (e.g. the driver's "arrived?"
// question popping up over an open sheet). One that wants to open meanwhile
// waits until the other is closed and gone.
export function AppModal({ visible = true, ...props }: ModalProps) {
  const id = useId();
  const shownId = useModalSlot((state) => state.shownId);
  const closedAt = useModalSlot((state) => state.closedAt);
  const claim = useModalSlot((state) => state.claim);
  const release = useModalSlot((state) => state.release);

  useEffect(() => {
    if (!visible) {
      release(id);
      return;
    }
    if (shownId !== null) return;
    const timer = setTimeout(() => claim(id), Math.max(0, closedAt + CLOSE_GAP_MS - Date.now()));
    return () => clearTimeout(timer);
  }, [visible, shownId, closedAt, id, claim, release]);

  useEffect(() => () => release(id), [id, release]);

  return <Modal {...props} visible={visible && shownId === id} />;
}
