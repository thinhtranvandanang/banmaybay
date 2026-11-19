import { Check, Copy, Download, X } from 'lucide-react';
import { useState } from 'react';
import { PYTHON_SPACE_SHOOTER_SOURCE } from '../utils/pythonSource';

interface PythonSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PythonSourceModal({ isOpen, onClose }: PythonSourceModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PYTHON_SPACE_SHOOTER_SOURCE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([PYTHON_SPACE_SHOOTER_SOURCE], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'space_shooter.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="python-modal-title"
    >
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-slate-800 bg-[#0d091c] shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div>
            <h2 id="python-modal-title" className="font-display text-lg font-bold text-slate-100">
              Python Pygame Source (space_shooter.py)
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Requires Python 3.8+ · pip install pygame · python space_shooter.py
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-purple-500/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 whitespace-nowrap shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .py</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close source modal"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-auto p-5">
          <pre className="font-mono-tabular text-xs leading-relaxed text-slate-300">
            <code>{PYTHON_SPACE_SHOOTER_SOURCE}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
