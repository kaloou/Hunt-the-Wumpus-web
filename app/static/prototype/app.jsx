/* ============================================================
   app.jsx — Top-level router + screen picker + tweaks
============================================================ */
const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR, useCallback: uC } = React;

const SCREENS = [
  { id: "menu",         num: "01", name: "Main Menu",       sub: "B · looping map + side menu" },
  { id: "auth",         num: "02", name: "Sign in / Register", sub: "A · tabbed panel" },
  { id: "level",        num: "03", name: "Level Select",    sub: "difficulty + modes" },
  { id: "game",         num: "04", name: "Game Screen",     sub: "B · map + senses + lone arrow" },
  { id: "gameover-wumpus", num: "05", name: "Game Over · Wumpus", sub: "devoured" },
  { id: "gameover-arrows", num: "06", name: "Game Over · Missed", sub: "one chance, gone" },
  { id: "win",          num: "07", name: "Win",             sub: "cinematic · score · actions" },
  { id: "leaderboard",  num: "08", name: "Leaderboard",     sub: "A · filtered table, you pinned" },
  { id: "map-reveal",   num: "09", name: "Map Reveal",      sub: "B · scrubber + moments" },
];

/* Build a demo finished run so end-state screens are always reachable */
function buildDemoRun() {
  const settings = { seed: 1337, difficulty: "normal", playerSprite: "player1", username: "cave_diver_07" };
  const initial = generateMap(settings.seed, settings.difficulty);
  // Stitch together a fake history — walk player a few caves, then "shoot wumpus".
  const grid = initial.grid;
  let pos = initial.player.slice();
  const history = [{ t: 0, type: "spawn", at: pos, note: "you step into damp stone" }];

  // walk neighbors greedily for up to 12 moves toward the wumpus
  const target = initial.wumpus;
  let arrowsFired = 0;
  let moves = 0;
  for (let i = 0; i < 14; i++) {
    // find adjacent cave closest (by toroidal manhattan) to target
    const options = [];
    for (const dirName of DIR_NAMES) {
      const [dy, dx] = DIR[dirName];
      const t = nextCave(grid, pos[0], pos[1], dy, dx);
      if (!t) continue;
      const [ny, nx] = t.cell;
      const cell = grid[ny][nx];
      if (cell.path === PIT) continue;
      if (cell.entities.includes(BAT)) continue;
      if (cell.entities.includes(WUMPUS)) continue;
      const ddy = Math.min(Math.abs(ny - target[0]), ROW - Math.abs(ny - target[0]));
      const ddx = Math.min(Math.abs(nx - target[1]), COL - Math.abs(nx - target[1]));
      options.push({ dir: dirName, dest: [ny, nx], dist: ddy + ddx });
    }
    if (!options.length) break;
    options.sort((a, b) => a.dist - b.dist);
    const pick = options[0];
    // Reveal new tiles
    revealFrom(grid, pick.dest[0], pick.dest[1]);
    grid[pos[0]][pos[1]].entities = grid[pos[0]][pos[1]].entities.filter(e => e !== PLAYER);
    grid[pick.dest[0]][pick.dest[1]].entities.push(PLAYER);
    pos = pick.dest;
    moves++;
    history.push({ t: moves, type: "move", at: pos, dir: pick.dir, note: `moved ${pick.dir}` });

    // If now adjacent to wumpus, fire
    let canFireAt = null;
    for (const dirName of DIR_NAMES) {
      const [dy, dx] = DIR[dirName];
      const t = nextCave(grid, pos[0], pos[1], dy, dx);
      if (!t) continue;
      const [ny, nx] = t.cell;
      if (grid[ny][nx].entities.includes(WUMPUS)) { canFireAt = dirName; break; }
    }
    if (canFireAt) {
      moves++;
      arrowsFired++;
      history.push({ t: moves, type: "shoot", at: pos, dir: canFireAt, hit: "wumpus", note: "killing shot" });
      break;
    }
  }

  return {
    outcome: "won",
    moves,
    arrowsFired,
    arrowsLeft: ARROW_TOTAL - arrowsFired,
    seconds: 124,
    settings,
    finalGame: { ...initial, grid, player: pos },
    history,
    log: [],
  };
}

/* ----------------------------------------------------------- */

