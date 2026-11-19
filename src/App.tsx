import { Code2, Heart, Pause, Play, RotateCcw, Volume2, VolumeX, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { PythonSourceModal } from './components/PythonSourceModal';
import { SpaceShooterCanvas } from './components/SpaceShooterCanvas';
import { DOUBLE_SHOT_SCORE, GameStatus, HudSnapshot, MAX_LIVES } from './types/game';
import { arcadeSound } from './utils/sound';

const HIGH_SCORE_STORAGE_KEY = 'space_shooter_neon_high_score';

function readStoredHighScore(): number {
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export default function App() {
  const [status, setStatus] = useState<GameStatus>('TITLE_MENU');
  const [muted, setMuted] = useState(false);
  const [autoFire, setAutoFire] = useState(false);
  const [showPythonModal, setShowPythonModal] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    status: 'TITLE_MENU',
    score: 0,
    lives: MAX_LIVES,
    highScore: readStoredHighScore(),
    enemiesDestroyed: 0,
    doubleShotUnlocked: false,
  }));

  useEffect(() => {
    arcadeSound.setMuted(muted);
  }, [muted]);

  const handleSnapshot = useCallback((snapshot: HudSnapshot) => {
    setHud((prev) => {
      const nextHigh = Math.max(prev.highScore, snapshot.highScore);
      if (nextHigh > prev.highScore) {
        try {
          window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(nextHigh));
        } catch {
          // Ignore storage quota errors
        }
      }
      return {
        ...snapshot,
        highScore: nextHigh,
      };
    });
  }, []);

  const handleRestart = () => {
    setResetNonce((n) => n + 1);
    setStatus('PLAYING');
  };

  const handleTogglePause = () => {
    if (status === 'PLAYING') {
      setStatus('PAUSED');
    } else if (status === 'PAUSED') {
      setStatus('PLAYING');
    } else if (status === 'TITLE_MENU' || status === 'GAME_OVER') {
      handleRestart();
    }
  };

  const statusLabel =
    status === 'PLAYING'
      ? 'Active Flight'
      : status === 'PAUSED'
        ? 'Paused'
        : status === 'GAME_OVER'
          ? 'Game Over'
          : 'Ready';

  const weaponLabel = hud.doubleShotUnlocked ? 'Twin Laser' : 'Single Laser';

  return (
    <div className="min-h-screen bg-[#060312] text-slate-100 flex flex-col">
      <header className="border-b border-slate-800/80 bg-[#080416]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-8 px-6 py-4">
          <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            Space Shooter Neon
          </span>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a
              href="#arena"
              className="transition-colors hover:text-white whitespace-nowrap shrink-0"
            >
              Arena
            </a>
            <a
              href="#flight-status"
              className="transition-colors hover:text-white whitespace-nowrap shrink-0"
            >
              Flight Status
            </a>
            <a
              href="#controls"
              className="transition-colors hover:text-white whitespace-nowrap shrink-0"
            >
              Controls
            </a>
            <button
              type="button"
              onClick={() => setShowPythonModal(true)}
              className="transition-colors hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
            >
              Python Script
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{status === 'TITLE_MENU' ? 'Launch Game' : 'New Run'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-6">
        <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          {/* Primary Focal Anchor: 400x600 Neon Space Shooter Canvas */}
          <section id="arena" aria-label="Game Arena" className="w-full">
            <SpaceShooterCanvas
              status={status}
              autoFire={autoFire}
              currentScore={hud.score}
              highScore={hud.highScore}
              resetNonce={resetNonce}
              onStatusChange={setStatus}
              onSnapshot={handleSnapshot}
            />
          </section>

          {/* Secondary Structural Panel: Telemetry, Flight Controls & Source */}
          <aside className="rounded-xl border border-slate-800/90 bg-[#0d081d] p-6">
            <div id="flight-status">
              <div className="flex items-baseline justify-between gap-4">
                <h1 className="font-display text-xl font-bold text-white">Flight Telemetry</h1>
                <span className="text-xs font-medium text-purple-300">{statusLabel}</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Destroy incoming crimson squadrons and reach {DOUBLE_SHOT_SCORE} points to activate twin lasers.
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-xs text-slate-400">Score</dt>
                  <dd className="font-mono-tabular mt-1 text-2xl font-bold text-white">
                    {hud.score}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">High Score</dt>
                  <dd className="font-mono-tabular mt-1 text-2xl font-bold text-purple-300">
                    {hud.highScore}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Lives Remaining</dt>
                  <dd className="mt-1.5 flex items-center gap-2">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      {Array.from({ length: MAX_LIVES }, (_, idx) => (
                        <Heart
                          key={idx}
                          className={`h-4 w-4 ${
                            idx < hud.lives
                              ? 'fill-[#be32e6] text-[#be32e6]'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono-tabular text-sm font-medium text-slate-200">
                      {hud.lives}/{MAX_LIVES}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Weapon System</dt>
                  <dd className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-100">
                    <Zap
                      className={`h-4 w-4 ${
                        hud.doubleShotUnlocked ? 'text-purple-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{weaponLabel}</span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 border-t border-slate-800/80 pt-6">
              <h2 className="text-sm font-semibold text-white">Flight Actions</h2>
              <div className="mt-3 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-medium text-slate-100 transition-colors hover:border-purple-500/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 whitespace-nowrap shrink-0"
                >
                  {status === 'PLAYING' ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      <span>{status === 'PAUSED' ? 'Resume' : 'Start'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-pressed={muted}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-medium text-slate-100 transition-colors hover:border-purple-500/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 whitespace-nowrap shrink-0"
                >
                  {muted ? <VolumeX className="h-3.5 w-3.5 text-slate-400" /> : <Volume2 className="h-3.5 w-3.5 text-purple-300" />}
                  <span>{muted ? 'Sound Off' : 'Sound On'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAutoFire((v) => !v)}
                  aria-pressed={autoFire}
                  className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 whitespace-nowrap shrink-0 ${
                    autoFire
                      ? 'border-purple-500/80 bg-purple-600/20 text-purple-200'
                      : 'border-slate-700 bg-slate-900/90 text-slate-200 hover:border-purple-500/60'
                  }`}
                >
                  <span>{autoFire ? 'Auto-Fire On' : 'Auto-Fire Off'}</span>
                </button>
              </div>
            </div>

            <div id="controls" className="mt-6 border-t border-slate-800/80 pt-6">
              <h2 className="text-sm font-semibold text-white">Controls</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Move Ship</dt>
                  <dd className="font-mono-tabular text-xs text-slate-200">
                    Arrows / WASD / Drag
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Fire Laser</dt>
                  <dd className="font-mono-tabular text-xs text-slate-200">
                    Space / Hold Touch
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Pause / Resume</dt>
                  <dd className="font-mono-tabular text-xs text-slate-200">P or Esc</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Restart After Game Over</dt>
                  <dd className="font-mono-tabular text-xs text-slate-200">R Key</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 border-t border-slate-800/80 pt-5 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Desktop Python Pygame Edition
              </div>
              <button
                type="button"
                onClick={() => setShowPythonModal(true)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-purple-500/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 whitespace-nowrap shrink-0"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>View Python Code</span>
              </button>
            </div>
          </aside>
        </div>
      </main>

      <PythonSourceModal
        isOpen={showPythonModal}
        onClose={() => setShowPythonModal(false)}
      />
    </div>
  );
}
