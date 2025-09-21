/**
 * Safely remove a child node from its parent
 * Avoids "The node to be removed is not a child of this node" errors
 */
export function safeRemoveChild(parent: Node, child: Node): void {
  try {
    if (parent && child && parent.contains(child)) {
      parent.removeChild(child);
    }
  } catch (error) {
    // Silently ignore if node is already removed
    console.warn("Failed to remove child node:", error);
  }
}

/**
 * Safely append a child node to a parent
 */
export function safeAppendChild(parent: Node, child: Node): void {
  try {
    if (parent && child) {
      parent.appendChild(child);
    }
  } catch (error) {
    console.warn("Failed to append child node:", error);
  }
}
