/* ============================================================
   screen-menu.jsx — MainMenu (B), Auth (A), LevelSelect (B)
============================================================ */

/* -----------------------------------------------------------
   Main Menu — variation B: procedural map looping behind,
   side-anchored menu panel.
----------------------------------------------------------- */
function MainMenuScreen({ go, signedIn, username }) {
  // looping demo map behind
  const [bgGame, setBgGame] = useState(() => {
    const g = generateMap(412, "easy");
    // reveal everything for the menu backdrop, no entities visible
    for (const row of g.grid) for (const c of row) c.seen = true;
    g.grid[g.player[0]][g.player[1]].entities = [];
    for (const row of g.grid) for (const c of row) c.entities = c.entities.filter(e => e !== WUMPUS && e !== BAT);
    return g;
  });

  // Cycle the backdrop map every 14s
  useEffect(() => {
    const id = setInterval(() => {
      const newSeed = Math.floor(Math.random() * 9999);
      const diffs = ["easy", "normal", "hard"];
      const d = diffs[Math.floor(Math.random() * 3)];
      const g = generateMap(newSeed, d);
      for (const row of g.grid) for (const c of row) c.seen = true;
      for (const row of g.grid) for (const c of row) c.entities = c.entities.filter(e => e !== WUMPUS && e !== BAT);
      setBgGame(g);
    }, 14000);
    return () => clearInterval(id);
  }, []);

  return (
    <div data-screen-label="01 Main Menu" style={{
      position: "relative", width: "100%", height: "100%", display: "flex",
    }}>
      {/* Backdrop map — full bleed, looped */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: 0.55, filter: "blur(0.5px) brightness(0.85)",
        transform: "scale(1.08)",
        transition: "opacity 1.6s ease",
      }}>
        <MapView
          game={bgGame}
          playerSprite="player1"
          revealAll={false}
          showBlood={false} showSlime={false}
          flicker={true} showDust={true}
          hidePlayer={true}
        />
        <div style={{position:"absolute", inset:0, background: "linear-gradient(90deg, rgba(13,21,23,0.95) 0%, rgba(13,21,23,0.35) 55%, rgba(13,21,23,0.85) 100%)"}} />
      </div>

      {/* side-anchored menu */}
      <div className="col gap-5" style={{
        position: "relative",
        zIndex: 2,
        width: 460,
        padding: "60px 56px",
        height: "100%",
        justifyContent: "center",
        background: "linear-gradient(180deg, rgba(6,12,13,0.85), rgba(6,12,13,0.65))",
        borderRight: "1px solid rgba(241,230,205,0.08)",
      }}>
        <div className="col gap-3">
          <div className="label" style={{color: "rgba(241,230,205,0.5)"}}>chapter 01 · the descent</div>
          <Wordmark scale={1} />
          <div style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 19,
            color: "rgba(241,230,205,0.75)",
            marginTop: 8,
            lineHeight: 1.4,
            maxWidth: 320,
          }}>
            A procedurally-haunted cave. <br />
            Three arrows. One Wumpus.
          </div>
        </div>

        <div className="col gap-2" style={{marginTop: 8}}>
          <button className="btn btn-lg" style={{justifyContent:"flex-start", background: "var(--parchment)", color: "var(--ink)", padding: "16px 22px"}}
            onClick={() => go("level")}>
            <span style={{fontFamily:"var(--font-display)", fontSize: 22, whiteSpace: "nowrap"}}>▸ Enter the cave</span>
          </button>
          <button className="btn btn-ghost" style={{justifyContent:"flex-start"}}
            onClick={() => go("leaderboard")}>
            Leaderboard
          </button>
          <button className="btn btn-ghost" style={{justifyContent:"flex-start"}}
            onClick={() => go("auth")}>
            {signedIn ? `Signed in · ${username}` : "Sign in"}
          </button>
          <button className="btn btn-ghost" style={{justifyContent:"flex-start"}}
            onClick={() => alert("How to play:\n\nWASD or arrows — move\nShift+Arrow — shoot (release to fire)\nM — reveal map · Esc — cancel\n\nThe map is a 6×8 torus of caves and tunnels. Two pits. One Wumpus. Find it and shoot. Listen for clues: smell, draft, squeak.")}>
            How to play
          </button>
        </div>

        <div className="col gap-2" style={{marginTop: "auto"}}>
          <div className="label" style={{color: "rgba(241,230,205,0.4)"}}>build · v0.7 prototype</div>
          <div className="mono" style={{fontSize: 11, color: "rgba(241,230,205,0.4)"}}>
            seed pool · 412 · 928 · 1337
          </div>
        </div>
      </div>

      <div className="grow" />
    </div>
  );
}

