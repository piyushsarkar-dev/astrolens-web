"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ImageRecord } from "@/lib/types";

export type BackupItemStatus =
  | "pending"
  | "uploading"
  | "success"
  | "error"
  | "cancelled";

export type BackupItem = {
  id: string;
  file: File;
  name: string;
  previewUrl: string;
  status: BackupItemStatus;
  progress: number; // 0 - 100
  error?: string;
  record?: ImageRecord;
};

type BackupContextType = {
  queue: BackupItem[];
  currentIndex: number;
  currentPreviewUrl: string | null;
  overallProgress: number; // 0 - 100
  isBackingUp: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  isExpanded: boolean;
  visible: boolean;
  estimatedTimeText: string;
  statusHeadline: string;
  counterText: string;
  toggleExpanded: () => void;
  startBackup: (
    files: File[],
    onImageSuccess?: (image: ImageRecord) => void,
  ) => void;
  stopBackup: () => void;
  dismiss: () => void;
};

const BackupContext = createContext<BackupContextType | null>(null);

const formatEstimatedTime = (
  totalItems: number,
  completedItems: number,
  elapsedMs: number,
): string => {
  const remaining = totalItems - completedItems;
  if (remaining <= 0) return "few seconds";
  if (completedItems === 0) {
    const estSec = Math.max(2, remaining * 3);
    if (estSec < 60) return `${estSec} seconds`;
    const estMin = Math.ceil(estSec / 60);
    return `${estMin} minute${estMin > 1 ? "s" : ""}`;
  }

  const msPerItem = elapsedMs / completedItems;
  const estRemainingSec = Math.round((remaining * msPerItem) / 1000);

  if (estRemainingSec <= 5) return "few seconds";
  if (estRemainingSec < 60) return `${estRemainingSec} seconds`;
  const estMin = Math.ceil(estRemainingSec / 60);
  return `${estMin} minute${estMin > 1 ? "s" : ""}`;
};

