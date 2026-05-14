(function () {
  // ── Live timer ──────────────────────────────────────
  var timerEl = document.getElementById('timer');
  if (timerEl) {
    var elapsed = parseInt(timerEl.dataset.elapsed, 10) || 0;
    function fmtTime(s) {
      var m = Math.floor(s / 60);
      var sec = s % 60;
      return (m > 0 ? m + 'm ' : '') + sec + 's';
    }
    timerEl.textContent = fmtTime(elapsed);
    setInterval(function () {
      elapsed++;
      timerEl.textContent = fmtTime(elapsed);
    }, 1000);
  }

  // ── Aim mode toggle ─────────────────────────────────
  function setAiming(on) {
    var c = document.getElementById('controls-container');
    if (c) { if (on) c.classList.add('aiming-mode'); else c.classList.remove('aiming-mode'); }
  }

  // ── Keyboard handler ────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var aiming = document.getElementById('controls-container') &&
                 document.getElementById('controls-container').classList.contains('aiming-mode');

    switch (e.key) {
      case 'Escape':     e.preventDefault(); setAiming(false);    break;
      case ' ':
      case 'Shift':      e.preventDefault(); setAiming(!aiming);  break;

      case 'ArrowUp':    case 'w': case 'W':
        e.preventDefault();
        document.getElementById(aiming ? 'shoot-up'    : 'up')   ?.click(); break;
      case 'ArrowDown':  case 's': case 'S':
        e.preventDefault();
        document.getElementById(aiming ? 'shoot-down'  : 'down') ?.click(); break;
      case 'ArrowLeft':  case 'a': case 'A':
        e.preventDefault();
        document.getElementById(aiming ? 'shoot-left'  : 'left') ?.click(); break;
      case 'ArrowRight': case 'd': case 'D':
        e.preventDefault();
        document.getElementById(aiming ? 'shoot-right' : 'right')?.click(); break;
    }
  });
})();
