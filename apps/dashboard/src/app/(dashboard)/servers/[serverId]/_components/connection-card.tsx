"use client";

import { Icon as UiIcon } from "@repo/ui/icons";

import * as CountryFlags from "country-flag-icons/react/3x2";
import { useI18n } from "@/components/i18n-provider";
import { BlurIp } from "@/components/BlurIp";
import { cloudflareSshUrl } from "@repo/core";

/** ISO-3166-1 alpha-2 → flag component (same source the servers list uses). */
const FLAGS = CountryFlags as Record<string, React.ComponentType<{ title?: string; className?: string }>>;

interface ConnectionServer {
  sshHost: string;
  sshPort?: number | null;
  sshUser?: string | null;
  sshAuthMethod?: string | null;
  sshTransport?: "direct" | "cloudflare";
  /** ISO country for the host IP; null for hostnames/private IPs. */
  country?: string | null;
}

/** The server's SSH connection summary. Shared by the server-detail right sidebar
 *  and the Services tab (shown until a migrate scan replaces it with the config). */
export function ServerConnectionCard({ server }: { server: ConnectionServer }) {
  const { t } = useI18n();
  const d = t.servers.detail;
  const isCloudflare = server.sshTransport === "cloudflare";
  let accessUrl: string | undefined;
  if (isCloudflare) {
    try { accessUrl = cloudflareSshUrl(server.sshHost); } catch { /* invalid legacy data has no external action */ }
  }
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <UiIcon name="server" className="size-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground text-sm">{d.connection}</h3>
      </div>
      <div className="space-y-3">
        <Row icon={<UiIcon name="globe" className="size-4 text-muted-foreground" />} label={d.host}>
          {/* Flag sits WITH the host it describes, rather than in the page header
              next to the title. */}
          <span className="flex items-center justify-end gap-2 min-w-0">
            {(() => {
              const Flag = server.country ? FLAGS[server.country] : undefined;
              return Flag ? (
                <Flag
                  title={server.country ?? undefined}
                  className="h-3 w-auto shrink-0 rounded-[2px] ring-1 ring-border/50"
                />
              ) : null;
            })()}
            <span className="min-w-0 text-sm font-medium text-foreground font-mono break-all tabular-nums">
              <BlurIp>{server.sshHost}</BlurIp>
            </span>
          </span>
        </Row>
        {!isCloudflare && <Row icon={<UiIcon name="network" className="size-4 text-muted-foreground" />} label={d.port}>
          <span className="min-w-0 break-all text-sm font-medium text-foreground font-mono tabular-nums">{server.sshPort ?? 22}</span>
        </Row>}
        <Row icon={<UiIcon name="user" className="size-4 text-muted-foreground" />} label={d.user}>
          <span className="min-w-0 break-all text-sm font-medium text-foreground font-mono tabular-nums">{server.sshUser ?? "root"}</span>
        </Row>

        <div className="h-px bg-border/60 my-2" />

        <Row icon={<UiIcon name="key" className="size-4 text-muted-foreground" />} label={d.auth}>
          <span className="min-w-0 break-words text-sm font-medium text-foreground">
            {server.sshAuthMethod === "agent" ? t.servers.form.agent : server.sshAuthMethod === "key" ? d.authSshKey : d.authPassword}
          </span>
        </Row>
        {isCloudflare && <Row icon={<UiIcon name="cloud" className="size-4 text-warning" />} label={t.servers.sshTransport.label}>
          <span className="min-w-0 break-words text-sm font-medium text-foreground">Cloudflare Access</span>
        </Row>}
        {accessUrl && <a href={accessUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground">
          {t.servers.sshTransport.openAccess}
          <UiIcon name="external-link" className="size-3.5" />
        </a>}
      </div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-center gap-4 [&>:last-child]:text-end">
      <div className="flex min-w-0 items-center gap-2">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-muted/60 flex items-center justify-center">{icon}</div>
        <span className="min-w-0 break-words text-sm text-muted-foreground">{label}</span>
      </div>
      {children}
    </div>
  );
}
