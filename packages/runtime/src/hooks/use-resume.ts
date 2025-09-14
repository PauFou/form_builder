import { useEffect, useState } from "react";
import { OfflineService } from "../services/offline-service";
import type { RuntimeConfig } from "../types";

interface ResumeState {
  hasResumableData: boolean;
  resumeUrl: string | null;
  lastUpdated: Date | null;
  loading: boolean;
}

export function useResume(config: RuntimeConfig): ResumeState {
  const [state, setState] = useState<ResumeState>({
    hasResumableData: false,
    resumeUrl: null,
    lastUpdated: null,
    loading: true,
  });

  useEffect(() => {
    if (!config.enableOffline) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    const checkResumableData = async () => {
      try {
        const offlineService = new OfflineService(config);
        const savedState = await offlineService.getState();

        if (savedState && !savedState.data.completedAt) {
          const resumeUrl = new URL(window.location.href);
          resumeUrl.searchParams.set("form", config.formId);
          resumeUrl.searchParams.set("resume", savedState.respondentKey);

          setState({
            hasResumableData: true,
            resumeUrl: resumeUrl.toString(),
            lastUpdated: savedState.data.metadata?.lastUpdated
              ? new Date(savedState.data.metadata.lastUpdated)
              : null,
            loading: false,
          });
        } else {
          setState({
            hasResumableData: false,
            resumeUrl: null,
            lastUpdated: null,
            loading: false,
          });
        }

        await offlineService.destroy();
      } catch (error) {
        console.error("Failed to check resumable data:", error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    checkResumableData();
  }, [config]);

  return state;
}

export function createResumeLink(formId: string, respondentKey: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set("form", formId);
  url.searchParams.set("resume", respondentKey);
  return url.toString();
}
