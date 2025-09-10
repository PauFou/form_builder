export type EmbedType = "fullpage" | "inline" | "popover" | "drawer";

export interface EmbedOptions {
  type: EmbedType;
  container?: string | HTMLElement;
  trigger?: string | HTMLElement;
  position?: "left" | "right" | "center";
  size?: "small" | "medium" | "large" | "fullscreen";
  backdrop?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  animation?: "none" | "fade" | "slide";
  animationDuration?: number;
  zIndex?: number;
  className?: string;
}

export interface EmbedInstance {
  open: () => void;
  close: () => void;
  destroy: () => void;
  isOpen: () => boolean;
}
