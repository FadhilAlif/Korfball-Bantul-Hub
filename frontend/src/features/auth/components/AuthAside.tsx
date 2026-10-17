const PREVIEW_STATS = [
  { label: "Attendance", value: "94.2%", delta: "Selasa & Sabtu" },
  { label: "Format", value: "K8 / K4", delta: "Live Stats" },
  { label: "Team EFF", value: "+18", delta: "Box Score" },
] as const;

const PREVIEW_ACTIVITY = [
  { user: "guntur.12", action: "recorded Shoot Made (B1 04:56)", tone: "success" },
  { user: "rukmi.01", action: "self check-in Latihan Selasa", tone: "info" },
  { user: "coach.rofi", action: "finalized match Klaten vs Bantul", tone: "warning" },
] as const;

const TONE_DOT_CLASSES: Record<string, string> = {
  success: "bg-success",
  info: "bg-primary",
  warning: "bg-warning",
};

function MiniAvatar({ name }: { name: string }) {
  const hue = name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17;
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-semibold shrink-0"
      style={{
        background: `oklch(0.78 0.10 ${hue % 360})`,
        color: `oklch(0.28 0.10 ${hue % 360})`,
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function AuthAside() {
  return (
    <aside className="auth-aside auth-aside-bg relative overflow-hidden border-l border-border p-12 flex flex-col justify-between">
      <div className="mt-6 bg-card border border-border rounded-[14px] shadow-lg p-[18px] rotate-[-1.2deg]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success inline-block" />
            <span className="text-xs font-semibold">Korfball Bantul Live Hub</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">MVP v1.0</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {PREVIEW_STATS.map(({ label, value, delta }) => (
            <div key={label} className="p-2.5 border border-border rounded-[10px] bg-muted">
              <div className="text-[10.5px] text-muted-foreground uppercase tracking-widest">{label}</div>
              <div className="text-lg font-semibold tracking-tight mt-0.5">{value}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{delta}</div>
            </div>
          ))}
        </div>

        <div className="mt-3.5 flex flex-col gap-1.5">
          {PREVIEW_ACTIVITY.map(({ user, action, tone }) => (
            <div key={user} className="flex items-center gap-2.5 text-xs">
              <MiniAvatar name={user} />
              <span className="flex-1 text-muted-foreground">
                <b className="text-foreground font-semibold">{user}</b> {action}
              </span>
              <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${TONE_DOT_CLASSES[tone]}`} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="m-0 mb-2 text-2xl font-semibold tracking-tight max-w-[420px] leading-snug text-foreground">
          Presensi Kehadiran &amp; Live Game Statistics Korfball Bantul.
        </h2>
        <p className="m-0 text-sm text-muted-foreground max-w-[440px] leading-relaxed">
          Catat statistik pertandingan secara real-time dari pinggir lapangan dan pantau kehadiran latihan rutin setiap
          Selasa &amp; Sabtu dalam satu platform terpadu.
        </p>
      </div>
    </aside>
  );
}
