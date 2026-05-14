/* ============================================================
   tiles.jsx — Map + Tile rendering
============================================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* Map renders the grid; supports player overlay positioning,
   aim path overlay, blinded overlay, click-to-move, etc. */

const BAT_FRAMES = 16;
const WUMPUS_FRAMES = 16;

function useFrameAnim(count, fps=10, playing=true) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setFrame(f => (f + 1) % count), 1000/fps);
    return () => clearInterval(id);
  }, [count, fps, playing]);
  return frame;
}

function tunnelClassesFor(pathType, cellSeen) {
  if (!cellSeen) return [];
  // Show both halves of the diagonal once seen
  if (pathType === ULDR) return ["tile-upleft", "tile-downright"];
  if (pathType === URDL) return ["tile-upright", "tile-downleft"];
  return [];
}

function Tile({
  cell, y, x, isPlayer, playerSprite, justSeen,
  showEntities, dim, onClick, aimable, isAimEnd, blinded, showBlood, showSlime,
  batFrame, wumpusFrame,
}) {
  const seen = cell.seen;
  // In blinded mode, only show the player's own cave
  const reveal = blinded ? isPlayer : seen;

  const layers = [];

  if (!reveal) {
    return (
      <div
        className={"tile" + (onClick && aimable ? " tile-clickable" : "")}
        onClick={onClick}
        style={{opacity: dim ? 0.55 : 1}}
      >
        <div className="tile-layer tile-base tile-hidden" />
      </div>
    );
  }

  // Base path
  if (cell.path === CAVE) {
    layers.push(<div key="b" className="tile-layer tile-base tile-cave" />);
  } else if (cell.path === PIT) {
    layers.push(<div key="b" className="tile-layer tile-base tile-pit" />);
  } else if (cell.path === ULDR || cell.path === URDL) {
    for (const cls of tunnelClassesFor(cell.path, true)) {
      layers.push(<div key={cls} className={"tile-layer tile-base " + cls} />);
    }
  }

  // Overlays
  if (showBlood && cell.effects.includes(BLOOD)) {
    layers.push(<div key="blood" className="tile-layer tile-overlay tile-blood" />);
  }
  if (showSlime && cell.effects.includes(SLIME)) {
    layers.push(<div key="slime" className="tile-layer tile-overlay tile-slime" />);
  }

  // Entities (only on caves/pits, only if "showEntities" reveals them — usually map-reveal screen)
  if (showEntities) {
    if (cell.entities.includes(WUMPUS)) {
      layers.push(
        <div key="w" className="tile-layer tile-entity tile-wumpus"
          style={{backgroundImage: `url("assets/wumpus/${String(wumpusFrame ?? 0).padStart(2,"0")}.png")`}} />
      );
    }
    if (cell.entities.includes(BAT)) {
      layers.push(
        <div key="b" className="tile-layer tile-entity tile-bat"
          style={{backgroundImage: `url("assets/bat/${String(batFrame ?? 0).padStart(2,"0")}.png")`}} />
      );
    }
  }

  return (
    <div
      className={"tile" + (justSeen ? " tile-just-seen" : "") + (onClick && aimable ? " tile-clickable" : "")}
      data-y={y}
      data-x={x}
      onClick={onClick}
      style={{opacity: dim ? 0.55 : 1}}
    >
      {layers}
      {isAimEnd && <div className="aim-cell" style={{inset: 4}} />}
    </div>
  );
}

function PlayerOverlay({ game, animating, playerSprite, playerFrame, hidden }) {
  // Position the player as an absolutely-positioned sprite over the grid
  // so we can animate movement smoothly between cells.
  if (!game || hidden) return null;
  const [py, px] = game.player;
  const cellW = 100 / COL;
  const cellH = 100 / ROW;
  const left = `${px * cellW}%`;
  const top  = `${py * cellH}%`;

  return (
    <div
      className="player-overlay"
      style={{
        position: "absolute",
        left, top,
        width:  `${cellW}%`,
        height: `${cellH}%`,
        transition: animating ? `left ${animating}ms cubic-bezier(0.22, 1, 0.36, 1), top ${animating}ms cubic-bezier(0.22, 1, 0.36, 1)` : "none",
        zIndex: 7,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "15%",
          backgroundImage: `url("assets/${playerSprite}/${String(playerFrame).padStart(2,"0")}.png")`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "center",
          imageRendering: "pixelated",
          filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.7))",
        }}
      />
    </div>
  );
}

