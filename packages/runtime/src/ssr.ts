import type { FormSchema } from "./types";
import { generateStyles } from "./styles";

interface SSROptions {
  schema: FormSchema;
  locale?: string;
  nonce?: string;
}

export function renderFormHTML({ schema, locale = "en", nonce: _nonce }: SSROptions): string {
  // const _styles = generateStyles(schema.theme); // TODO: use for styling

  // Generate initial HTML structure
  const allBlocks = schema.pages?.flatMap((page) => page.blocks || []) || [];
  const firstBlock = allBlocks[0];
  if (!firstBlock) {
    return "";
  }

  const html = `
    <div class="fr-container" data-form-id="${schema.id}" lang="${locale}">
      ${
        schema.settings?.showProgressBar
          ? `
        <div class="fr-progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
          <div class="fr-progress-fill" style="width: 0%"></div>
        </div>
      `
          : ""
      }
      
      <form class="fr-form">
        <div class="fr-step">
          ${renderField(firstBlock)}
        </div>
        
        <div class="fr-actions">
          <button type="submit" class="fr-btn fr-btn-primary">
            Next
          </button>
        </div>
      </form>
    </div>
  `;

  return html.trim();
}

function renderField(block: any): string {
  const required = block.required ? '<span class="fr-required" aria-label="required">*</span>' : "";
  const description = block.description
    ? `<p id="${block.id}-desc" class="fr-description">${escapeHtml(block.description)}</p>`
    : "";

  let input = "";

  switch (block.type) {
    case "text":
    case "email":
    case "phone":
    case "number":
      input = `
        <input
          type="${block.type === "number" ? "number" : block.type}"
          id="${block.id}"
          name="${block.id}"
          class="fr-input"
          aria-label="${escapeHtml(block.question)}"
          ${block.description ? `aria-describedby="${block.id}-desc"` : ""}
          ${block.required ? 'aria-required="true"' : ""}
          ${block.properties?.placeholder ? `placeholder="${escapeHtml(block.properties.placeholder)}"` : ""}
        />
      `;
      break;

    case "long_text":
      input = `
        <textarea
          id="${block.id}"
          name="${block.id}"
          class="fr-textarea"
          rows="${block.properties?.rows || 4}"
          aria-label="${escapeHtml(block.question)}"
          ${block.description ? `aria-describedby="${block.id}-desc"` : ""}
          ${block.required ? 'aria-required="true"' : ""}
          ${block.properties?.placeholder ? `placeholder="${escapeHtml(block.properties.placeholder)}"` : ""}
        ></textarea>
      `;
      break;

    case "dropdown":
    case "select":
      input = `
        <select
          id="${block.id}"
          name="${block.id}"
          class="fr-select"
          aria-label="${escapeHtml(block.question)}"
          ${block.description ? `aria-describedby="${block.id}-desc"` : ""}
          ${block.required ? 'aria-required="true"' : ""}
        >
          <option value="">Choose an option</option>
          ${block.properties?.options
            ?.map((opt: string) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`)
            .join("")}
        </select>
      `;
      break;

    default:
      input = `
        <input
          type="text"
          id="${block.id}"
          name="${block.id}"
          class="fr-input"
          aria-label="${escapeHtml(block.question)}"
          ${block.description ? `aria-describedby="${block.id}-desc"` : ""}
          ${block.required ? 'aria-required="true"' : ""}
        />
      `;
  }

  return `
    <div class="fr-field">
      <label for="${block.id}" class="fr-label">
        ${escapeHtml(block.question)}${required}
      </label>
      ${description}
      ${input}
    </div>
  `;
}

function escapeHtml(str: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = str;
    return div.innerHTML;
  }

  // Fallback for Node.js environments
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function generateHydrationScript(schema: FormSchema, config: any, nonce?: string): string {
  const configJson = JSON.stringify({
    ...config,
    schema: undefined, // Don't duplicate schema in config
  });

  return `
    <script${nonce ? ` nonce="${nonce}"` : ""}>
      window.__FORM_SCHEMA__ = ${JSON.stringify(schema)};
      window.__FORM_CONFIG__ = ${configJson};
      
      // Progressive enhancement check
      if ('IntersectionObserver' in window && 'fetch' in window) {
        window.__FORM_READY__ = true;
      }
    </script>
  `.trim();
}

export function renderFormStyles(theme?: any, nonce?: string): string {
  const styles = generateStyles(theme);

  return `
    <style${nonce ? ` nonce="${nonce}"` : ""}>
      ${styles}
    </style>
  `.trim();
}
