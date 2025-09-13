import { useEffect, useState } from "react";
import { ActionMessage } from "../../components/ui/action-toast";

export function useKeyboardActionListener() {
  const [message, setMessage] = useState<ActionMessage | null>(null);

  useEffect(() => {
    const handleKeyboardAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ type: string }>;
      const actionType = customEvent.detail.type;

      const newMessage: ActionMessage = {
        id: `${Date.now()}`,
        type: actionType as ActionMessage["type"],
        timestamp: Date.now(),
      };

      setMessage(newMessage);
    };

    window.addEventListener("keyboard-action", handleKeyboardAction);
    return () => window.removeEventListener("keyboard-action", handleKeyboardAction);
  }, []);

  return { message };
}