/* -----------------------------------------------------------
   Auth — variation A: single tabbed panel (sign in / register)
----------------------------------------------------------- */
function AuthScreen({ go, signIn }) {
  const [tab, setTab] = useState("signin");
  const [username, setUsername] = useState("cave_diver_07");
  const [password, setPassword] = useState("••••••••");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState(null);

  function submit(e) {
    e?.preventDefault?.();
    if (!username.trim()) { setErr("Pick a name to carry in the dark."); return; }
    if (tab === "register" && pw2 !== password) { setErr("Passwords don't match."); return; }
    signIn(username.trim());
    go("level");
  }

  return (
    <div data-screen-label="02 Auth" className="col" style={{
      width: "100%", height: "100%", alignItems: "center", justifyContent: "center",
      padding: 40, gap: 24, position: "relative",
    }}>
      <div className="cave-backdrop" />
      <div className="panel" style={{
        width: 460, padding: "36px 36px 32px", position: "relative",
      }}>
        <div className="col gap-1" style={{marginBottom: 24, textAlign: "center"}}>
          <div className="display" style={{fontSize: 28, color: "var(--ink)"}}>
            Enter the cave
          </div>
          <div style={{fontSize: 13, color: "var(--ink-3)"}}>
            sign in to track your seeds and runs
          </div>
        </div>

        {/* tab bar */}
        <div className="row" style={{borderBottom: "1px solid var(--rule)", marginBottom: 22}}>
          {[
            ["signin", "Sign in"],
            ["register", "Register"],
          ].map(([key, label]) => (
            <button key={key}
              onClick={() => { setTab(key); setErr(null); }}
              style={{
                background: "transparent",
                border: "none",
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "var(--font-ui)",
                color: tab === key ? "var(--ink)" : "var(--ink-3)",
                borderBottom: tab === key ? "2px solid var(--accent)" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: -1,
              }}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="col gap-3">
          <div>
            <label className="field-label">username</label>
            <input className="field" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="field-label">password</label>
            <input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {tab === "register" && (
            <div>
              <label className="field-label">confirm password</label>
              <input className="field" type="password" value={pw2} onChange={e => setPw2(e.target.value)} />
            </div>
          )}
          {err && (
            <div className="mono" style={{fontSize: 12, color: "var(--accent)"}}>
              ! {err}
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-lg" style={{marginTop: 8}}>
            {tab === "signin" ? "Enter the cave" : "Stake your claim"}
          </button>
          <div className="row" style={{justifyContent: "space-between", marginTop: 4}}>
            <button type="button" className="btn btn-ghost btn-sm" style={{color: "var(--ink-3)", border: "none"}}
              onClick={() => { signIn("guest_lantern"); go("level"); }}>
              continue as guest
            </button>
            {tab === "signin" && (
              <button type="button" style={{
                background: "none", border: "none", color: "var(--ink-3)",
                fontFamily: "var(--font-ui)", fontSize: 13, cursor: "pointer", textDecoration: "underline",
              }}>
                forgot password?
              </button>
            )}
          </div>
        </form>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={() => go("menu")}>← back to menu</button>
    </div>
  );
}

/* -----------------------------------------------------------
   Level Select — no preview, no seed exposure.
   Just difficulty + modes, immersive and minimal.
----------------------------------------------------------- */
function LevelSelectScreen({ go, start }) {
  const [diff, setDiff] = useState("normal");
  const [blinded, setBlinded] = useState(false);
  const [express, setExpress] = useState(false);

  const meta = {
    easy:   { tagline: "a short cave",   detail: "1 bat · close corridors", risk: 1 },
    normal: { tagline: "a deeper dark",  detail: "2 bats · winding tunnels", risk: 2 },
    hard:   { tagline: "the bone-pit",   detail: "2 bats · long, twisting passages", risk: 3 },
  };

  return (
    <div data-screen-label="03 Level Select" className="col" style={{
      width: "100%", height: "100%", position: "relative",
      padding: "40px 56px", gap: 32,
      overflow: "hidden",
    }}>
      <div className="cave-backdrop" />
      {/* atmospheric dust + lantern glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 30%, rgba(212, 168, 87, 0.06) 0%, transparent 50%)",
        pointerEvents: "none",
      }} />

      <div className="row" style={{alignItems: "baseline", gap: 16, zIndex: 1, position: "relative"}}>
        <button className="btn btn-ghost btn-sm" onClick={() => go("menu")}>← menu</button>
        <div className="grow" />
        <div className="mono" style={{fontSize: 11, color: "rgba(241,230,205,0.4)", letterSpacing: ".14em"}}>
          choose your descent
        </div>
      </div>

      {/* Title */}
      <div className="col gap-2" style={{zIndex: 1, position: "relative", textAlign: "center", marginTop: 16}}>
        <div className="display" style={{fontSize: 48, color: "var(--parchment)", letterSpacing: "-0.02em"}}>
          How deep do you go?
        </div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: 17,
          color: "rgba(241,230,205,0.55)",
        }}>
          you carry one arrow into the dark · use it well
        </div>
      </div>

      {/* Difficulty cards */}
      <div className="row" style={{gap: 22, justifyContent: "center", zIndex: 1, position: "relative", flex: 1, alignItems: "stretch"}}>
        {Object.entries(LEVELS).map(([key, lv]) => {
          const m = meta[key];
          const active = diff === key;
          return (
            <button key={key}
              onClick={() => setDiff(key)}
              style={{
                flex: 1, maxWidth: 340, minWidth: 260,
                background: active ? "var(--parchment)" : "rgba(13, 21, 23, 0.55)",
                border: active ? "1px solid var(--ink)" : "1px solid rgba(241,230,205,0.16)",
                borderRadius: 14,
                padding: "32px 24px 28px",
                color: active ? "var(--ink)" : "var(--parchment)",
                cursor: "pointer",
                transition: "all 240ms cubic-bezier(0.22, 1, 0.36, 1)",
                fontFamily: "var(--font-ui)",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                transform: active ? "translateY(-4px)" : "translateY(0)",
                boxShadow: active ? "0 24px 48px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(212, 168, 87, 0.4)" : "none",
              }}>
              {/* risk indicator — three vertical bars */}
              <div className="row gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: 18, height: 3, borderRadius: 1.5,
                    background: i <= m.risk
                      ? (active ? "var(--accent)" : "var(--accent)")
                      : (active ? "rgba(27,22,18,0.15)" : "rgba(241,230,205,0.15)"),
                  }} />
                ))}
                <div className="grow" />
                {!active && (
                  <div className="mono" style={{
                    fontSize: 10,
                    letterSpacing: ".18em",
                    color: "rgba(241,230,205,0.5)",
                  }}>{key.toUpperCase()}</div>
                )}
                {active && (
                  <div className="mono" style={{
                    fontSize: 10,
                    letterSpacing: ".18em",
                    color: "var(--accent)",
                  }}>● CHOSEN</div>
                )}
              </div>

              <div className="display" style={{fontSize: 38, lineHeight: 1, color: active ? "var(--ink)" : "var(--parchment)"}}>
                {lv.label}
              </div>
              <div style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 17,
                color: active ? "var(--ink-2)" : "rgba(241,230,205,0.7)",
                lineHeight: 1.3,
              }}>
                {m.tagline}
              </div>

              <div className="grow" />

              <div className="col gap-1" style={{
                paddingTop: 14,
                borderTop: active ? "1px dashed var(--rule)" : "1px dashed rgba(241,230,205,0.15)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: ".06em",
                color: active ? "var(--ink-3)" : "rgba(241,230,205,0.5)",
              }}>
                <div>{m.detail}</div>
                <div>×{lv.multiplier.toFixed(1)} score multiplier</div>
              </div>

              {active && (
                <div className="mono" style={{
                  position: "absolute", top: 18, right: 22,
                  fontSize: 10,
                  letterSpacing: ".18em",
                  color: "transparent",
                  display: "none",
                }}>● CHOSEN</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Mode toggles + descend */}
      <div className="row" style={{gap: 16, alignItems: "center", justifyContent: "center", zIndex: 1, position: "relative", flexWrap: "wrap"}}>
        <ModeChip active={blinded} onClick={() => setBlinded(b => !b)}
          label="Blinded" hint="map goes dark · senses only" />
        <ModeChip active={express} onClick={() => setExpress(e => !e)}
          label="Express" hint="two-minute timer" />
        <div style={{width: 32}} />
        <button className="btn btn-primary btn-lg"
          onClick={() => start({
            seed: 100 + Math.floor(Math.random() * 9000),
            difficulty: diff, blinded, express,
          })}
          style={{
            fontFamily: "var(--font-display)", fontSize: 20,
            padding: "16px 36px",
            background: "var(--accent)",
            color: "var(--parchment)",
            border: "1px solid var(--accent-deep)",
            whiteSpace: "nowrap",
          }}>
          ▸ Descend
        </button>
      </div>
    </div>
  );
}

function ModeChip({ active, onClick, label, hint }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 14px",
      background: active ? "var(--accent)" : "transparent",
      color: active ? "var(--parchment)" : "var(--parchment)",
      border: active ? "1px solid var(--accent-deep)" : "1px dashed rgba(241,230,205,0.3)",
      borderRadius: 8,
      cursor: "pointer",
      fontFamily: "var(--font-ui)",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 2,
      minWidth: 130,
    }}>
      <span style={{fontWeight: 600, fontSize: 13}}>{active ? "■ " : "□ "}{label}</span>
      <span className="mono" style={{fontSize: 10, opacity: active ? 0.85 : 0.55}}>{hint}</span>
    </button>
  );
}

Object.assign(window, { MainMenuScreen, AuthScreen, LevelSelectScreen, ModeChip });
