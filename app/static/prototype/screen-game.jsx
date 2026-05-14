/* ============================================================
   screen-game.jsx — Game screen (revised)
   - Single arrow (one chance)
   - No activity log (immersive, minimal HUD)
   - Aim mode: 4 directional arrows around player on map
   - "Use Controls Buttons" fallback: D-pad + Shoot
============================================================ */

const ARROW_TOTAL = 1;

function GameScreen({ game, setGame, settings, go, recordRun }) {
  const [moves, setMoves] = useState(0);
  const [arrows, setArrows] = useState(ARROW_TOTAL);
  const [arrowsFired, setArrowsFired] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [aiming, setAiming] = useState(false);
  const [blinded, setBlinded] = useState(settings.blinded);
  const [paused, setPaused] = useState(false);
  const [playerAnim, setPlayerAnim] = useState(0);
  const [batCarryActive, setBatCarryActive] = useState(false);
  const [status, setStatus] = useState("playing");
  const [controlsOpen, setControlsOpen] = useState(false);
  const [turnHistory, setTurnHistory] = useState([
    { t: 0, type: "spawn", at: game.player, note: "you step into damp stone" }
  ]);
  const [bannerMsg, setBannerMsg] = useState(null);

  const rngRef = useRef(mulberry32(game.seed + 999));
  const startedAt = useRef(Date.now());
  const startedAtRef = startedAt;

  /* ----- timer ----- */
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  /* ----- transient banner for narrative beats ----- */
  function flashBanner(text, kind = "system", ms = 2400) {
    setBannerMsg({ text, kind, id: Math.random() });
    setTimeout(() => setBannerMsg(b => (b && b.text === text ? null : b)), ms);
  }

  /* ----- warnings — adjacency at the player's tile ----- */
  const warnings = useMemo(() => {
    const cell = game.grid[game.player[0]][game.player[1]];
    const w = [];
    if (cell.effects.includes(BLOOD)) w.push("smell");
    if (cell.effects.includes(SLIME)) w.push("draft");
    for (const dirName of DIR_NAMES) {
      const [dy, dx] = DIR[dirName];
      const target = nextCave(game.grid, game.player[0], game.player[1], dy, dx);
      if (target) {
        const [ty, tx] = target.cell;
        if (game.grid[ty][tx].entities.includes(BAT)) { w.push("squeak"); break; }
      }
    }
    return w;
  }, [game]);

  /* ----- adjacency for click-to-move + aim destinations ----- */
  const adjacent = useMemo(() => {
    const out = {};
    for (const dirName of DIR_NAMES) {
      const [dy, dx] = DIR[dirName];
      const target = nextCave(game.grid, game.player[0], game.player[1], dy, dx);
      if (target) out[`${target.cell[0]}-${target.cell[1]}`] = dirName;
    }
    return out;
  }, [game]);

  /* ----- movement ----- */
  function doMove(dirName) {
    if (status !== "playing" || paused) return;
    if (aiming) return;
    const [dy, dx] = DIR[dirName];
    const target = nextCave(game.grid, game.player[0], game.player[1], dy, dx);
    if (!target) return;
    const [ny, nx] = target.cell;
    const targetCell = game.grid[ny][nx];

    const newGrid = game.grid;
    newGrid[game.player[0]][game.player[1]].entities =
      newGrid[game.player[0]][game.player[1]].entities.filter(e => e !== PLAYER);
    newGrid[ny][nx].entities.push(PLAYER);
    revealFrom(newGrid, ny, nx);
    for (const [py, px] of target.path) newGrid[py][px].seen = true;

    const newGame = { ...game, player: [ny, nx], grid: newGrid };
    setGame(newGame);
    setMoves(m => m + 1);
    setPlayerAnim(220);
    setTurnHistory(h => [...h, { t: moves + 1, type: "move", at: [ny, nx], dir: dirName, note: `moved ${dirName}` }]);

    if (targetCell.path === PIT) {
      flashBanner("the floor was a lie", "danger");
      setTimeout(() => endRun("lost-pit", newGame), 600);
      return;
    }
    if (targetCell.entities.includes(WUMPUS)) {
      flashBanner("teeth like cave-mouths", "danger");
      setTimeout(() => endRun("lost-wumpus", newGame), 600);
      return;
    }
    if (targetCell.entities.includes(BAT)) {
      flashBanner("claws lock around your shoulders", "danger");
      setBatCarryActive(true);
      setTimeout(() => {
        const candidates = [];
        for (let y = 0; y < ROW; y++) for (let x = 0; x < COL; x++) {
          const c = newGrid[y][x];
          if (c.path === CAVE && c.entities.length === 0) candidates.push([y, x]);
        }
        if (candidates.length) {
          const dest = candidates[Math.floor(rngRef.current() * candidates.length)];
          newGrid[ny][nx].entities = newGrid[ny][nx].entities.filter(e => e !== BAT && e !== PLAYER);
          const batCandidates = [];
          for (let y = 0; y < ROW; y++) for (let x = 0; x < COL; x++) {
            const c = newGrid[y][x];
            if (c.path === CAVE && c.entities.length === 0 && (y !== dest[0] || x !== dest[1])) batCandidates.push([y, x]);
          }
          if (batCandidates.length) {
            const nb = batCandidates[Math.floor(rngRef.current() * batCandidates.length)];
            newGrid[nb[0]][nb[1]].entities.push(BAT);
          }
          newGrid[dest[0]][dest[1]].entities.push(PLAYER);
          revealFrom(newGrid, dest[0], dest[1]);
          setGame({ ...newGame, player: dest, grid: newGrid });
          flashBanner("you wake in another cave", "system");
        }
        setBatCarryActive(false);
      }, 1100);
    }
  }

  /* ----- shooting ----- */
  function startAim() {
    if (status !== "playing" || arrows <= 0 || paused) return;
    setAiming(true);
  }
  function cancelAim() { setAiming(false); }

  function doShoot(dirName) {
    if (status !== "playing" || arrows <= 0) return;
    setAiming(false);
    setArrows(a => a - 1);
    setArrowsFired(a => a + 1);
    setMoves(m => m + 1);
    const result = fireArrow(game.grid, game.player[0], game.player[1], dirName, settings.difficulty);
    setTurnHistory(h => [...h, { t: moves + 1, type: "shoot", at: game.player, dir: dirName, hit: result.hit, note: `fired ${dirName}` }]);
    if (result.hit === "wumpus") {
      flashBanner("the bowstring sings · something heavy falls", "hit", 1800);
      setTimeout(() => endRun("won", game), 900);
      return;
    }
    flashBanner("your arrow finds only stone", "danger", 1800);
    // wumpus might move on a miss
    if (rngRef.current() < 0.5) {
      const [wy, wx] = game.wumpus;
      const dirsForWumpus = DIR_NAMES.filter(d => {
        const [dy, dx] = DIR[d];
        const t = nextCave(game.grid, wy, wx, dy, dx);
        return t && game.grid[t.cell[0]][t.cell[1]].entities.length === 0;
      });
      if (dirsForWumpus.length) {
        const pickDir = dirsForWumpus[Math.floor(rngRef.current() * dirsForWumpus.length)];
        const t = nextCave(game.grid, wy, wx, ...DIR[pickDir]);
        const [ny, nx] = t.cell;
        game.grid[wy][wx].entities = game.grid[wy][wx].entities.filter(e => e !== WUMPUS);
        game.grid[ny][nx].entities.push(WUMPUS);
        setGame({...game, wumpus: [ny, nx]});
        if (ny === game.player[0] && nx === game.player[1]) {
          flashBanner("the Wumpus is upon you", "danger");
          setTimeout(() => endRun("lost-wumpus", game), 700);
          return;
        }
      }
    }
    // Single-arrow loss
    setTimeout(() => endRun("lost-arrows", game), 1400);
  }

  /* ----- end-run ----- */
  function endRun(outcome, finalGame) {
    if (status !== "playing") return;
    setStatus(outcome);
    const seconds = Math.floor((Date.now() - startedAt.current) / 1000);
    const score = outcome === "won" ? computeScore({ moves, seconds, difficulty: settings.difficulty }) : 0;
    const runData = {
      outcome, moves, arrowsFired, arrowsLeft: arrows - (outcome === "won" ? 1 : 0),
      seconds, score, settings, finalGame, history: turnHistory,
    };
    recordRun(runData);
    setTimeout(() => {
      if (outcome === "won") go("win");
      else if (outcome === "lost-pit") go("gameover-pit");
      else if (outcome === "lost-wumpus") go("gameover-wumpus");
      else go("gameover-arrows");
    }, 900);
  }

  /* ----- keyboard ----- */
  useEffect(() => {
    function onKey(e) {
      if (paused) {
        if (e.key === "Escape") setPaused(false);
        return;
      }
      const k = e.key;
      const dirMap = {
        "ArrowUp":"up","w":"up","W":"up",
        "ArrowDown":"down","s":"down","S":"down",
        "ArrowLeft":"left","a":"left","A":"left",
        "ArrowRight":"right","d":"right","D":"right",
      };
      const dir = dirMap[k];
      if (k === "Escape") {
        if (aiming) { cancelAim(); return; }
        setPaused(true); return;
      }
      if (k === "Shift") { startAim(); return; }
      if (k === "m" || k === "M") { go("map-reveal-live"); return; }
      if (!dir) return;
      e.preventDefault();
      if (aiming) {
        doShoot(dir);
      } else {
        doMove(dir);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, status, arrows, paused, aiming]);

  /* ----- click to move (or aim-shoot when aiming) ----- */
  function onTileClick(y, x) {
    if (aiming) {
      // If they click an adjacent cave, fire that direction
      const key = `${y}-${x}`;
      if (adjacent[key]) doShoot(adjacent[key]);
      return;
    }
    const key = `${y}-${x}`;
    if (adjacent[key]) doMove(adjacent[key]);
  }

  function timeStr() {
    const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const s = String(elapsed % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div data-screen-label="04 Game" className="row" style={{
      width: "100%", height: "100%", padding: 24, gap: 20,
      background: "var(--bg)", position: "relative",
    }}>
      <div className="cave-backdrop" />

      {/* LEFT: HUD + map */}
      <div className="col gap-3 grow" style={{minWidth: 0, position: "relative", zIndex: 1}}>
        {/* TOP HUD STRIP — minimal */}
        <div className="row gap-3" style={{alignItems: "center"}}>
          <div className="row gap-2" style={{
            padding: "5px 12px",
            background: "var(--ink)",
            color: "var(--parchment)",
            borderRadius: 6,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}>
            {settings.difficulty}
          </div>
          <StatChip label="moves" value={moves} />
          <StatChip label="time" value={timeStr()} />
          <div className="grow" />
          {warnings.length > 0 && (
            <div className="row gap-1 warn-pulse" style={{
              padding: "6px 14px",
              background: "var(--accent)",
              color: "var(--parchment)",
              borderRadius: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}>
              ! {warnings.map(w => w === "smell" ? "smell of decay" : w === "draft" ? "cold draft" : "wing-rasp").join(" · ")}
            </div>
          )}
          <button className="btn btn-sm btn-ghost" onClick={() => setPaused(true)}>≡ menu</button>
        </div>

        {/* MAP */}
        <div className="grow" style={{position: "relative"}}>
          <MapView
            game={game}
            playerSprite={settings.playerSprite || "player1"}
            playerAnim={playerAnim}
            blinded={blinded}
            difficulty={settings.difficulty}
            onTileClick={onTileClick}
            revealAll={false}
            showBlood={true}
            showSlime={true}
            flicker={true}
            showDust={true}
            batCarryActive={batCarryActive}
          />
          {/* Aim choices overlay — 4 cardinal arrows around the player */}
          {aiming && (
            <AimChoices
              game={game}
              adjacent={adjacent}
              onPick={(d) => doShoot(d)}
              onCancel={cancelAim}
            />
          )}
          {/* Transient narrative banner */}
          {bannerMsg && <NarrativeBanner msg={bannerMsg} />}
          {/* On-screen controls */}
          {controlsOpen && (
            <OnScreenControls
              onMove={doMove}
              onShoot={startAim}
              onCancel={cancelAim}
              aiming={aiming}
              adjacent={adjacent}
              hasArrow={arrows > 0}
            />
          )}
        </div>
      </div>

      {/* RIGHT panel: player + senses + shoot + blinded */}
      <div className="col gap-3" style={{width: 320, position: "relative", zIndex: 1}}>
        {/* Player card */}
        <div className="panel col gap-3" style={{padding: 18}}>
          <div className="row" style={{alignItems: "center", gap: 12}}>
            <div style={{
              width: 56, height: 56,
              border: "1px solid var(--rule)",
              borderRadius: 6,
              background: "var(--cave-deep) url('assets/" + (settings.playerSprite || 'player1') + "/00.png') no-repeat center / 120%",
              imageRendering: "pixelated",
            }} />
            <div className="col gap-1 grow">
              <div className="display" style={{fontSize: 20, color: "var(--ink)"}}>
                {settings.username || "cave_diver_07"}
              </div>
              <div className="mono" style={{fontSize: 11, color: "var(--ink-3)", letterSpacing: ".06em"}}>
                tile ({game.player[0]},{game.player[1]}) · seen {game.grid.flat().filter(c => c.seen).length}/{ROW*COL}
              </div>
            </div>
          </div>
        </div>

        {/* The lone arrow */}
        <div className="panel col gap-2" style={{padding: 18}}>
          <div className="row" style={{alignItems: "baseline"}}>
            <div className="label" style={{color: "var(--ink-3)"}}>your only arrow</div>
            <div className="grow" />
            <div className="mono" style={{
              fontSize: 11, color: arrows > 0 ? "var(--accent)" : "var(--ink-3)",
              letterSpacing: ".14em",
              fontWeight: 700,
            }}>
              {arrows > 0 ? "● READY" : "○ SPENT"}
            </div>
          </div>
          <div className="row gap-2" style={{alignItems: "center"}}>
            <PixelArrowIcon size={28} dim={arrows <= 0} />
            <div className="grow" style={{fontSize: 13, color: "var(--ink-2)", fontStyle: "italic"}}>
              {arrows > 0 ? "make it count" : "no shafts left"}
            </div>
          </div>
          <button
            className={"btn " + (aiming ? "btn-danger" : "btn-primary")}
            onClick={() => aiming ? cancelAim() : startAim()}
            disabled={arrows <= 0}
            style={{
              opacity: arrows <= 0 ? 0.4 : 1,
              cursor: arrows <= 0 ? "not-allowed" : "pointer",
              fontFamily: "var(--font-display)",
              fontSize: 18,
            }}>
            {aiming ? "✕ cancel aim" : "▸ Shoot"}
          </button>
          <div className="mono" style={{fontSize: 10, color: "var(--ink-3)", textAlign: "center", letterSpacing: ".06em"}}>
            {aiming ? "pick a direction" : <>or press <span className="kbd">Shift</span></>}
          </div>
        </div>

        {/* Senses */}
        <div className="panel col gap-2" style={{padding: 18}}>
          <div className="row" style={{alignItems: "baseline"}}>
            <div className="label" style={{color: "var(--ink-3)"}}>senses</div>
            <div className="grow" />
            {warnings.length === 0 && (
              <div className="mono" style={{fontSize: 11, color: "var(--ink-3)"}}>silent</div>
            )}
          </div>
          <div className="col gap-2">
            <SenseRow active={warnings.includes("smell")}  icon="W" label="smell of decay"  hint="wumpus close" color="var(--accent)" />
            <SenseRow active={warnings.includes("draft")}  icon="●" label="a cold draft"    hint="pit nearby"   color="var(--ink)" />
            <SenseRow active={warnings.includes("squeak")} icon="B" label="leather wings"   hint="bat in reach" color="var(--accent)" />
          </div>
        </div>

        {/* Controls toggle + blinded */}
        <div className="col gap-2">
          <button onClick={() => setControlsOpen(c => !c)} className="btn"
            style={{
              background: controlsOpen ? "var(--ink)" : "rgba(241,230,205,0.94)",
              color: controlsOpen ? "var(--parchment)" : "var(--ink)",
              fontFamily: "var(--font-mono)",
              fontSize: 11, letterSpacing: ".14em",
              textTransform: "uppercase",
              justifyContent: "space-between",
            }}>
            <span>{controlsOpen ? "■ controls visible" : "□ use controls buttons"}</span>
            <span className="mono" style={{fontSize: 10, opacity: 0.7}}>{controlsOpen ? "ON" : "OFF"}</span>
          </button>
          <button onClick={() => setBlinded(b => !b)} className="btn"
            style={{
              background: blinded ? "var(--ink)" : "rgba(241,230,205,0.94)",
              color: blinded ? "var(--parchment)" : "var(--ink)",
              fontFamily: "var(--font-mono)",
              fontSize: 11, letterSpacing: ".14em",
              textTransform: "uppercase",
              justifyContent: "space-between",
            }}>
            <span>{blinded ? "■ blinded · senses only" : "□ blinded mode"}</span>
            <span className="mono" style={{fontSize: 10, opacity: 0.7}}>{blinded ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Pause overlay */}
      {paused && (
        <PauseMenu
          onResume={() => setPaused(false)}
          onReplay={() => { setPaused(false); go("replay-same"); }}
          onMenu={() => { setPaused(false); go("menu"); }}
          settings={settings}
        />
      )}
    </div>
  );
}

/* -----------------------------------------------------------
   AimChoices — 4 arrow buttons around the player tile
----------------------------------------------------------- */
function AimChoices({ game, adjacent, onPick, onCancel }) {
  const [py, px] = game.player;
  const cellW = 100 / COL;
  const cellH = 100 / ROW;

  // Arrow positions are at the four cardinal cells around player.
  // We render them ON the map plane so they sit "in the cave".
  const placements = [
    { dir: "up",    label: "↑", dy: -1, dx: 0 },
    { dir: "down",  label: "↓", dy:  1, dx: 0 },
    { dir: "left",  label: "←", dy:  0, dx: -1 },
    { dir: "right", label: "→", dy:  0, dx:  1 },
  ];

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
    }}>
      {/* dim overlay so aim choices read clearly */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(6, 12, 13, 0.55)",
        pointerEvents: "auto",
      }} onClick={onCancel} />

      {/* player highlight ring */}
      <div style={{
        position: "absolute",
        left: `${px * cellW}%`,
        top:  `${py * cellH}%`,
        width: `${cellW}%`,
        height: `${cellH}%`,
        boxShadow: "0 0 0 2px var(--accent), 0 0 24px 8px rgba(196, 74, 58, 0.6)",
        borderRadius: 4,
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {placements.map(p => {
        // Position aim arrow at player ± dy/dx (clamped visually — toroidal wrap means we just lay it adjacent)
        const ay = (py + p.dy + ROW) % ROW;
        const ax = (px + p.dx + COL) % COL;
        const canFire = true; // always allow firing in any cardinal — arrow flies through tunnels
        return (
          <button key={p.dir}
            onClick={() => onPick(p.dir)}
            aria-label={`fire ${p.dir}`}
            style={{
              position: "absolute",
              left: `${ax * cellW + cellW * 0.20}%`,
              top:  `${ay * cellH + cellH * 0.20}%`,
              width: `${cellW * 0.60}%`,
              height: `${cellH * 0.60}%`,
              background: "rgba(196, 74, 58, 0.92)",
              color: "var(--parchment)",
              border: "2px solid var(--parchment)",
              borderRadius: 6,
              fontSize: 28,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              pointerEvents: "auto",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              animation: "warn-pulse 1.6s ease-in-out infinite",
              transition: "transform 80ms ease",
              zIndex: 2,
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            {p.label}
          </button>
        );
      })}

      {/* helper banner */}
      <div style={{
        position: "absolute",
        top: 18, left: "50%", transform: "translateX(-50%)",
        padding: "10px 18px",
        background: "rgba(13, 21, 23, 0.92)",
        color: "var(--parchment)",
        border: "1px solid var(--accent)",
        borderRadius: 8,
        fontFamily: "var(--font-display)",
        fontSize: 17,
        letterSpacing: ".01em",
        zIndex: 3,
        pointerEvents: "none",
      }}>
        choose a direction · <span className="mono" style={{fontSize: 11, color: "rgba(241,230,205,0.6)"}}>arrow keys · click · <span className="kbd" style={{color: "var(--parchment)"}}>Esc</span> to cancel</span>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   OnScreenControls — D-pad + Shoot button overlay
----------------------------------------------------------- */
function OnScreenControls({ onMove, onShoot, onCancel, aiming, hasArrow }) {
  return (
    <div style={{
      position: "absolute",
      right: 18, bottom: 18, zIndex: 15,
      display: "flex", gap: 16, alignItems: "flex-end",
      background: "rgba(13, 21, 23, 0.92)",
      padding: 14, borderRadius: 12,
      border: "1px solid rgba(241,230,205,0.14)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    }}>
      {/* D-pad */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 44px)",
        gridTemplateRows: "repeat(3, 44px)",
        gap: 4,
      }}>
        <div />
        <DPadBtn dir="up"    label="↑" onPress={() => onMove("up")} />
        <div />
        <DPadBtn dir="left"  label="←" onPress={() => onMove("left")} />
        <div style={{
          background: "rgba(241,230,205,0.04)",
          borderRadius: 4,
        }} />
        <DPadBtn dir="right" label="→" onPress={() => onMove("right")} />
        <div />
        <DPadBtn dir="down"  label="↓" onPress={() => onMove("down")} />
        <div />
      </div>
      {/* Shoot */}
      <button
        onClick={() => aiming ? onCancel() : onShoot()}
        disabled={!hasArrow}
        style={{
          width: 88, height: 88, borderRadius: 44,
          background: aiming ? "transparent" : (hasArrow ? "var(--accent)" : "rgba(241,230,205,0.08)"),
          color: aiming ? "var(--accent)" : "var(--parchment)",
          border: aiming ? "2px solid var(--accent)" : "2px solid var(--accent-deep)",
          fontFamily: "var(--font-display)",
          fontSize: aiming ? 14 : 18,
          fontWeight: 700,
          cursor: hasArrow ? "pointer" : "not-allowed",
          opacity: hasArrow ? 1 : 0.4,
          letterSpacing: ".05em",
          textTransform: aiming ? "uppercase" : "none",
          transition: "all 120ms ease",
        }}>
        {aiming ? "CANCEL" : "Shoot"}
      </button>
    </div>
  );
}

function DPadBtn({ label, onPress }) {
  return (
    <button onClick={onPress}
      style={{
        background: "var(--parchment)",
        color: "var(--ink)",
        border: "1px solid var(--ink)",
        borderRadius: 6,
        fontSize: 20,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 80ms ease",
      }}
      onMouseDown={e => e.currentTarget.style.transform = "translateY(1px)"}
      onMouseUp={e => e.currentTarget.style.transform = "translateY(0)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
      {label}
    </button>
  );
}

/* -----------------------------------------------------------
   NarrativeBanner — transient message in the middle of the map
----------------------------------------------------------- */
function NarrativeBanner({ msg }) {
  return (
    <div key={msg.id}
      style={{
        position: "absolute",
        bottom: "10%", left: "50%", transform: "translateX(-50%)",
        padding: "14px 24px",
        background: msg.kind === "danger" ? "rgba(196, 74, 58, 0.94)" :
                    msg.kind === "hit"    ? "rgba(212, 168, 87, 0.94)" :
                    "rgba(13, 21, 23, 0.92)",
        color: "var(--parchment)",
        borderRadius: 8,
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontSize: 19,
        letterSpacing: ".005em",
        boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
        zIndex: 9,
        pointerEvents: "none",
        animation: "banner-in 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        maxWidth: "70%",
        textAlign: "center",
      }}>
      {msg.text}
    </div>
  );
}

function SenseRow({ active, icon, label, hint, color }) {
  return (
    <div className="row gap-3" style={{
      padding: "10px 12px",
      borderRadius: 6,
      background: active ? "rgba(196, 74, 58, 0.08)" : "rgba(27,22,18,0.03)",
      border: active ? "1px solid rgba(196, 74, 58, 0.35)" : "1px solid transparent",
      transition: "all 240ms ease",
      opacity: active ? 1 : 0.55,
      alignItems: "center",
    }}>
      <div className="mono" style={{
        width: 22, height: 22, borderRadius: 4,
        background: active ? color : "rgba(27,22,18,0.18)",
        color: active ? "var(--parchment)" : "var(--ink-3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700,
      }}>{icon}</div>
      <div className="col gap-1 grow" style={{minWidth: 0}}>
        <div style={{fontSize: 13, fontWeight: 500, color: active ? "var(--ink)" : "var(--ink-3)"}}>{label}</div>
      </div>
      <div className="mono" style={{fontSize: 10, color: "var(--ink-3)", letterSpacing: ".06em", whiteSpace: "nowrap"}}>
        {active ? hint : "—"}
      </div>
    </div>
  );
}

function PauseMenu({ onResume, onReplay, onMenu, settings }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "rgba(6,12,13,0.84)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 50,
    }}>
      <div className="panel col gap-2" style={{padding: 28, width: 340}}>
        <div className="display" style={{fontSize: 28, color: "var(--ink)", marginBottom: 4}}>
          Paused
        </div>
        <div className="mono" style={{fontSize: 11, color: "var(--ink-3)", marginBottom: 10, letterSpacing: ".08em"}}>
          {settings.difficulty}
        </div>
        <button className="btn btn-primary btn-lg" onClick={onResume}>▸ resume</button>
        <button className="btn" onClick={onReplay}>↻ new run</button>
        <button className="btn btn-ghost" onClick={onMenu}>← back to menu</button>
      </div>
    </div>
  );
}

Object.assign(window, { GameScreen, PauseMenu, SenseRow, AimChoices, OnScreenControls, NarrativeBanner, ARROW_TOTAL });