function App() {
  const [screen, setScreen] = uS("picker"); // start with screen picker
  const [previousScreen, setPreviousScreen] = uS(null);
  const [signedIn, setSignedIn] = uS(false);
  const [username, setUsername] = uS("cave_diver_07");
  const [pickerOpen, setPickerOpen] = uS(true);

  // active live game state (only filled when in "game" screens)
  const [liveGame, setLiveGame] = uS(null);
  const [liveSettings, setLiveSettings] = uS(null);
  const [lastRun, setLastRun] = uS(null);

  // tweaks
  const [tweaks, setTweaks] = uS(window.useTweaks ? null : null);

  // demo run for end-state screens
  const demoRun = uM(() => buildDemoRun(), []);

  function go(target) {
    if (target === "replay-same") {
      // restart with same settings
      const s = liveSettings || (lastRun ? lastRun.settings : null) || demoRun.settings;
      startGame(s);
      return;
    }
    if (target === "gameover-back") {
      setScreen(previousScreen || "gameover-pit");
      return;
    }
    if (target === "map-reveal-live") {
      // peek at the current live map fully revealed
      const peekRun = {
        outcome: "playing",
        moves: 0, arrowsFired: 0, seconds: 0,
        settings: liveSettings,
        finalGame: liveGame,
        history: [{ t: 0, type: "spawn", at: liveGame.player, note: "current position" }],
        log: [],
      };
      setLastRun(peekRun);
      setPreviousScreen("game");
      setScreen("map-reveal");
      return;
    }
    if (target.startsWith("gameover")) {
      setPreviousScreen(target);
    }
    setScreen(target);
  }

  function startGame(settings) {
    const s = { ...settings, username, playerSprite: settings.playerSprite || "player1" };
    const game = generateMap(s.seed, s.difficulty);
    setLiveGame(game);
    setLiveSettings(s);
    setLastRun(null);
    setScreen("game");
  }

  function recordRun(run) {
    setLastRun({ ...run, settings: liveSettings });
  }

  function signIn(name) {
    setUsername(name);
    setSignedIn(true);
  }

  // Use the demo run for end-state screens if there's no real one
  const runForEndScreens = lastRun || demoRun;

  // The screen-picker FAB is always visible (so user can jump anywhere)
  return (
    <div className="app">
      <div className="cave-backdrop" />

      {/* Routed screen */}
      {screen === "menu" && (
        <MainMenuScreen go={go} signedIn={signedIn} username={username} />
      )}
      {screen === "auth" && (
        <AuthScreen go={go} signIn={signIn} />
      )}
      {screen === "level" && (
        <LevelSelectScreen go={go} start={startGame} />
      )}
      {screen === "game" && liveGame && (
        <GameScreen
          game={liveGame}
          setGame={setLiveGame}
          settings={liveSettings}
          go={go}
          recordRun={recordRun}
        />
      )}
      {screen === "game" && !liveGame && (
        <EmptyGameRedirect onStart={() => startGame({ seed: 1337, difficulty: "normal", blinded: false })} />
      )}
      {screen.startsWith("gameover") && (
        <GameOverScreen
          cause={screen === "gameover-pit" ? "pit" : screen === "gameover-wumpus" ? "wumpus" : "arrows"}
          run={runForEndScreens}
          go={go}
        />
      )}
      {screen === "win" && (
        <WinScreen run={runForEndScreens} go={go} />
      )}
      {screen === "leaderboard" && (
        <LeaderboardScreen go={go} run={runForEndScreens} />
      )}
      {screen === "map-reveal" && (
        <MapRevealScreen run={runForEndScreens} go={go} />
      )}
      {(screen === "picker") && null}

      {/* Picker overlay */}
      {pickerOpen && (
        <div className="screen-picker">
          <div className="col gap-3" style={{textAlign: "center"}}>
            <Wordmark scale={0.9} />
            <div style={{
              color: "rgba(241,230,205,0.6)",
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 18,
              maxWidth: 520,
            }}>
              clickable prototype — pick any of the 9 screens. All are reachable from inside the flow too.
            </div>
          </div>
          <div className="grid">
            {SCREENS.map(s => (
              <button key={s.id} className="screen-card"
                onClick={() => {
                  setPickerOpen(false);
                  if (s.id === "game") {
                    startGame({ seed: 1337, difficulty: "normal", blinded: false });
                  } else {
                    setScreen(s.id);
                  }
                }}>
                <div className="num">screen · {s.num}</div>
                <div className="name">{s.name}</div>
                <div className="sub">{s.sub}</div>
              </button>
            ))}
          </div>
          <div className="row gap-2">
            <button className="btn btn-primary btn-lg" onClick={() => { setScreen("menu"); setPickerOpen(false); }}>
              ▸ start at main menu
            </button>
          </div>
        </div>
      )}

      {/* FAB to reopen picker */}
      {!pickerOpen && (
        <button className="picker-fab" onClick={() => setPickerOpen(true)}>
          ▦ screens
        </button>
      )}

      {/* Tweaks */}
      <TweaksController
        onApply={(t) => {
          setTweaks(t);
          // live-apply to active game
          if (liveSettings) setLiveSettings(s => ({ ...s, playerSprite: t.playerSprite || s.playerSprite, blinded: t.blinded }));
        }}
        onDifficultyPreview={(d) => {
          // If user is on level select, doesn't matter; just propagate.
        }}
      />

      {/* Audio elements (muted, placeholder file paths) */}
      <audio id="audio-music-menu"     src="assets/audio/menu.mp3"     loop muted preload="none" />
      <audio id="audio-music-gameplay" src="assets/audio/gameplay.mp3" loop muted preload="none" />
      <audio id="audio-sfx-shoot"      src="assets/audio/sfx-shoot.mp3" muted preload="none" />
      <audio id="audio-sfx-bat"        src="assets/audio/sfx-bat.mp3"   muted preload="none" />
      <audio id="audio-sfx-death"      src="assets/audio/sfx-death.mp3" muted preload="none" />
    </div>
  );
}

