import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateBackupMetrics } from "../src/lib/backup-calculations.ts";

test("backup calculations apply throughput efficiency and storage overhead", () => {
  const metrics = calculateBackupMetrics({
    size: 1,
    sizeUnit: "TB",
    changeRatePercent: 10,
    transferSpeed: 1,
    speedUnit: "Gbps",
    retentionDays: 10,
    efficiencyPercent: 80,
    overheadPercent: 20
  });

  assert.equal(metrics.fullBackupMB, 1024 * 1024);
  assert.equal(metrics.incrementalMB, 1024 * 102.4);
  assert.equal(metrics.storageNeededTB, 2);
  assert.equal(metrics.recommendedStorageTB, 2.4);
  assert.equal(metrics.fullTimeSeconds, (1024 * 1024) / 100);
});

test("backup calculations clamp invalid operational inputs", () => {
  const metrics = calculateBackupMetrics({
    size: -1,
    sizeUnit: "GB",
    changeRatePercent: 500,
    transferSpeed: 0,
    speedUnit: "MB/s",
    retentionDays: -10,
    efficiencyPercent: 0,
    overheadPercent: -20
  });

  assert.deepEqual(metrics, {
    fullBackupMB: 0,
    incrementalMB: 0,
    fullTimeSeconds: 0,
    incrementalTimeSeconds: 0,
    storageNeededTB: 0,
    recommendedStorageTB: 0
  });
});
