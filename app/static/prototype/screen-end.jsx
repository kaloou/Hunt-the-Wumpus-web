/* ============================================================
   screen-end.jsx — Game Over (cinematic), Win (cinematic-first),
   Leaderboard, Map Reveal.
============================================================ */

/* -----------------------------------------------------------
   GameOver — cinematic, two variants:
     - "wumpus": devoured by the Wumpus
     - "arrows": missed your one and only arrow
     - "pit":  fell into a pit (catch-all for the third loss)
----------------------------------------------------------- */
function GameOverScreen({ cause, run, go }) {
  // Animate wumpus (or broken-arrow) entrance
  const [phase, setPhase] = useState("intro"); // intro -> stats
  useEffect(() => {
    const id = setTimeout(() => setPhase("stats"), 1100);
    return () => clearTimeout(id);
  }, []);

  // shared stats
  const seconds = run?.seconds ?? 0;
  const timeStr = `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  const tilesSeen = (run?.finalGame?.grid.flat() || []).filter(c => c.seen).length;

  if (cause === "wumpus") return <DevouredGameOver run={run} go={go} phase={phase} timeStr={timeStr} tilesSeen={tilesSeen} />;
  if (cause === "arrows") return <MissedGameOver  run={run} go={go} phase={phase} timeStr={timeStr} tilesSeen={tilesSeen} />;
  return <PitGameOver run={run} go={go} phase={phase} timeStr={timeStr} tilesSeen={tilesSeen} />;
}

/* Wumpus devoured — heavy red wash, big wumpus sprite, blood spatter */
function DevouredGameOver({ run, go, phase, timeStr, tilesSeen }) {
  const wumpusFrame = useFrameAnim(WUMPUS_FRAMES, 6, true);
  return (
    <div data-screen-label="05 Game Over · Devoured" style={{
      position: "relative", width: "100%", height: "100%",
      background: "linear-gradient(180deg, #1c0a08 0%, #060c0d 100%)",
      overflow: "hidden",
    }}>
      {/* veined red vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(196, 74, 58, 0.35) 0%, transparent 55%)",
        animation: "pulse-vignette 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      {/* claw marks SVG corners */}
      <ClawMarks />
      <DustField count={28} />

      <div className="col" style={{
        position: "relative", zIndex: 2,
        width: "100%", height: "100%",
        alignItems: "center", justifyContent: "center",
        padding: 32, gap: 28,
      }}>
        {/* Wumpus sprite, looming */}
        <div style={{
          width: 220, height: 220,
          backgroundImage: `url("assets/wumpus/${String(wumpusFrame).padStart(2,"0")}.png")`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "center",
          imageRendering: "pixelated",
          filter: "drop-shadow(0 8px 32px rgba(196, 74, 58, 0.6))",
          animation: phase === "intro" ? "wumpus-loom 1.1s cubic-bezier(0.22, 1, 0.36, 1)" : "wumpus-breathe 2.4s ease-in-out infinite",
        }} />

        <div className="col gap-2" style={{textAlign: "center"}}>
          <div className="mono" style={{
            fontSize: 11, color: "var(--accent)", letterSpacing: ".3em",
          }}>· DEVOURED ·</div>
          <div className="display" style={{
            fontSize: 78, lineHeight: 1, color: "var(--parchment)",
            letterSpacing: "-0.02em",
            textShadow: "0 0 24px rgba(196, 74, 58, 0.6)",
          }}>
            The Wumpus <span style={{fontStyle: "italic", color: "var(--accent)"}}>found you first</span>
          </div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 18,
            color: "rgba(241, 230, 205, 0.65)",
            marginTop: 6,
          }}>
            teeth like cave-mouths · you did not finish your scream
          </div>
        </div>

        {phase === "stats" && (
          <GameOverFooter
            statsTone="danger"
            stats={[
              { label: "lasted", value: timeStr },
              { label: "moves",  value: run?.moves ?? 0 },
              { label: "tiles seen", value: `${tilesSeen}/${ROW*COL}` },
            ]}
            go={go}
          />
        )}
      </div>
    </div>
  );
}

/* Arrow miss — broken arrow drama, parchment-edged tear */
function MissedGameOver({ run, go, phase, timeStr, tilesSeen }) {
  return (
    <div data-screen-label="05 Game Over · Missed" style={{
      position: "relative", width: "100%", height: "100%",
      background: "linear-gradient(180deg, #0d1517 0%, #050a0b 100%)",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 0%, rgba(6,12,13,0.7) 75%)",
        pointerEvents: "none",
      }} />
      <DustField count={20} />

      <div className="col" style={{
        position: "relative", zIndex: 2,
        width: "100%", height: "100%",
        alignItems: "center", justifyContent: "center",
        padding: 32, gap: 28,
      }}>
        {/* big broken arrow SVG */}
        <BrokenArrow phase={phase} />

        <div className="col gap-2" style={{textAlign: "center", maxWidth: 720}}>
          <div className="mono" style={{
            fontSize: 11, color: "var(--accent)", letterSpacing: ".3em",
          }}>· ONE ARROW · ONE CHANCE · GONE ·</div>
          <div className="display" style={{
            fontSize: 72, lineHeight: 1, color: "var(--parchment)",
            letterSpacing: "-0.02em",
          }}>
            You <span style={{fontStyle: "italic", color: "var(--accent)"}}>missed</span>
          </div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 19,
            color: "rgba(241, 230, 205, 0.65)",
            marginTop: 6,
          }}>
            the shaft hisses into the dark · stone answers · the cave keeps you
          </div>
        </div>

        {phase === "stats" && (
          <GameOverFooter
            statsTone="cool"
            stats={[
              { label: "lasted", value: timeStr },
              { label: "moves",  value: run?.moves ?? 0 },
              { label: "tiles seen", value: `${tilesSeen}/${ROW*COL}` },
            ]}
            go={go}
          />
        )}
      </div>
    </div>
  );
}

/* Pit fall — vertigo */
function PitGameOver({ run, go, phase, timeStr, tilesSeen }) {
  return (
    <div data-screen-label="05 Game Over · Pit" style={{
      position: "relative", width: "100%", height: "100%",
      background: "radial-gradient(ellipse at 50% 50%, #0d1517 0%, #000 80%)",
      overflow: "hidden",
    }}>
      {/* falling stripes */}
      <FallingStripes />
      <DustField count={26} />

      <div className="col" style={{
        position: "relative", zIndex: 2,
        width: "100%", height: "100%",
        alignItems: "center", justifyContent: "center",
        padding: 32, gap: 28,
      }}>
        <div style={{
          width: 200, height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, #000 30%, #1a0d0a 100%)",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.95), 0 0 80px rgba(0,0,0,0.8)",
          animation: phase === "intro" ? "pit-zoom 1.1s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
        }} />
        <div className="col gap-2" style={{textAlign: "center"}}>
          <div className="mono" style={{
            fontSize: 11, color: "var(--accent)", letterSpacing: ".3em",
          }}>· FALLEN ·</div>
          <div className="display" style={{
            fontSize: 72, lineHeight: 1, color: "var(--parchment)",
            letterSpacing: "-0.02em",
          }}>
            The floor was a <span style={{fontStyle: "italic", color: "var(--accent)"}}>lie</span>
          </div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 18,
            color: "rgba(241, 230, 205, 0.65)",
            marginTop: 6,
          }}>
            cold air whispers up · then nothing
          </div>
        </div>

        {phase === "stats" && (
          <GameOverFooter
            statsTone="cool"
            stats={[
              { label: "lasted", value: timeStr },
              { label: "moves",  value: run?.moves ?? 0 },
              { label: "tiles seen", value: `${tilesSeen}/${ROW*COL}` },
            ]}
            go={go}
          />
        )}
      </div>
    </div>
  );
}

/* Shared end-screen footer with stats + actions */
function GameOverFooter({ stats, go, statsTone }) {
  return (
    <div className="col gap-4" style={{
      width: "min(640px, 92%)",
      animation: "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
    }}>
      <div className="row" style={{gap: 12, justifyContent: "center"}}>
        {stats.map(s => (
          <div key={s.label} className="col gap-1" style={{
            flex: 1, maxWidth: 180,
            padding: "16px 18px",
            border: `1px ${statsTone === "danger" ? "solid rgba(196,74,58,0.4)" : "dashed rgba(241,230,205,0.25)"}`,
            borderRadius: 8,
            background: "rgba(13, 21, 23, 0.6)",
            alignItems: "center",
            textAlign: "center",
          }}>
            <div className="display" style={{fontSize: 28, lineHeight: 1, color: "var(--parchment)"}}>
              {s.value}
            </div>
            <div className="label" style={{color: "rgba(241,230,205,0.5)"}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="row gap-2" style={{justifyContent: "center", flexWrap: "wrap"}}>
        <button className="btn btn-lg" onClick={() => go("replay-same")} style={{
          background: "var(--accent)", color: "var(--parchment)",
          border: "1px solid var(--accent-deep)",
          fontFamily: "var(--font-display)", fontSize: 18,
          padding: "12px 28px",
          whiteSpace: "nowrap",
        }}>
          ↻ try again
        </button>
        <button className="btn btn-lg btn-ghost" onClick={() => go("map-reveal")} style={{whiteSpace: "nowrap", padding: "12px 22px"}}>
          📍 reveal the map
        </button>
        <button className="btn btn-lg btn-ghost" onClick={() => go("leaderboard")} style={{whiteSpace: "nowrap", padding: "12px 22px"}}>
          🏆 leaderboard
        </button>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={() => go("menu")} style={{
        alignSelf: "center", marginTop: 4, color: "rgba(241,230,205,0.55)",
        border: "none", background: "transparent",
      }}>
        ← back to menu
      </button>
    </div>
  );
}

/* ---- decorative SVGs ---- */
function ClawMarks() {
  return (
    <>
      <svg style={{position: "absolute", top: 0, left: 0, width: 320, height: 320, opacity: 0.35, pointerEvents: "none"}} viewBox="0 0 100 100">
        <path d="M0 20 L70 50" stroke="#c44a3a" strokeWidth="0.8" fill="none" />
        <path d="M0 40 L80 70" stroke="#c44a3a" strokeWidth="1.2" fill="none" />
        <path d="M0 60 L60 80" stroke="#c44a3a" strokeWidth="0.6" fill="none" />
      </svg>
      <svg style={{position: "absolute", bottom: 0, right: 0, width: 320, height: 320, opacity: 0.35, pointerEvents: "none", transform: "rotate(180deg)"}} viewBox="0 0 100 100">
        <path d="M0 20 L70 50" stroke="#c44a3a" strokeWidth="0.8" fill="none" />
        <path d="M0 40 L80 70" stroke="#c44a3a" strokeWidth="1.2" fill="none" />
        <path d="M0 60 L60 80" stroke="#c44a3a" strokeWidth="0.6" fill="none" />
      </svg>
    </>
  );
}

function BrokenArrow({ phase }) {
  // A larger inline pixel-arrow, snapped in half
  return (
    <svg width="220" height="180" viewBox="0 0 110 90" style={{
      animation: phase === "intro" ? "arrow-fall 1.0s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
      filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))",
      shapeRendering: "crispEdges",
    }}>
      {/* head + half-shaft (top-left) */}
      <g transform="translate(8, 14) rotate(-22)">
        {/* head */}
        <rect x="10" y="0" width="4" height="2" fill="#1b1612" />
        <rect x="8"  y="2" width="8" height="2" fill="#1b1612" />
        <rect x="6"  y="4" width="12" height="2" fill="#1b1612" />
        <rect x="8"  y="6" width="8" height="2" fill="#1b1612" />
        {/* shaft */}
        <rect x="10" y="8"  width="4" height="22" fill="#4a3f33" />
        {/* broken end - splintered */}
        <rect x="9"  y="30" width="2" height="2" fill="#4a3f33" />
        <rect x="13" y="30" width="2" height="2" fill="#4a3f33" />
        <rect x="10" y="32" width="2" height="2" fill="#3a2f23" />
      </g>
      {/* fletch + half-shaft (bottom-right) */}
      <g transform="translate(60, 50) rotate(22)">
        <rect x="10" y="0" width="2" height="2" fill="#3a2f23" />
        <rect x="13" y="0" width="2" height="2" fill="#3a2f23" />
        {/* shaft */}
        <rect x="10" y="2"  width="4" height="20" fill="#4a3f33" />
        {/* fletch */}
        <rect x="8"  y="22" width="2" height="4" fill="#c44a3a" />
        <rect x="14" y="22" width="2" height="4" fill="#c44a3a" />
        <rect x="6"  y="24" width="2" height="2" fill="#c44a3a" />
        <rect x="16" y="24" width="2" height="2" fill="#c44a3a" />
      </g>
    </svg>
  );
}

function FallingStripes() {
  return (
    <div style={{
      position: "absolute", inset: 0, opacity: 0.25, pointerEvents: "none",
      backgroundImage: "linear-gradient(180deg, transparent 0%, rgba(196,74,58,0.18) 50%, transparent 100%)",
      backgroundSize: "8px 120px",
      animation: "stripes-fall 1.2s linear infinite",
    }} />
  );
}

function DustField({ count }) {
  // local copy — tiles.jsx has one; keep this one available here too
  const particles = useMemo(() => Array.from({length: count}, (_, i) => ({
    key: i,
    left: Math.random() * 100,
    top:  Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 6,
    dx: (Math.random() - 0.5) * 60 + "px",
  })), [count]);
  return (
    <>
      {particles.map(p => (
        <div key={p.key} className="dust-particle" style={{
          left: p.left + "%", top: p.top + "%",
          animation: `drift ${p.duration}s linear ${p.delay}s infinite`,
          "--dx": p.dx,
        }} />
      ))}
    </>
  );
}

/* -----------------------------------------------------------
   Win — CINEMATIC FIRST.  No map shown by default.
   Big "VICTORY" treatment, defeated wumpus sprite, score, stats,
   then 3 actions: reveal map / leaderboard / replay.
----------------------------------------------------------- */
function WinScreen({ run, go }) {
  const [phase, setPhase] = useState("intro");
  useEffect(() => {
    const id = setTimeout(() => setPhase("stats"), 900);
    return () => clearTimeout(id);
  }, []);

  const wumpusFrame = useFrameAnim(WUMPUS_FRAMES, 4, false);

  const score = useMemo(() => run ? computeScore({
    moves: run.moves, seconds: run.seconds, difficulty: run.settings.difficulty
  }) : 0, [run]);

  if (!run) return null;

  const breakdown = useMemo(() => {
    const mult = LEVELS[run.settings.difficulty].multiplier;
    return [
      { label: "base", value: 1000, op: "+" },
      { label: `moves × 10 (${run.moves})`, value: -run.moves * 10 },
      { label: `seconds (${run.seconds})`, value: -run.seconds },
      { label: `${run.settings.difficulty} multiplier`, value: `× ${mult.toFixed(1)}` },
    ];
  }, [run]);

  return (
    <div data-screen-label="06 Win" style={{
      position: "relative", width: "100%", height: "100%",
      background: "linear-gradient(180deg, #1a1208 0%, #0d1517 70%, #060c0d 100%)",
      overflow: "hidden",
    }}>
      {/* gold lantern glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 35%, rgba(212, 168, 87, 0.22) 0%, transparent 55%)",
        pointerEvents: "none",
      }} />
      <DustField count={26} />

      <div className="col" style={{
        position: "relative", zIndex: 2,
        width: "100%", height: "100%",
        alignItems: "center", justifyContent: "center",
        padding: "32px 40px", gap: 18,
      }}>
        {/* Defeated wumpus sprite — fallen, faded */}
        <div style={{
          width: 140, height: 140,
          backgroundImage: `url("assets/wumpus/${String(wumpusFrame).padStart(2,"0")}.png")`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "center",
          imageRendering: "pixelated",
          filter: "drop-shadow(0 8px 24px rgba(212, 168, 87, 0.4)) grayscale(0.6) brightness(0.7)",
          transform: "rotate(75deg)",
          opacity: phase === "intro" ? 0 : 0.75,
          transition: "opacity 600ms ease",
        }} />

        <div className="col gap-1" style={{textAlign: "center"}}>
          <div className="mono" style={{
            fontSize: 11, color: "var(--gold)", letterSpacing: ".3em",
          }}>· THE HUNT IS OVER ·</div>
          <div className="display" style={{
            fontSize: 88, lineHeight: 1, color: "var(--parchment)",
            letterSpacing: "-0.02em",
            textShadow: "0 0 32px rgba(212, 168, 87, 0.4)",
          }}>
            The Wumpus is <span style={{fontStyle: "italic", color: "var(--gold)"}}>dead</span>
          </div>
          <div style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 19,
            color: "rgba(241, 230, 205, 0.65)",
            marginTop: 6,
          }}>
            the bowstring sang once · the cave answered with silence
          </div>
        </div>

        {/* Big score */}
        <div className="col gap-1" style={{
          alignItems: "center", marginTop: 8,
          opacity: phase === "stats" ? 1 : 0,
          transform: phase === "stats" ? "translateY(0)" : "translateY(20px)",
          transition: "all 600ms cubic-bezier(0.22, 1, 0.36, 1) 200ms",
        }}>
          <div className="display" style={{
            fontSize: 96, lineHeight: 1, color: "var(--gold)",
            textShadow: "0 0 24px rgba(212, 168, 87, 0.5)",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
          }}>
            {score.toLocaleString()}
          </div>
          <div className="label" style={{color: "rgba(241,230,205,0.5)"}}>final score · rank #4 this week</div>
        </div>

        {/* Stats + breakdown row */}
        {phase === "stats" && (
          <div className="col gap-4" style={{
            width: "min(820px, 96%)",
            marginTop: 12,
            animation: "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 350ms backwards",
          }}>
            <div className="row" style={{gap: 12, justifyContent: "center"}}>
              <CinStat label="time"        value={`${String(Math.floor(run.seconds/60)).padStart(2,"0")}:${String(run.seconds%60).padStart(2,"0")}`} />
              <CinStat label="moves"       value={run.moves} />
              <CinStat label="arrow"       value="1 of 1" highlight />
              <CinStat label="tiles seen"  value={`${run.finalGame.grid.flat().filter(c => c.seen).length}/${ROW*COL}`} />
              <CinStat label="difficulty"  value={run.settings.difficulty} />
            </div>

            <div className="row gap-2" style={{justifyContent: "center", flexWrap: "wrap"}}>
              <button className="btn btn-lg" onClick={() => go("map-reveal")} style={{
                background: "var(--gold)", color: "var(--ink)",
                border: "1px solid #b18e3f",
                fontFamily: "var(--font-display)", fontSize: 18,
                padding: "12px 26px", whiteSpace: "nowrap",
              }}>
                📍 reveal the map
              </button>
              <button className="btn btn-lg" onClick={() => go("leaderboard")} style={{
                background: "transparent",
                color: "var(--parchment)",
                border: "1px solid rgba(241,230,205,0.25)",
                fontFamily: "var(--font-display)", fontSize: 18,
                padding: "12px 26px", whiteSpace: "nowrap",
              }}>
                🏆 leaderboard
              </button>
              <button className="btn btn-lg" onClick={() => go("replay-same")} style={{
                background: "transparent",
                color: "var(--parchment)",
                border: "1px solid rgba(241,230,205,0.25)",
                fontFamily: "var(--font-display)", fontSize: 18,
                padding: "12px 26px", whiteSpace: "nowrap",
              }}>
                ↻ another run
              </button>
            </div>

            <button className="btn btn-ghost btn-sm" onClick={() => go("menu")} style={{
              alignSelf: "center", marginTop: 4, color: "rgba(241,230,205,0.55)",
              border: "none", background: "transparent",
            }}>
              ← back to menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CinStat({ label, value, highlight }) {
  return (
    <div className="col gap-1" style={{
      flex: 1, maxWidth: 160,
      padding: "14px 16px",
      border: highlight ? "1px solid rgba(212, 168, 87, 0.5)" : "1px dashed rgba(241,230,205,0.18)",
      borderRadius: 8,
      background: highlight ? "rgba(212, 168, 87, 0.08)" : "rgba(13, 21, 23, 0.55)",
      alignItems: "center",
      textAlign: "center",
    }}>
      <div className="display" style={{
        fontSize: 24, lineHeight: 1,
        color: highlight ? "var(--gold)" : "var(--parchment)",
        textTransform: label === "difficulty" ? "capitalize" : "none",
        whiteSpace: "nowrap",
      }}>
        {value}
      </div>
      <div className="label" style={{color: "rgba(241,230,205,0.5)"}}>{label}</div>
    </div>
  );
}

/* -----------------------------------------------------------
   Leaderboard (A) — unchanged
----------------------------------------------------------- */
function LeaderboardScreen({ go, run }) {
  const [scope, setScope] = useState("weekly");
  const [diffFilter, setDiffFilter] = useState("any");
  const [modeFilter, setModeFilter] = useState("any");
  const [sortBy, setSortBy] = useState("score");

  const youRow = LEADERBOARD.find(r => r.you);

  const filtered = useMemo(() => {
    let rows = LEADERBOARD;
    if (diffFilter !== "any") rows = rows.filter(r => r.level === diffFilter);
    if (sortBy === "time") {
      rows = [...rows].sort((a, b) => a.time.localeCompare(b.time));
    }
    return rows;
  }, [diffFilter, sortBy]);

  return (
    <div data-screen-label="07 Leaderboard" className="col" style={{
      width: "100%", height: "100%", padding: 32, gap: 20, position: "relative",
    }}>
      <div className="cave-backdrop" />
      <div className="row" style={{alignItems: "baseline", gap: 16, position: "relative", zIndex: 1}}>
        <div className="display" style={{fontSize: 34, color: "var(--parchment)"}}>Leaderboard</div>
        <div className="grow" />
        <div className="row gap-2" style={{flexWrap: "wrap"}}>
          {[
            ["weekly", "weekly"],
            ["all", "all-time"],
            ["seed", "this seed"],
            ["friends", "friends"],
          ].map(([key, label]) => (
            <button key={key}
              onClick={() => setScope(key)}
              className="btn btn-sm"
              style={{
                background: scope === key ? "var(--ink)" : "transparent",
                color: scope === key ? "var(--parchment)" : "var(--parchment)",
                border: scope === key ? "1px solid var(--ink)" : "1px dashed rgba(241,230,205,0.3)",
                whiteSpace: "nowrap",
              }}>
              {label}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => go("menu")}>← menu</button>
      </div>

      <div className="row gap-2" style={{position: "relative", zIndex: 1, flexWrap: "wrap"}}>
        <Filter label="difficulty" value={diffFilter}
          options={[["any","ANY"],["easy","EASY"],["normal","NORMAL"],["hard","HARD"]]}
          onChange={setDiffFilter} />
        <Filter label="mode" value={modeFilter}
          options={[["any","ANY"],["blinded","BLINDED"],["express","EXPRESS"]]}
          onChange={setModeFilter} />
        <Filter label="sort" value={sortBy}
          options={[["score","↓ SCORE"],["time","↑ TIME"]]}
          onChange={setSortBy} />
        <div className="grow" />
        {youRow && (
          <button className="btn btn-sm btn-ghost"
            style={{whiteSpace: "nowrap"}}
            onClick={() => {
              document.querySelector('[data-you-row]')?.scrollIntoView({ block: "center", behavior: "smooth" });
            }}>
            ↑ jump to my row · #{youRow.rank}
          </button>
        )}
      </div>

      <div className="panel grow" style={{position: "relative", zIndex: 1, overflow: "hidden", padding: 0, display: "flex", flexDirection: "column"}}>
        {youRow && (
          <div style={{
            background: "rgba(212, 168, 87, 0.18)",
            borderBottom: "1px solid rgba(212, 168, 87, 0.5)",
            padding: "8px 16px",
          }}>
            <LeaderRow row={youRow} highlight pinned />
          </div>
        )}
        <div className="row" style={{
          padding: "10px 16px",
          background: "var(--parchment-2)",
          borderBottom: "1px solid var(--rule)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--ink-3)",
          textTransform: "uppercase",
          letterSpacing: ".12em",
        }}>
          <span style={{width: 50}}>#</span>
          <span style={{flex: 2}}>player</span>
          <span style={{flex: 1, textAlign: "right"}}>score</span>
          <span style={{flex: 1, textAlign: "right"}}>time</span>
          <span style={{flex: 1, textAlign: "right"}}>moves</span>
          <span style={{flex: 1, textAlign: "right"}}>level</span>
          <span style={{flex: 1, textAlign: "right"}}>when</span>
        </div>
        <div style={{flex: 1, overflow: "auto"}}>
          {filtered.map(row => <LeaderRow key={row.name} row={row} highlight={row.you} />)}
        </div>
      </div>
    </div>
  );
}

function Filter({ label, value, options, onChange }) {
  const cur = options.find(([k]) => k === value);
  const cycle = () => {
    const idx = options.findIndex(([k]) => k === value);
    onChange(options[(idx + 1) % options.length][0]);
  };
  return (
    <button onClick={cycle} className="btn btn-sm"
      style={{
        background: "transparent",
        color: "var(--parchment)",
        border: "1px dashed rgba(241,230,205,0.3)",
        fontFamily: "var(--font-mono)",
        letterSpacing: ".1em",
        whiteSpace: "nowrap",
      }}>
      {cur ? cur[1] : value.toUpperCase()}
    </button>
  );
}

function LeaderRow({ row, highlight, pinned }) {
  return (
    <div data-you-row={row.you ? "1" : undefined}
      style={{
        display: "flex",
        padding: "11px 16px",
        background: highlight ? "rgba(212, 168, 87, 0.15)" : "transparent",
        borderBottom: pinned ? "none" : "1px dashed rgba(27,22,18,0.1)",
        alignItems: "center",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        color: "var(--ink)",
        fontWeight: highlight ? 600 : 400,
      }}>
      <span style={{width: 50, color: highlight ? "var(--accent)" : "var(--ink-3)"}}>
        #{row.rank}
      </span>
      <span style={{flex: 2}}>
        {row.name}
        {row.you && <span style={{color: "var(--accent)", marginLeft: 8, fontSize: 11}}>← you</span>}
      </span>
      <span style={{flex: 1, textAlign: "right"}}>{row.score}</span>
      <span style={{flex: 1, textAlign: "right"}}>{row.time}</span>
      <span style={{flex: 1, textAlign: "right", color: "var(--ink-3)"}}>{row.moves}</span>
      <span style={{flex: 1, textAlign: "right", color: "var(--ink-3)"}}>{row.level}</span>
      <span style={{flex: 1, textAlign: "right", color: "var(--ink-3)"}}>{row.when}</span>
    </div>
  );
}

/* -----------------------------------------------------------
   Map Reveal (B) — scrubber + moments. Same as before.
----------------------------------------------------------- */
function MapRevealScreen({ run, go }) {
  if (!run) {
    return (
      <div data-screen-label="08 Map Reveal" className="col" style={{
        width:"100%", height:"100%", alignItems:"center", justifyContent: "center", padding: 32, gap: 12,
      }}>
        <div className="cave-backdrop" />
        <div style={{position:"relative", zIndex:1, color: "var(--parchment)"}}>
          No run yet — play a round first.
        </div>
        <button className="btn" style={{position:"relative", zIndex:1}} onClick={() => go("level")}>start a run</button>
      </div>
    );
  }

  const [scrub, setScrub] = useState(run.history.length - 1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setScrub(s => {
        if (s >= run.history.length - 1) { setPlaying(false); return s; }
        return s + 1;
      });
    }, 600);
    return () => clearInterval(id);
  }, [playing, run.history.length]);

  const displayGame = useMemo(() => {
    const g = JSON.parse(JSON.stringify(run.finalGame));
    for (const row of g.grid) for (const c of row) c.seen = false;
    for (const row of g.grid) for (const c of row) c.entities = c.entities.filter(e => e !== PLAYER);

    let player = run.history[0]?.at || run.finalGame.player;
    for (let i = 0; i <= scrub; i++) {
      const step = run.history[i];
      if (step.at) {
        player = step.at;
        revealFrom(g.grid, step.at[0], step.at[1]);
      }
    }
    g.grid[player[0]][player[1]].entities.push(PLAYER);
    g.player = player;
    return g;
  }, [scrub, run]);

  const moments = useMemo(() => {
    return run.history.map((h, i) => ({ i, ...h })).filter(m =>
      m.type === "spawn" || m.type === "shoot" || m.hit
    );
  }, [run]);

  const backTarget = run.outcome === "won" ? "win" : "gameover-back";

  return (
    <div data-screen-label="08 Map Reveal" className="col" style={{
      width: "100%", height: "100%", padding: 28, gap: 18, position: "relative",
    }}>
      <div className="cave-backdrop" />
      <div className="row" style={{alignItems: "baseline", gap: 16, position: "relative", zIndex: 1}}>
        <div className="col gap-1">
          <div className="display" style={{fontSize: 30, color: "var(--parchment)", whiteSpace: "nowrap"}}>What you missed</div>
          <div className="mono" style={{fontSize: 12, color: "rgba(241,230,205,0.6)"}}>
            {run.settings.difficulty} · {run.outcome === "won" ? "you won" : "run ended at turn " + (run.history.length - 1)}
          </div>
        </div>
        <div className="grow" />
        <button className="btn btn-ghost btn-sm" onClick={() => go(backTarget)}>← back</button>
      </div>

      <div className="row gap-4" style={{flex: 1, minHeight: 0, position: "relative", zIndex: 1}}>
        <div className="col gap-3 grow" style={{minWidth: 0}}>
          <div className="grow" style={{position: "relative"}}>
            <MapView
              game={displayGame}
              playerSprite={run.settings.playerSprite || "player1"}
              revealAll={true}
              showBlood={true} showSlime={true}
              flicker={true} showDust={true}
            />
            <RouteOverlay history={run.history.slice(0, scrub + 1)} />
          </div>

          <div className="panel col gap-2" style={{padding: "14px 18px"}}>
            <div className="row gap-3" style={{alignItems: "center"}}>
              <button className="btn btn-sm btn-primary" onClick={() => { setPlaying(p => !p); }}
                style={{whiteSpace: "nowrap"}}>
                {playing ? "❚❚ pause" : "▸ play"}
              </button>
              <button className="btn btn-sm" onClick={() => { setScrub(0); setPlaying(false); }} style={{whiteSpace: "nowrap"}}>↻</button>
              <div className="mono" style={{fontSize: 12, color: "var(--ink-3)", width: 110, whiteSpace: "nowrap"}}>
                turn {String(scrub).padStart(2, "0")} / {String(run.history.length - 1).padStart(2, "0")}
              </div>
              <input type="range" min={0} max={run.history.length - 1} value={scrub}
                onChange={e => { setScrub(parseInt(e.target.value, 10)); setPlaying(false); }}
                style={{flex: 1, accentColor: "var(--accent)"}} />
            </div>
          </div>
        </div>

        <div className="col gap-3" style={{width: 280}}>
          <div className="panel col gap-2" style={{padding: 16}}>
            <div className="label" style={{color: "var(--ink-3)"}}>legend</div>
            <LegendRow glyph="W" label="wumpus" color="var(--accent)" />
            <LegendRow glyph="●" label="bottomless pit" color="var(--ink)" />
            <LegendRow glyph="B" label="super bat" color="var(--accent)" />
            <LegendRow glyph="A" label="your start" color="var(--gold)" />
            <LegendRow glyph="⌖" label="killing shot" color="var(--accent)" />
          </div>

          <div className="panel col grow" style={{padding: 0, minHeight: 0}}>
            <div style={{padding: "12px 16px", borderBottom: "1px solid var(--rule)"}}>
              <div className="label" style={{color: "var(--ink-3)"}}>moments</div>
            </div>
            <div style={{flex: 1, overflow: "auto", padding: "4px 0"}}>
              {moments.map(m => (
                <button key={m.i} onClick={() => { setScrub(m.i); setPlaying(false); }}
                  className="row"
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "none",
                    background: scrub === m.i ? "rgba(196, 74, 58, 0.08)" : "transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font-ui)",
                    textAlign: "left",
                    gap: 10,
                    alignItems: "baseline",
                    borderLeft: scrub === m.i ? "3px solid var(--accent)" : "3px solid transparent",
                  }}>
                  <span className="mono" style={{fontSize: 11, color: "var(--ink-3)", width: 26}}>
                    {String(m.i).padStart(2,"0")}
                  </span>
                  <span style={{fontSize: 13, color: "var(--ink)"}}>
                    {m.type === "spawn" ? "spawn" :
                     m.type === "shoot" ? (m.hit === "wumpus" ? "★ killing shot " + (m.dir ? DIR_ARROWS[m.dir] : "") : "fired " + (m.dir ? DIR_ARROWS[m.dir] : ""))
                     : m.note}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary btn-lg" onClick={() => go("replay-same")} style={{whiteSpace: "nowrap"}}>
            ↻ replay
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => go("menu")}>← menu</button>
        </div>
      </div>
    </div>
  );
}

function RouteOverlay({ history }) {
  if (!history || history.length < 2) return null;
  const W = 800, H = 600;
  const cw = W / COL, ch = H / ROW;
  const center = (y, x) => [x * cw + cw/2, y * ch + ch/2];

  let d = "";
  const points = [];
  let prev = null;
  for (const h of history) {
    if (!h.at) continue;
    const [y, x] = h.at;
    const [cx, cy] = center(y, x);
    if (!prev) d = `M ${cx} ${cy} `;
    else {
      const dx = Math.abs(cx - prev[0]);
      const dy = Math.abs(cy - prev[1]);
      if (dx > W * 0.5 || dy > H * 0.5) d += `M ${cx} ${cy} `;
      else d += `L ${cx} ${cy} `;
    }
    prev = [cx, cy];
    points.push({ x: cx, y: cy, type: h.type, dir: h.dir, hit: h.hit });
  }

  const shotIdx = points.findIndex(p => p.hit === "wumpus");
  const start = points[0];

  return (
    <svg className="aim-path" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{zIndex: 6}}>
      <path d={d} stroke="#f0e6cd" strokeWidth="3" fill="none" strokeDasharray="2 4" opacity="0.7" />
      <path d={d} stroke="#c44a3a" strokeWidth="1.2" fill="none" />
      {start && (
        <g>
          <circle cx={start.x} cy={start.y} r="10" fill="rgba(212, 168, 87, 0.3)" stroke="#d4a857" strokeWidth="2" />
          <text x={start.x} y={start.y + 4} fontSize="11" fill="#d4a857" textAnchor="middle" fontFamily="JetBrains Mono">A</text>
        </g>
      )}
      {shotIdx >= 0 && (
        <g>
          <circle cx={points[shotIdx].x} cy={points[shotIdx].y} r="14" fill="rgba(196, 74, 58, 0.25)" stroke="#c44a3a" strokeWidth="2">
            <animate attributeName="r" values="14;20;14" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <text x={points[shotIdx].x} y={points[shotIdx].y + 4} fontSize="13" fill="#c44a3a" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="700">⌖</text>
        </g>
      )}
    </svg>
  );
}

function LegendRow({ glyph, label, color }) {
  return (
    <div className="row gap-3" style={{alignItems: "center"}}>
      <div className="mono" style={{
        width: 22, height: 22, borderRadius: 4,
        background: color, color: "var(--parchment)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700,
      }}>{glyph}</div>
      <div style={{fontSize: 13, color: "var(--ink)"}}>{label}</div>
    </div>
  );
}

Object.assign(window, { GameOverScreen, WinScreen, LeaderboardScreen, MapRevealScreen, ARROW_TOTAL });