function EmptyGameRedirect({ onStart }) {
  return (
    <div className="col" style={{
      width:"100%", height:"100%", alignItems:"center", justifyContent: "center", gap: 16,
      position:"relative",
    }}>
      <div className="cave-backdrop" />
      <div style={{position:"relative", zIndex:1, color: "var(--parchment)"}}>No active run.</div>
      <button className="btn btn-primary" onClick={onStart} style={{position:"relative", zIndex:1}}>▸ start a demo run</button>
    </div>
  );
}


/* -------------------- Tweaks controller -------------------- */
function TweaksController({ onApply }) {
  const [open, setOpen] = uS(false);
  const [t, setTweak] = window.useTweaks ? window.useTweaks(/*EDITMODE-BEGIN*/{
    "playerSprite": "player1",
    "blinded": false,
    "soundtrack": false,
    "difficulty": "normal"
  }/*EDITMODE-END*/) : [{}, () => {}];

  uE(() => {
    function onMsg(e) {
      if (e.data?.type === "__activate_edit_mode") setOpen(true);
      if (e.data?.type === "__deactivate_edit_mode") setOpen(false);
    }
    window.addEventListener("message", onMsg);
    try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch {}
    return () => window.removeEventListener("message", onMsg);
  }, []);

  uE(() => { onApply(t); }, [t]);

  if (!open) return null;
  const TP = window.TweaksPanel;
  const TS = window.TweakSection;
  const TR = window.TweakRadio;
  const TT = window.TweakToggle;
  if (!TP) return null;
  return (
    <TP onClose={() => { setOpen(false); try { window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); } catch {} }}>
      <TS title="Difficulty preview">
        <TR value={t.difficulty} onChange={v => setTweak("difficulty", v)}
          options={[
            { value: "easy",   label: "Easy" },
            { value: "normal", label: "Normal" },
            { value: "hard",   label: "Hard" },
          ]} />
      </TS>
      <TS title="Vision">
        <TT label="Blinded mode" value={t.blinded} onChange={v => setTweak("blinded", v)} />
      </TS>
      <TS title="Audio">
        <TT label="Soundtrack" value={t.soundtrack} onChange={v => {
          setTweak("soundtrack", v);
          const a = document.getElementById("audio-music-gameplay");
          if (a) a.muted = !v;
        }} />
      </TS>
      <TS title="Player sprite">
        <TR value={t.playerSprite} onChange={v => setTweak("playerSprite", v)}
          options={[
            { value: "player1", label: "Soldier 1" },
            { value: "player2", label: "Soldier 2" },
          ]} />
      </TS>
    </TP>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
