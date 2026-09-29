import { Icon as UiIcon, type IconName } from "@repo/ui/icons";
import type { ComponentStatus, ServerStats } from "@/lib/api/system";
import { useI18n, interpolate } from "@/components/i18n-provider";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

function formatUptime(seconds: string): string {
  const s = Math.floor(parseFloat(seconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Usage bar. Neutral foreground tone by default - amber when the value
 * climbs past 70%, red past 90%. The colour is a function of the data,
 * not arbitrary per-metric branding.
 */
function UsageBar({ pct }: { pct: number }) {
  const tone =
    pct >= 90
      ? "bg-danger-solid"
      : pct >= 70
        ? "bg-warning-solid"
        : "bg-foreground/60";
  return (
    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-3">
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${tone}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  pct,
}: {
  icon: IconName;
  label: string;
  value: string;
  sub?: string;
  pct?: number;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-6">
      <div className="flex min-w-0 items-center gap-2 mb-4">
        <UiIcon name={Icon}
          className="size-4 shrink-0 text-muted-foreground"
        />
        <span className="min-w-0 text-xs font-medium text-muted-foreground break-words">
          {label}
        </span>
      </div>
      <p className="min-h-9 font-mono text-[28px] leading-9 font-semibold text-foreground tracking-tight tabular-nums whitespace-nowrap">
        {value}
      </p>
      {sub && (
        <p className="min-h-10 text-xs leading-5 text-muted-foreground mt-2 tabular-nums">{sub}</p>
      )}
      {pct != null && <UsageBar pct={pct} />}
    </div>
  );
}

export function OverviewTab({
  stats,
  components,
  checking,
}: {
  stats: ServerStats | null;
  components: ComponentStatus[];
  checking: boolean;
  monitorConnected: boolean;
  monitorError: string | null;
  onReconnectMonitor: () => void;
}) {
  const { t } = useI18n();
  const healthyCount = components.filter((c) => c.healthy).length;
  const totalCount = components.length;
  const allHealthy = totalCount > 0 && healthyCount === totalCount;
  const unhealthyCount = totalCount - healthyCount;

  const memPct =
    stats && stats.memTotal > 0
      ? Math.round((stats.memUsed / stats.memTotal) * 100)
      : null;
  const diskPct =
    stats && stats.diskTotal > 0
      ? Math.round((stats.diskUsed / stats.diskTotal) * 100)
      : null;

  return (
    <div className="@container/metrics space-y-4">
      {/* Follow the available column width, not the viewport: a wide screen can
          still leave a narrow overview beside the connection card. Each card
          keeps enough room for its label and an unbroken uptime value. */}
      <div className="grid grid-cols-1 gap-4 @min-[28rem]/metrics:grid-cols-2 @min-[56rem]/metrics:grid-cols-4">
        <StatCard
          icon={"cpu"}
          label={t.servers.overview.cpu}
          value={stats ? `${stats.cpu}%` : "-"}
          sub={
            stats
              ? interpolate(t.servers.overview.load, {
                  load1: String(stats.load1),
                  load5: String(stats.load5),
                  load15: String(stats.load15),
                })
              : undefined
          }
          pct={stats?.cpu ?? undefined}
        />
        <StatCard
          icon={"memory"}
          label={t.servers.overview.memory}
          value={stats ? `${memPct}%` : "-"}
          sub={
            stats
              ? interpolate(t.servers.overview.usageOf, {
                  used: formatBytes(stats.memUsed),
                  total: formatBytes(stats.memTotal),
                })
              : undefined
          }
          pct={memPct ?? undefined}
        />
        <StatCard
          icon={"hard-drive"}
          label={t.servers.overview.disk}
          value={stats ? `${diskPct}%` : "-"}
          sub={
            stats
              ? interpolate(t.servers.overview.usageOf, {
                  used: formatBytes(stats.diskUsed),
                  total: formatBytes(stats.diskTotal),
                })
              : undefined
          }
          pct={diskPct ?? undefined}
        />
        <StatCard
          icon={"clock"}
          label={t.servers.overview.uptime}
          value={stats ? formatUptime(stats.uptime) : "-"}
          sub={stats ? t.servers.overview.sinceLastBoot : undefined}
        />
      </div>

      {/* Components - inline-header card pattern matching the rest of
          the dashboard. No icon-in-emerald-circle; just a small muted
          icon next to the heading. */}
      <div className="min-w-0 rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <UiIcon name="activity"
              className="size-4 text-muted-foreground shrink-0"
            />
            <h2 className="font-semibold text-foreground text-sm">
              {t.servers.overview.components}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {checking
              ? t.servers.overview.checking
              : allHealthy
                ? t.servers.overview.allOperational
                : totalCount > 0
                  ? interpolate(t.servers.overview.unhealthyOf, {
                      unhealthy: String(unhealthyCount),
                      total: String(totalCount),
                    })
                  : t.servers.overview.noData}
          </span>
        </div>

        {checking && totalCount === 0 ? (
          <div className="flex items-center justify-center py-8">
            <UiIcon name="spinner" className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : totalCount > 0 ? (
          <div className="divide-y divide-border -mx-6">
            {components.map((comp) => (
              <div
                key={comp.name}
                className="grid grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-6 py-3"
              >
                {comp.healthy ? (
                  <UiIcon name="check-circle"
                    className="size-4 text-success shrink-0"
                  />
                ) : (
                  <UiIcon name="x-circle"
                    className="size-4 text-danger shrink-0"
                  />
                )}
                <span className="min-w-0 text-sm text-foreground break-words">
                  {comp.label || comp.name}
                </span>
                {comp.version && (
                  <span className="col-start-2 row-start-2 min-w-0 w-fit max-w-full break-all text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-1 rounded">
                    v{comp.version}
                  </span>
                )}
                <span
                  className={`col-start-3 row-start-1 text-xs font-medium ${
                    comp.healthy
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  {comp.healthy ? t.servers.overview.healthy : t.servers.overview.unhealthy}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t.servers.overview.noHealthData}
          </p>
        )}
      </div>
    </div>
  );
}
