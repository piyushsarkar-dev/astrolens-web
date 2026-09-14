"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  clearStoredQueue,
  getStoredQueue,
  removeStoredItem,
  saveStoredQueue,
  type StoredBackupItem,
} from "@/lib/backupStorage";
import type { ImageRecord } from "@/lib/types";

export type BackupItemStatus =
  | "pending"
  | "uploading"
  | "syncing"
  | "success"
  | "error"
  | "cancelled";

export type BackupItem = {
  id: string;
  file: File | Blob;
  name: string;
  size: number;
  previewUrl: string;
  status: BackupItemStatus;
  loadedBytes: number;
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
  speedText: string;
  dataTransferText: string;
  isSyncingCloud: boolean;
  toggleExpanded: () => void;
  cancelItem: (id: string) => void;
  openUploadPicker: () => void;
  subscribeToUploadedImage: (
    callback: (image: ImageRecord) => void,
  ) => () => void;
  startBackup: (
    files: (File | Blob)[],
    onImageSuccess?: (image: ImageRecord) => void,
  ) => void;
  stopBackup: () => void;
  dismiss: () => void;
};

const BackupContext = createContext<BackupContextType | null>(null);

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const val = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${val} ${units[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return "";
  return `${formatBytes(bytesPerSec)}/s`;
}

export const BackupProvider = ({ children }: { children: React.ReactNode }) => {
  const [queue, setQueue] = useState<BackupItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [estimatedTimeText, setEstimatedTimeText] = useState<string>("calculating…");
  const [speedText, setSpeedText] = useState<string>("");
  const [dataTransferText, setDataTransferText] = useState<string>("");
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  const stopRequestedRef = useRef<boolean>(false);
  const currentAbortRef = useRef<(() => void) | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const createdUrlsRef = useRef<string[]>([]);
  const queueRef = useRef<BackupItem[]>([]);
  queueRef.current = queue;

  const imageSubscribersRef = useRef<Set<(image: ImageRecord) => void>>(
    new Set(),
  );
  const globalFileInputRef = useRef<HTMLInputElement | null>(null);

  const subscribeToUploadedImage = useCallback(
    (callback: (image: ImageRecord) => void) => {
      imageSubscribersRef.current.add(callback);
      return () => {
        imageSubscribersRef.current.delete(callback);
      };
    },
    [],
  );

  const openUploadPicker = useCallback(() => {
    if (globalFileInputRef.current) {
      globalFileInputRef.current.value = "";
      globalFileInputRef.current.click();
    }
  }, []);

  // Prevent accidental tab close/refresh during active upload
  useEffect(() => {
    if (!isBackingUp) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isBackingUp]);

  // Clean up blob preview URLs on unmount
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
    setIsSyncingCloud(false);
    setSpeedText("");

    setQueue((prev) =>
      prev.map((item) =>
        item.status === "pending" ||
        item.status === "uploading" ||
        item.status === "syncing"
          ? { ...item, status: "cancelled" }
          : item,
      ),
    );

    void clearStoredQueue();

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, 5000);
  }, []);

  const cancelItem = useCallback((id: string) => {
    const currentItem = queueRef.current[currentIndex];
    if (currentItem && currentItem.id === id) {
      if (currentAbortRef.current) {
        currentAbortRef.current();
        currentAbortRef.current = null;
      }
    } else {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "cancelled" } : item,
        ),
      );
      void removeStoredItem(id);
    }
  }, [currentIndex]);

  // Internal upload execution logic with fluid non-jumping progress ticker
  const executeUploadQueue = useCallback(
    async (
      items: BackupItem[],
      startIndex: number,
      onImageSuccess?: (image: ImageRecord) => void,
    ) => {
      const totalItems = items.length;
      const totalBytes = items.reduce((sum, item) => sum + item.size, 0);

      let accumulatedBytesCompleted = 0;
      for (let k = 0; k < startIndex; k++) {
        if (items[k].status === "success") {
          accumulatedBytesCompleted += items[k].size;
        }
      }

      const overallStartTime = Date.now();

      for (let i = startIndex; i < totalItems; i++) {
        if (stopRequestedRef.current) break;

        setCurrentIndex(i);
        const currentItem = items[i];

        setQueue((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: "uploading", loadedBytes: 0, progress: 0 }
              : item,
          ),
        );

        let currentDisplay = 0;
        let targetPct = 3; // Initial small start
        let isCloudSyncing = false;
        let isItemDone = false;
        let tickerInterval: NodeJS.Timeout | null = null;

        try {
          const uploadedRecord = await new Promise<ImageRecord>(
            (resolve, reject) => {
              const xhr = new XMLHttpRequest();
              const formData = new FormData();
              const filename =
                currentItem.name ||
                (currentItem.file instanceof File ? currentItem.file.name : "image.jpg");
              formData.append("file", currentItem.file, filename);

              currentAbortRef.current = () => {
                xhr.abort();
              };

              // Fluid high-frequency continuous ticker (runs every 25ms = 40 updates/sec)
              // This guarantees the counter counts: 1, 2, 3, 4, 5... and NEVER jumps directly 60% or 80%!
              tickerInterval = setInterval(() => {
                if (stopRequestedRef.current) {
                  if (tickerInterval) clearInterval(tickerInterval);
                  return;
                }

                if (currentDisplay < targetPct) {
                  const diff = targetPct - currentDisplay;
                  // Smoothly increment by 1 or 2 without jumping
                  const step = diff > 30 ? 2 : 1;
                  currentDisplay = Math.min(targetPct, currentDisplay + step);
                } else if (!isItemDone && isCloudSyncing && currentDisplay < 96) {
                  // While ImgBB is syncing in cloud, smoothly cruise 85% -> 96%
                  currentDisplay += 1;
                }

                const currentBytes = Math.round((currentItem.size * currentDisplay) / 100);
                const totalLoadedSoFar = accumulatedBytesCompleted + currentBytes;
                const overallPct = Math.min(
                  isItemDone ? 100 : 98,
                  Math.round((totalLoadedSoFar / Math.max(1, totalBytes)) * 100),
                );

                // Speed & ETA calculations
                const elapsedSec = Math.max(0.1, (Date.now() - overallStartTime) / 1000);
                const rollingSpeed = totalLoadedSoFar / elapsedSec;
                if (rollingSpeed > 50) {
                  setSpeedText(formatSpeed(rollingSpeed));
                  const remainingBytes = Math.max(0, totalBytes - totalLoadedSoFar);
                  const secRemaining = Math.ceil(remainingBytes / rollingSpeed);
                  if (secRemaining <= 3) setEstimatedTimeText("a few seconds");
                  else if (secRemaining < 60) setEstimatedTimeText(`${secRemaining} seconds`);
                  else {
                    const min = Math.ceil(secRemaining / 60);
                    setEstimatedTimeText(`${min} minute${min > 1 ? "s" : ""}`);
                  }
                }

                setDataTransferText(
                  `${formatBytes(totalLoadedSoFar)} of ${formatBytes(totalBytes)}`,
                );
                setOverallProgress(overallPct);

                setQueue((prev) =>
                  prev.map((item, idx) =>
                    idx === i
                      ? {
                          ...item,
                          loadedBytes: currentBytes,
                          progress: currentDisplay,
                          status: isItemDone
                            ? "success"
                            : isCloudSyncing
                              ? "syncing"
                              : "uploading",
                        }
                      : item,
                  ),
                );
              }, 25);

              xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                  const ratio = event.loaded / Math.max(1, event.total);
                  // Map client-to-server byte transfer to 0% -> 85%
                  targetPct = Math.min(85, Math.max(targetPct, Math.round(ratio * 85)));

                  if (event.loaded >= event.total) {
                    isCloudSyncing = true;
                    setIsSyncingCloud(true);
                    targetPct = Math.max(targetPct, 88);
                  }
                }
              };

              xhr.onload = () => {
                currentAbortRef.current = null;
                setIsSyncingCloud(false);
                isCloudSyncing = false;

                try {
                  const json = JSON.parse(xhr.responseText) as {
                    data?: ImageRecord[];
                    error?: string;
                  };
                  if (xhr.status >= 200 && xhr.status < 300 && json?.data?.[0]) {
                    const record = json.data[0];
                    isItemDone = true;
                    targetPct = 100;

                    // Let display smoothly glide to 100% before finishing
                    const checkInterval = setInterval(() => {
                      if (currentDisplay >= 100) {
                        clearInterval(checkInterval);
                        if (tickerInterval) clearInterval(tickerInterval);
                        resolve(record);
                      }
                    }, 20);
                  } else {
                    if (tickerInterval) clearInterval(tickerInterval);
                    reject(
                      new Error(
                        json?.error || `Upload failed (HTTP ${xhr.status}).`,
                      ),
                    );
                  }
                } catch {
                  if (tickerInterval) clearInterval(tickerInterval);
                  reject(new Error(`Upload failed (HTTP ${xhr.status}).`));
                }
              };

              xhr.onerror = () => {
                if (tickerInterval) clearInterval(tickerInterval);
                currentAbortRef.current = null;
                setIsSyncingCloud(false);
                reject(new Error("Network connection error."));
              };

              xhr.onabort = () => {
                if (tickerInterval) clearInterval(tickerInterval);
                currentAbortRef.current = null;
                setIsSyncingCloud(false);
                reject(new Error("Upload stopped."));
              };

              xhr.open("POST", "/api/images");
              xhr.send(formData);
            },
          );

          if (stopRequestedRef.current) break;

          accumulatedBytesCompleted += currentItem.size;
          const currentOverall = Math.round(
            (accumulatedBytesCompleted / Math.max(1, totalBytes)) * 100,
          );
          setOverallProgress(Math.min(100, currentOverall));

          setQueue((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    status: "success",
                    loadedBytes: item.size,
                    progress: 100,
                    record: uploadedRecord,
                  }
                : item,
            ),
          );

          void removeStoredItem(currentItem.id);

          if (onImageSuccess) {
            onImageSuccess(uploadedRecord);
          }
          for (const callback of imageSubscribersRef.current) {
            try {
              callback(uploadedRecord);
            } catch (subscriberError) {
              console.error("Subscriber notification error:", subscriberError);
            }
          }
        } catch (err) {
          if (tickerInterval) clearInterval(tickerInterval);
          if (stopRequestedRef.current) break;
          const errMsg =
            err instanceof Error ? err.message : "Failed to upload.";
          accumulatedBytesCompleted += currentItem.size;

          setQueue((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    status: "error",
                    progress: 0,
                    error: errMsg,
                  }
                : item,
            ),
          );

          void removeStoredItem(currentItem.id);
        }
      }

      setIsBackingUp(false);
      setIsSyncingCloud(false);
      setSpeedText("");

      if (stopRequestedRef.current) {
        setIsCancelled(true);
        void clearStoredQueue();
      } else {
        setIsCompleted(true);
        setOverallProgress(100);
        setDataTransferText(
          `${formatBytes(totalBytes)} of ${formatBytes(totalBytes)} (100%)`,
        );
        void clearStoredQueue();

        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = setTimeout(() => {
          setVisible(false);
        }, 4500);
      }
    },
    [],
  );

  const startBackup = useCallback(
    (
      files: (File | Blob)[],
      onImageSuccess?: (image: ImageRecord) => void,
    ) => {
      if (!files || files.length === 0) return;

      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }

      stopRequestedRef.current = false;
      setIsCancelled(false);
      setIsCompleted(false);
      setIsSyncingCloud(false);
      setCurrentIndex(0);
      setOverallProgress(0);
      setIsExpanded(false);
      setVisible(true);
      setIsBackingUp(true);
      setSpeedText("");

      const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
      setDataTransferText(`0 B of ${formatBytes(totalBytes)}`);
      setEstimatedTimeText("calculating…");

      const newItems: BackupItem[] = files.map((file, order) => {
        const previewUrl = URL.createObjectURL(file);
        createdUrlsRef.current.push(previewUrl);
        const name =
          file instanceof File ? file.name : `image_${order + 1}.jpg`;
        return {
          id: crypto.randomUUID(),
          file,
          name,
          size: file.size,
          previewUrl,
          status: "pending",
          loadedBytes: 0,
          progress: 0,
        };
      });

      setQueue(newItems);

      // Persist queue in IndexedDB so accidental refresh can resume
      const storedItems: StoredBackupItem[] = newItems.map((item, idx) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        type: item.file.type || "image/jpeg",
        file: item.file,
        order: idx,
        status: "pending",
        addedAt: Date.now(),
      }));
      void saveStoredQueue(storedItems);

      // Run sequential real-time upload with fluid animation ticker
      void executeUploadQueue(newItems, 0, onImageSuccess);
    },
    [executeUploadQueue],
  );

  // Check on mount if an interrupted backup from a refresh exists in IndexedDB
  useEffect(() => {
    void (async () => {
      try {
        const pending = await getStoredQueue();
        if (pending && pending.length > 0) {
          const validItems: BackupItem[] = pending.map((stored) => {
            const previewUrl = URL.createObjectURL(stored.file);
            createdUrlsRef.current.push(previewUrl);
            return {
              id: stored.id,
              file: stored.file,
              name: stored.name,
              size: stored.size,
              previewUrl,
              status: "pending",
              loadedBytes: 0,
              progress: 0,
            };
          });

          if (validItems.length > 0) {
            setVisible(true);
            setIsBackingUp(true);
            setQueue(validItems);
            const totalBytes = validItems.reduce((acc, f) => acc + f.size, 0);
            setDataTransferText(`Resuming 0 B of ${formatBytes(totalBytes)}`);
            void executeUploadQueue(validItems, 0);
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [executeUploadQueue]);

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
  } else if (isSyncingCloud) {
    statusHeadline = "Syncing with ImgBB cloud…";
  } else {
    if (speedText) {
      statusHeadline = `Backing up: ${speedText}`;
    } else if (estimatedTimeText !== "calculating…") {
      statusHeadline = `Backing up will take about ${estimatedTimeText}`;
    } else {
      statusHeadline = totalCount === 1 ? "Backing up your photo" : "Backing up your items…";
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
        speedText,
        dataTransferText,
        isSyncingCloud,
        toggleExpanded,
        cancelItem,
        openUploadPicker,
        subscribeToUploadedImage,
        startBackup,
        stopBackup,
        dismiss,
      }}>
      <input
        ref={globalFileInputRef}
        type="file"
        accept="image/*"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: "none" }}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length === 0) return;
          const imageFiles = files
            .filter((file) => file.type.startsWith("image/"))
            .slice(0, 30);
          if (imageFiles.length > 0) {
            startBackup(imageFiles);
          }
          event.target.value = "";
        }}
      />
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
