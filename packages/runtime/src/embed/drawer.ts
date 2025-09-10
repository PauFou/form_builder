import type { EmbedOptions, EmbedInstance } from "./embed-types";
import { injectStyles } from "../styles";

export class DrawerEmbed implements EmbedInstance {
  private container: HTMLElement;
  private backdrop: HTMLElement | null = null;
  private drawer: HTMLElement | null = null;
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
      animation: "slide",
      animationDuration: 300,
      zIndex: 9999,
      position: "right",
      size: "medium",
      ...options,
    };

    // Create container
    this.container = document.createElement("div");
    this.container.className = `fr-embed fr-embed-drawer ${options.className || ""}`;
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
        this.trigger.setAttribute("aria-haspopup", "dialog");
      }
    }

    this.setup();
  }

  private setup() {
    // Create backdrop
    if (this.options.backdrop) {
      this.backdrop = document.createElement("div");
      this.backdrop.className = "fr-embed-backdrop";
      this.backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        z-index: ${this.options.zIndex};
        opacity: 0;
        transition: opacity ${this.options.animationDuration}ms ease;
      `;

      if (this.options.closeOnBackdropClick) {
        this.backdrop.addEventListener("click", this.close);
      }
    }

    // Create drawer
    this.drawer = document.createElement("div");
    this.drawer.className = `fr-embed-drawer-content fr-embed-${this.options.size}`;

    const sizes = {
      small: "320px",
      medium: "480px",
      large: "640px",
      fullscreen: "100%",
    };

    const isLeft = this.options.position === "left";
    const translateX = isLeft ? "-100%" : "100%";

    this.drawer.style.cssText = `
      position: fixed;
      top: 0;
      ${isLeft ? "left" : "right"}: 0;
      width: ${sizes[this.options.size || "medium"]};
      max-width: 95vw;
      height: 100vh;
      background: white;
      z-index: ${(this.options.zIndex || 9999) + 1};
      overflow-y: auto;
      transform: translateX(${translateX});
      transition: transform ${this.options.animationDuration}ms ease;
      box-shadow: ${isLeft ? "2px" : "-2px"} 0 24px rgba(0, 0, 0, 0.15);
    `;

    // Add header
    const header = document.createElement("div");
    header.className = "fr-embed-header";
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      background: white;
      z-index: 1;
    `;

    // Add close button
    if (this.options.showCloseButton) {
      const closeBtn = document.createElement("button");
      closeBtn.className = "fr-embed-close";
      closeBtn.setAttribute("aria-label", "Close form");
      closeBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      closeBtn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: none;
        background: none;
        cursor: pointer;
        border-radius: 8px;
        transition: background 0.2s;
        margin-left: auto;
      `;
      closeBtn.addEventListener("click", this.close);
      header.appendChild(closeBtn);
    }

    this.drawer.appendChild(header);

    // Add form content
    const content = document.createElement("div");
    content.className = "fr-embed-content";
    content.style.cssText = `
      padding: 24px;
      padding-bottom: 48px;
    `;
    content.appendChild(this.formElement);
    this.drawer.appendChild(content);

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

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    // Append to body
    if (this.backdrop) {
      document.body.appendChild(this.backdrop);
    }
    if (this.drawer) {
      document.body.appendChild(this.drawer);
    }

    // Force reflow
    this.drawer?.offsetHeight;

    // Animate in
    requestAnimationFrame(() => {
      if (this.backdrop) {
        this.backdrop.style.opacity = "1";
      }
      if (this.drawer) {
        this.drawer.style.transform = "translateX(0)";
      }
    });

    // Add keyboard listener
    if (this.options.closeOnEsc) {
      document.addEventListener("keydown", this.handleKeydown);
    }

    // Focus management - focus first input
    setTimeout(() => {
      const firstInput = this.drawer?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), textarea, select, button'
      );
      firstInput?.focus();
    }, this.options.animationDuration);

    this.isOpenState = true;

    // Emit open event
    this.drawer?.dispatchEvent(new CustomEvent("fr:embed:open"));
  };

  close = () => {
    if (!this.isOpenState) return;

    const isLeft = this.options.position === "left";
    const translateX = isLeft ? "-100%" : "100%";

    // Animate out
    if (this.backdrop) {
      this.backdrop.style.opacity = "0";
    }
    if (this.drawer) {
      this.drawer.style.transform = `translateX(${translateX})`;
    }

    // Remove after animation
    setTimeout(() => {
      // Restore body scroll
      document.body.style.overflow = "";

      if (this.backdrop?.parentElement) {
        this.backdrop.parentElement.removeChild(this.backdrop);
      }
      if (this.drawer?.parentElement) {
        this.drawer.parentElement.removeChild(this.drawer);
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
    this.drawer?.dispatchEvent(new CustomEvent("fr:embed:close"));
  };

  destroy = () => {
    this.close();

    // Remove trigger listener
    if (this.trigger) {
      this.trigger.removeEventListener("click", this.open);
    }

    // Clear references
    this.backdrop = null;
    this.drawer = null;
    this.trigger = null;
  };

  isOpen = () => this.isOpenState;
}