export const BackupProvider = ({ children }: { children: React.ReactNode }) => {
  const [queue, setQueue] = useState<BackupItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [estimatedTimeText, setEstimatedTimeText] = useState<string>("about 1 minute");

  const stopRequestedRef = useRef<boolean>(false);
  const currentAbortRef = useRef<(() => void) | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const createdUrlsRef = useRef<string[]>([]);
  const startTimeRef = useRef<number>(0);

  // Clean up created object URLs when unmounting
  useEffect(() => {
    const urls = createdUrlsRef.current;
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const dismiss = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setVisible(false);
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const stopBackup = useCallback(() => {
    stopRequestedRef.current = true;
    if (currentAbortRef.current) {
      currentAbortRef.current();
      currentAbortRef.current = null;
    }
    setIsCancelled(true);
    setIsBackingUp(false);
    setQueue((prev) =>
      prev.map((item) =>
        item.status === "pending" || item.status === "uploading"
          ? { ...item, status: "cancelled" }
          : item,
      ),
    );

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, 5000);
  }, []);

  const startBackup = useCallback(
    (files: File[], onImageSuccess?: (image: ImageRecord) => void) => {
      if (!files || files.length === 0) return;

      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }

      stopRequestedRef.current = false;
      setIsCancelled(false);
      setIsCompleted(false);
      setCurrentIndex(0);
      setOverallProgress(0);
      setIsExpanded(false);
      setVisible(true);
      setIsBackingUp(true);
      startTimeRef.current = Date.now();

      const newItems: BackupItem[] = files.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        createdUrlsRef.current.push(previewUrl);
        return {
          id: crypto.randomUUID(),
          file,
          name: file.name || "image",
          previewUrl,
          status: "pending",
          progress: 0,
        };
      });

      setQueue(newItems);

      // Upload sequentially with real-time XHR progress
      void (async () => {
        const total = newItems.length;

        for (let i = 0; i < total; i++) {
          if (stopRequestedRef.current) break;

          setCurrentIndex(i);

          const elapsed = Date.now() - startTimeRef.current;
          const timeText = formatEstimatedTime(total, i, elapsed);
          setEstimatedTimeText(timeText);

          setQueue((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: "uploading", progress: 0 } : item,
            ),
          );

          try {
            const uploadedRecord = await new Promise<ImageRecord>(
              (resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const formData = new FormData();
                formData.append("file", newItems[i].file);

                currentAbortRef.current = () => {
                  xhr.abort();
                };

                xhr.upload.onprogress = (event) => {
                  if (event.lengthComputable && total > 0) {
                    const itemPct = Math.round((event.loaded / event.total) * 100);
                    setQueue((prev) =>
                      prev.map((item, idx) =>
                        idx === i ? { ...item, progress: itemPct } : item,
                      ),
                    );
                    const overall = Math.min(
                      99,
                      Math.round(((i + event.loaded / event.total) / total) * 100),
                    );
                    setOverallProgress(overall);
                  }
                };

                xhr.onload = () => {
                  currentAbortRef.current = null;
                  try {
                    const json = JSON.parse(xhr.responseText) as {
                      data?: ImageRecord[];
                      error?: string;
                    };
                    if (xhr.status >= 200 && xhr.status < 300 && json?.data?.[0]) {
                      resolve(json.data[0]);
                    } else {
                      reject(
                        new Error(
                          json?.error || `Upload failed (HTTP ${xhr.status}).`,
                        ),
                      );
                    }
                  } catch {
                    reject(new Error(`Upload failed (HTTP ${xhr.status}).`));
                  }
                };

                xhr.onerror = () => {
                  currentAbortRef.current = null;
                  reject(new Error("Network connection error."));
                };

                xhr.onabort = () => {
                  currentAbortRef.current = null;
                  reject(new Error("Upload stopped."));
                };

                xhr.open("POST", "/api/images");
                xhr.send(formData);
              },
            );

            if (stopRequestedRef.current) break;

            setQueue((prev) =>
              prev.map((item, idx) =>
                idx === i
                  ? {
                      ...item,
                      status: "success",
                      progress: 100,
                      record: uploadedRecord,
                    }
                  : item,
              ),
            );

            if (onImageSuccess) {
              onImageSuccess(uploadedRecord);
            }

            const overall = Math.round(((i + 1) / total) * 100);
            setOverallProgress(overall);
          } catch (err) {
            if (stopRequestedRef.current) break;
            const errMsg =
              err instanceof Error ? err.message : "Failed to upload.";
            setQueue((prev) =>
              prev.map((item, idx) =>
                idx === i
                  ? { ...item, status: "error", progress: 0, error: errMsg }
                  : item,
              ),
            );
            const overall = Math.round(((i + 1) / total) * 100);
            setOverallProgress(overall);
          }
        }

        setIsBackingUp(false);

        if (stopRequestedRef.current) {
          setIsCancelled(true);
        } else {
          setIsCompleted(true);
          setOverallProgress(100);

          if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
          dismissTimerRef.current = setTimeout(() => {
            setVisible(false);
          }, 4500);
        }
      })();
    },
    [],
  );

  const currentItem = queue[currentIndex] || queue[0] || null;
  const currentPreviewUrl = currentItem ? currentItem.previewUrl : null;

  const totalCount = queue.length;
  const completedCount = queue.filter(
    (item) => item.status === "success" || item.status === "error",
  ).length;

  const counterText =
    isCompleted
      ? `${totalCount} of ${totalCount}`
      : isCancelled
        ? `${completedCount} of ${totalCount}`
        : `${Math.min(currentIndex + 1, totalCount)} of ${totalCount}`;

  let statusHeadline = "";
  if (isCompleted) {
    statusHeadline =
      totalCount === 1
        ? "Backup complete"
        : `All ${totalCount} items backed up`;
  } else if (isCancelled) {
    statusHeadline = `Backup stopped (${completedCount} of ${totalCount})`;
  } else {
    if (totalCount === 1) {
      statusHeadline = "Backing up your photo";
    } else {
      statusHeadline = `Backing up your items will take about ${estimatedTimeText}`;
    }
  }

  return (
    <BackupContext.Provider
      value={{
        queue,
        currentIndex,
        currentPreviewUrl,
        overallProgress,
        isBackingUp,
        isCompleted,
        isCancelled,
        isExpanded,
        visible,
        estimatedTimeText,
        statusHeadline,
        counterText,
        toggleExpanded,
        startBackup,
        stopBackup,
        dismiss,
      }}>
      {children}
    </BackupContext.Provider>
  );
};

export const useBackup = () => {
  const context = useContext(BackupContext);
  if (!context) {
    throw new Error("useBackup must be used within a BackupProvider");
  }
  return context;
};
