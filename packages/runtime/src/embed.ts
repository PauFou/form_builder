// Standalone embed script for forms (<5KB gzipped)
(function () {
  "use strict";

  interface EmbedOptions {
    formId: string;
    container?: string | HTMLElement;
    mode?: "inline" | "popup" | "drawer";
    theme?: Record<string, string>;
    onReady?: () => void;
    onSubmit?: (data: any) => void;
  }

  // Minimal loader
  function loadForm(options: EmbedOptions) {
    const containerId =
      typeof options.container === "string"
        ? options.container
        : "forms-embed-" + Math.random().toString(36).substr(2, 9);

    let container: HTMLElement | null;
    if (typeof options.container === "string") {
      container = document.querySelector(options.container);
    } else if (options.container instanceof HTMLElement) {
      container = options.container;
    } else {
      container = document.getElementById(containerId);
    }

    if (!container) {
      console.error("Form container not found");
      return;
    }

    // Show loading state
    container.innerHTML =
      '<div style="text-align:center;padding:20px;color:#6b7280;">Loading form...</div>';

    // Load form config
    const configUrl = `https://api.forms.app/v1/forms/${options.formId}/embed`;

    fetch(configUrl)
      .then((res) => res.json())
      .then((config) => {
        // Load runtime if not already loaded
        if (!window.FormRuntime) {
          const script = document.createElement("script");
          script.src = "https://cdn.forms.app/runtime/v1/index.js";
          script.async = true;
          script.onload = () => initializeForm(config, container!, options);
          document.head.appendChild(script);

          // Load styles
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://cdn.forms.app/runtime/v1/styles.css";
          document.head.appendChild(link);
        } else {
          initializeForm(config, container!, options);
        }
      })
      .catch((err) => {
        container!.innerHTML =
          '<div style="text-align:center;padding:20px;color:#ef4444;">Failed to load form</div>';
        console.error("Failed to load form:", err);
      });
  }

  // Initialize form with config
  function initializeForm(config: any, container: HTMLElement, options: EmbedOptions) {
    // Apply custom theme
    if (options.theme) {
      config.theme = { ...config.theme, ...options.theme };
    }

    // Create form instance
    const form = new window.FormRuntime(config);

    // Set up event handlers
    if (options.onReady) {
      form.on("mount", options.onReady);
    }

    if (options.onSubmit) {
      form.on("submit", options.onSubmit);
    }

    // Handle different modes
    if (options.mode === "popup") {
      createPopup(container, form);
    } else if (options.mode === "drawer") {
      createDrawer(container, form);
    } else {
      // Inline mode
      form.mount(container);
    }
  }

  // Create popup modal
  function createPopup(container: HTMLElement, form: any) {
    const modal = document.createElement("div");
    modal.className = "forms-modal";
    modal.innerHTML = `
      <div class="forms-modal-backdrop"></div>
      <div class="forms-modal-content">
        <button class="forms-modal-close">&times;</button>
        <div class="forms-modal-body"></div>
      </div>
    `;

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .forms-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .forms-modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.5);
      }
      .forms-modal-content {
        position: relative;
        background: white;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      }
      .forms-modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
      }
      .forms-modal-close:hover {
        background: #f3f4f6;
      }
      .forms-modal-body {
        padding: 32px;
      }
    `;
    document.head.appendChild(style);

    // Mount form
    const body = modal.querySelector(".forms-modal-body") as HTMLElement;
    form.mount(body);

    // Handle close
    modal.querySelector(".forms-modal-close")?.addEventListener("click", () => {
      form.unmount();
      modal.remove();
    });

    modal.querySelector(".forms-modal-backdrop")?.addEventListener("click", () => {
      form.unmount();
      modal.remove();
    });

    document.body.appendChild(modal);
  }

  // Create side drawer
  function createDrawer(container: HTMLElement, form: any) {
    const drawer = document.createElement("div");
    drawer.className = "forms-drawer";
    drawer.innerHTML = `
      <div class="forms-drawer-backdrop"></div>
      <div class="forms-drawer-content">
        <button class="forms-drawer-close">&times;</button>
        <div class="forms-drawer-body"></div>
      </div>
    `;

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .forms-drawer {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
      }
      .forms-drawer-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.5);
      }
      .forms-drawer-content {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        background: white;
        width: 100%;
        max-width: 480px;
        overflow-y: auto;
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
      }
      .forms-drawer.open .forms-drawer-content {
        transform: translateX(0);
      }
      .forms-drawer-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
      }
      .forms-drawer-close:hover {
        background: #f3f4f6;
      }
      .forms-drawer-body {
        padding: 32px;
        padding-top: 64px;
      }
      @media (max-width: 640px) {
        .forms-drawer-content {
          max-width: 100%;
        }
      }
    `;
    document.head.appendChild(style);

    // Mount form
    const body = drawer.querySelector(".forms-drawer-body") as HTMLElement;
    form.mount(body);

    // Show drawer
    document.body.appendChild(drawer);
    requestAnimationFrame(() => {
      drawer.classList.add("open");
    });

    // Handle close
    const closeDrawer = () => {
      drawer.classList.remove("open");
      setTimeout(() => {
        form.unmount();
        drawer.remove();
      }, 300);
    };

    drawer.querySelector(".forms-drawer-close")?.addEventListener("click", closeDrawer);
    drawer.querySelector(".forms-drawer-backdrop")?.addEventListener("click", closeDrawer);
  }

  // Auto-init forms on page load
  function autoInit() {
    const forms = document.querySelectorAll("[data-forms-id]");
    forms.forEach((el) => {
      const formId = el.getAttribute("data-forms-id");
      const mode =
        (el.getAttribute("data-forms-mode") as "inline" | "popup" | "drawer") || "inline";
      if (formId) {
        loadForm({
          formId,
          container: el as HTMLElement,
          mode,
        });
      }
    });
  }

  // Public API
  const Forms = {
    load: loadForm,
    version: "1.0.0",
  };

  // Expose globally
  (window as any).Forms = Forms;

  // Auto-initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }
})();
