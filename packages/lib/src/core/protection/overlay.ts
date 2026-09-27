import type { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../ipc-channels";
import type { BlankSignal, DataDrmLevel, DetectionEvent } from "../types";

export function sendBlankSignal(target: BrowserWindow, signal: BlankSignal): void {
  target.webContents.send(IPC_CHANNELS.BLANK_ELEMENTS, signal);
}

export function sendUnblankSignal(target: BrowserWindow, level: DataDrmLevel | "all"): void {
  target.webContents.send(IPC_CHANNELS.UNBLANK_ELEMENTS, { level });
}

export function blankSignalForDetection(event: DetectionEvent): BlankSignal {
  return { level: "all", reason: event.category };
}
