/* ============================================================
   ui.jsx — shared chrome / primitives
============================================================ */

/* A pixel-arrow icon drawn as inline SVG — feels chunky enough */
function PixelArrowIcon({ size = 14, dim = false }) {
  const c = dim ? "#8a7b65" : "#1b1612";
  const s = dim ? "#c4b89b" : "#4a3f33";
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 10 13" style={{shapeRendering: "crispEdges"}}>
      {/* head */}
      <rect x="4" y="0" width="2" height="1" fill={c} />
      <rect x="3" y="1" width="4" height="1" fill={c} />
      <rect x="2" y="2" width="6" height="1" fill={c} />
      <rect x="3" y="3" width="4" height="1" fill={c} />
      {/* shaft */}
      <rect x="4" y="4" width="2" height="6" fill={s} />
      {/* fletch */}
      <rect x="3" y="10" width="1" height="2" fill={c} />
      <rect x="6" y="10" width="1" height="2" fill={c} />
      <rect x="2" y="11" width="1" height="1" fill={c} />
      <rect x="7" y="11" width="1" height="1" fill={c} />
    </svg>
  );
}

function ArrowsCount({ remaining, total }) {
  return (
    <div className="row gap-2" style={{alignItems:"flex-end"}}>
      <div className="row gap-1" aria-label={`${remaining} arrows remaining`}>
        {Array.from({length: total}, (_, i) => (
          <PixelArrowIcon key={i} size={12} dim={i >= remaining} />
        ))}
      </div>
      <span className="mono" style={{fontSize: 11, color: "var(--ink-3)"}}>
        {remaining}/{total}
      </span>
    </div>
  );
}

function StatChip({ label, value, mono = true, danger = false }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "baseline", gap: 6,
      padding: "5px 11px",
      border: "1px solid var(--rule-strong)",
      borderRadius: 6,
      background: "rgba(255,255,255,0.3)",
    }}>
      <span className="label" style={{color: "var(--ink-3)"}}>{label}</span>
      <span className={mono ? "mono" : ""} style={{
        fontWeight: 600,
        fontSize: 14,
        color: danger ? "var(--accent)" : "var(--ink)",
      }}>{value}</span>
    </div>
  );
}

function TitleBar({ title, subtitle, right }) {
  return (
    <div className="row" style={{
      padding: "18px 24px",
      borderBottom: "1px solid var(--rule)",
      gap: 16,
    }}>
      <div className="col gap-1 grow">
        <div className="display" style={{fontSize: 26, color: "var(--ink)"}}>{title}</div>
        {subtitle && <div style={{fontSize: 13, color: "var(--ink-3)"}}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

/* A small in-game-style "address bar" header for each screen */
function ScreenChrome({ path, badge, children, fullbleed }) {
  return (
    <div className="col" style={{
      width: "100%", height: "100%",
      background: fullbleed ? "transparent" : "var(--bg)",
      position: "relative",
    }}>
      <div className="row" style={{
        padding: "10px 20px",
        gap: 12,
        borderBottom: "1px solid rgba(241,230,205,0.06)",
        background: "rgba(6, 12, 13, 0.8)",
        backdropFilter: "blur(6px)",
        zIndex: 30,
        position: "relative",
      }}>
        <div className="row gap-2">
          <div style={{width: 10, height: 10, borderRadius: 5, background: "#3a2a26"}} />
          <div style={{width: 10, height: 10, borderRadius: 5, background: "#3a322a"}} />
          <div style={{width: 10, height: 10, borderRadius: 5, background: "#2a3a30"}} />
        </div>
        <div className="grow" style={{textAlign: "center"}}>
          <span className="mono" style={{
            fontSize: 12,
            color: "rgba(241,230,205,0.65)",
            background: "rgba(241,230,205,0.04)",
            padding: "4px 14px",
            borderRadius: 6,
            border: "1px solid rgba(241,230,205,0.06)",
          }}>{path}</span>
        </div>
        {badge && (
          <div className="mono" style={{
            fontSize: 11,
            color: "var(--accent)",
            letterSpacing: ".14em",
            textTransform: "uppercase",
          }}>{badge}</div>
        )}
      </div>
      <div className="grow" style={{position: "relative", overflow: "hidden"}}>
        {children}
      </div>
    </div>
  );
}

/* Logo wordmark */
function Wordmark({ scale = 1 }) {
  return (
    <div style={{
      fontFamily: "var(--font-display)",
      fontSize: 56 * scale,
      lineHeight: 1,
      letterSpacing: "-0.01em",
      color: "var(--parchment)",
      textShadow: "0 4px 18px rgba(0,0,0,0.45)",
    }}>
      Hunt the <span style={{
        fontStyle: "italic",
        color: "var(--accent)",
        textShadow: "0 2px 6px rgba(196,74,58,0.4)",
      }}>Wumpus</span>
    </div>
  );
}

Object.assign(window, {
  PixelArrowIcon, ArrowsCount, StatChip, TitleBar, ScreenChrome, Wordmark,
});