/* Renders the aim path as an SVG overlay sitting on top of the grid
   — kept only for the Win/Reveal screens; no longer used in live game. */
function AimPath({ game, aimDir, difficulty }) {
  if (!game || !aimDir) return null;
  return null;
}

/* Floating dust particles */
function DustField({ count = 12 }) {
  const particles = useMemo(() => {
    return Array.from({length: count}, (_, i) => ({
      key: i,
      left: Math.random() * 100,
      top:  Math.random() * 100,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 6,
      dx: (Math.random() - 0.5) * 60 + "px",
    }));
  }, [count]);
  return (
    <>
      {particles.map(p => (
        <div key={p.key} className="dust-particle" style={{
          left: p.left + "%",
          top: p.top + "%",
          animation: `drift ${p.duration}s linear ${p.delay}s infinite`,
          "--dx": p.dx,
        }} />
      ))}
    </>
  );
}

/* The map itself — pure presentation */
function MapView({
  game, playerSprite, playerAnim, blinded, aimDir, difficulty,
  onTileClick, revealAll, showBlood = true, showSlime = true,
  flicker = true, showDust = true, batCarryActive, hidePlayer,
}) {
  const batFrame = useFrameAnim(BAT_FRAMES, 12, true);
  const wumpusFrame = useFrameAnim(WUMPUS_FRAMES, 8, revealAll);
  const [playerFrame, setPlayerFrame] = useState(0);
  // simple player idle/sway
  useEffect(() => {
    const id = setInterval(() => setPlayerFrame(f => (f + 1) % 16), 100);
    return () => clearInterval(id);
  }, []);

  // The wumpus only animates on reveal; otherwise show static frame 00 if seen.
  const wumpusFrameToUse = revealAll ? wumpusFrame : 0;

  return (
    <div className="map-frame" style={{aspectRatio: "8 / 6", width: "100%"}}>
      <div className="map-grid">
        {game.grid.map((row, y) =>
          row.map((cell, x) => {
            const isPlayer = (game.player[0] === y && game.player[1] === x);
            const isAimEnd = false; // could highlight last aim cell
            return (
              <Tile
                key={`${y}-${x}`}
                cell={cell}
                y={y} x={x}
                isPlayer={isPlayer}
                playerSprite={playerSprite}
                blinded={blinded}
                showEntities={revealAll || (cell.seen && (cell.entities.includes(BAT) || (revealAll && cell.entities.includes(WUMPUS))))}
                showBlood={showBlood}
                showSlime={showSlime}
                onClick={onTileClick ? () => onTileClick(y, x) : undefined}
                aimable={!!onTileClick}
                isAimEnd={isAimEnd}
                batFrame={batFrame}
                wumpusFrame={wumpusFrameToUse}
              />
            );
          })
        )}
      </div>
      <PlayerOverlay
        game={game}
        animating={playerAnim ?? 0}
        playerSprite={playerSprite}
        playerFrame={playerFrame}
        hidden={hidePlayer}
      />
      <AimPath game={game} aimDir={aimDir} difficulty={difficulty} />
      {showDust && <DustField count={14} />}
      {flicker && <div className="torchlight flicker" />}
      {blinded && !revealAll && (
        <div
          className="blinded-veil"
          style={{
            "--cx": `${(game.player[1] + 0.5) * (100/COL)}%`,
            "--cy": `${(game.player[0] + 0.5) * (100/ROW)}%`,
          }}
        />
      )}
      {batCarryActive && (
        <div style={{
          position: "absolute",
          left: `${(game.player[1] + 0.5) * (100/COL)}%`,
          top: `${(game.player[0] + 0.5) * (100/ROW)}%`,
          transform: "translate(-50%, -50%)",
          width: "26%",
          height: "32%",
          backgroundImage: `url("assets/bat/${String(batFrame).padStart(2,"0")}.png")`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          imageRendering: "pixelated",
          zIndex: 8,
          animation: "bat-flash 1.4s ease-out",
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
}

Object.assign(window, { Tile, MapView, useFrameAnim, BAT_FRAMES, WUMPUS_FRAMES });
