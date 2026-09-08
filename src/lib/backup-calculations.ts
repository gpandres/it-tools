export type BackupSizeUnit = "GB" | "TB";
export type BackupSpeedUnit = "Gbps" | "MB/s";

export type BackupMetrics = {
  fullBackupMB: number;
  incrementalMB: number;
  fullTimeSeconds: number;
  incrementalTimeSeconds: number;
  storageNeededTB: number;
  recommendedStorageTB: number;
};

export function calculateBackupMetrics(input: {
  size: number;
  sizeUnit: BackupSizeUnit;
  changeRatePercent: number;
  transferSpeed: number;
  speedUnit: BackupSpeedUnit;
  retentionDays: number;
  efficiencyPercent: number;
  overheadPercent: number;
}): BackupMetrics {
  const size = Math.max(0, Number.isFinite(input.size) ? input.size : 0);
  const changeRate = Math.min(100, Math.max(0, Number.isFinite(input.changeRatePercent) ? input.changeRatePercent : 0)) / 100;
  const speed = Math.max(0, Number.isFinite(input.transferSpeed) ? input.transferSpeed : 0);
  const retention = Math.max(0, Math.floor(Number.isFinite(input.retentionDays) ? input.retentionDays : 0));
  const efficiency = Math.min(100, Math.max(1, Number.isFinite(input.efficiencyPercent) ? input.efficiencyPercent : 1)) / 100;
  const overhead = Math.max(0, Number.isFinite(input.overheadPercent) ? input.overheadPercent : 0) / 100;
  const sizeInMB = input.sizeUnit === "TB" ? size * 1024 * 1024 : size * 1024;
  const speedInMBps = input.speedUnit === "Gbps" ? speed * 125 : speed;
  const effectiveSpeedInMBps = speedInMBps * efficiency;
  const incrementalMB = sizeInMB * changeRate;
  const storageNeededTB = (sizeInMB + incrementalMB * retention) / (1024 * 1024);

  return {
    fullBackupMB: sizeInMB,
    incrementalMB,
    fullTimeSeconds: effectiveSpeedInMBps > 0 ? sizeInMB / effectiveSpeedInMBps : 0,
    incrementalTimeSeconds: effectiveSpeedInMBps > 0 ? incrementalMB / effectiveSpeedInMBps : 0,
    storageNeededTB,
    recommendedStorageTB: storageNeededTB * (1 + overhead)
  };
}
