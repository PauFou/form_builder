import type { EmbedOptions, EmbedInstance } from "./embed-types";
import { injectStyles } from "../styles";

export class PopoverEmbed implements EmbedInstance {
  private container: HTMLElement;
  private backdrop: HTMLElement | null = null;
  private popover: HTMLElement | null = null;
  private trigger: HTMLElement | null = null;
  private isOpenState = false;
  private options: EmbedOptions;
  private formElement: HTMLElement;

  constructor(formElement: HTMLElement, options: EmbedOptions) {
    this.formElement = formElement;
    this.options = {
      backdrop: true,
      closeOnBackdropClick: true,
      closeOnEsc: true,
      showCloseButton: true,
      animation: "fade",
      animationDuration: 300,
      zIndex: 9999,
      position: "center",
      size: "medium",
      ...options,
    };

    // Create container
    this.container = document.createElement("div");
    this.container.className = `fr-embed fr-embed-popover ${options.className || ""}`;
    this.container.setAttribute("role", "dialog");
    this.container.setAttribute("aria-modal", "true");

    // Setup trigger
    if (options.trigger) {
      this.trigger =
        typeof options.trigger === "string"
          ? document.querySelector(options.trigger)
          : options.trigger;

      if (this.trigger) {
        this.trigger.addEventListener("click", this.open);
      }
    }

    this.setup();
  }

  private setup() {
    // Create backdrop if enabled
    if (this.options.backdrop) {
      this.backdrop = document.createElement("div");
      this.backdrop.className = "fr-embed-backdrop";
      this.backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: ${this.options.zIndex};
        opacity: 0;
        transition: opacity ${this.options.animationDuration}ms ease;
      `;

      if (this.options.closeOnBackdropClick) {
        this.backdrop.addEventListener("click", this.close);
      }
    }

    // Create popover container
    this.popover = document.createElement("div");
    this.popover.className = `fr-embed-popover-content fr-embed-${this.options.size}`;
    this.popover.style.cssText = `
      position: fixed;
      z-index: ${(this.options.zIndex || 9999) + 1};
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      max-height: 90vh;
      overflow: auto;
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.95);
      transition: all ${this.options.animationDuration}ms ease;
    `;

    // Set size
    const sizes = {
      small: { width: "400px", maxWidth: "95vw" },
      medium: { width: "600px", maxWidth: "95vw" },
      large: { width: "800px", maxWidth: "95vw" },
      fullscreen: { width: "95vw", height: "95vh", maxWidth: "1200px" },
    };

    const sizeStyle = sizes[this.options.size || "medium"];
    Object.assign(this.popover.style, sizeStyle);

    // Position
    if (this.options.position === "center") {
      this.popover.style.top = "50%";
      this.popover.style.left = "50%";
    }

    // Add close button
    if (this.options.showCloseButton) {
      const closeBtn = document.createElement("button");
      closeBtn.className = "fr-embed-close";
      closeBtn.innerHTML = "×";
      closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        border: none;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        transition: all 0.2s;
      `;
      closeBtn.addEventListener("click", this.close);
      this.popover.appendChild(closeBtn);
    }

    // Add form content
    const content = document.createElement("div");
    content.className = "fr-embed-content";
    content.style.padding = "24px";
    content.appendChild(this.formElement);
    this.popover.appendChild(content);

    // Inject styles
    injectStyles();

    // Setup keyboard handler
    if (this.options.closeOnEsc) {
      this.handleKeydown = this.handleKeydown.bind(this);
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && this.isOpenState) {
      this.close();
    }
  }

  open = () => {
    if (this.isOpenState) return;

    // Append to body
    if (this.backdrop) {
      document.body.appendChild(this.backdrop);
    }
    if (this.popover) {
      document.body.appendChild(this.popover);
    }

    // Force reflow
    this.popover?.offsetHeight;

    // Animate in
    requestAnimationFrame(() => {
      if (this.backdrop) {
        this.backdrop.style.opacity = "1";
      }
      if (this.popover) {
        this.popover.style.opacity = "1";
        this.popover.style.transform = "translate(-50%, -50%) scale(1)";
      }
    });

    // Add keyboard listener
    if (this.options.closeOnEsc) {
      document.addEventListener("keydown", this.handleKeydown);
    }

    // Focus management
    const firstInput = this.popover?.querySelector<HTMLElement>("input, textarea, select, button");
    firstInput?.focus();

    this.isOpenState = true;

    // Emit open event
    this.popover?.dispatchEvent(new CustomEvent("fr:embed:open"));
  };

  close = () => {
    if (!this.isOpenState) return;

    // Animate out
    if (this.backdrop) {
      this.backdrop.style.opacity = "0";
    }
    if (this.popover) {
      this.popover.style.opacity = "0";
      this.popover.style.transform = "translate(-50%, -50%) scale(0.95)";
    }

    // Remove after animation
    setTimeout(() => {
      if (this.backdrop?.parentElement) {
        this.backdrop.parentElement.removeChild(this.backdrop);
      }
      if (this.popover?.parentElement) {
        this.popover.parentElement.removeChild(this.popover);
      }
    }, this.options.animationDuration);

    // Remove keyboard listener
    if (this.options.closeOnEsc) {
      document.removeEventListener("keydown", this.handleKeydown);
    }

    // Return focus to trigger
    this.trigger?.focus();

    this.isOpenState = false;

    // Emit close event
    this.popover?.dispatchEvent(new CustomEvent("fr:embed:close"));
  };

  destroy = () => {
    this.close();

    // Remove trigger listener
    if (this.trigger) {
      this.trigger.removeEventListener("click", this.open);
    }

    // Clear references
    this.backdrop = null;
    this.popover = null;
    this.trigger = null;
  };

  isOpen = () => this.isOpenState;
}
