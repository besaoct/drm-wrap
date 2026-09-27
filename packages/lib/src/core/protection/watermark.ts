import type { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../ipc-channels";
import type { DrmConfig, WatermarkPayload } from "../types";

export function buildWatermarkText(identity: string, when: Date = new Date()): string {
  return `${identity} • ${when.toISOString()}`;
}

export function getWatermarkPayload(config: DrmConfig, identity: string): WatermarkPayload {
  return {
    enabled: config.features.dynamicWatermark,
    text: buildWatermarkText(identity),
    opacity: config.features.watermarkOpacity,
  };
}

export function sendWatermarkUpdate(target: BrowserWindow, payload: WatermarkPayload): void {
  target.webContents.send(IPC_CHANNELS.UPDATE_WATERMARK, payload);
}

export function startWatermarkRefresh(
  target: BrowserWindow,
  config: DrmConfig,
  identity: string,
  intervalMs = 15000
): () => void {
  sendWatermarkUpdate(target, getWatermarkPayload(config, identity));

  const interval = setInterval(() => {
    sendWatermarkUpdate(target, getWatermarkPayload(config, identity));
  }, intervalMs);

  return () => clearInterval(interval);
}
