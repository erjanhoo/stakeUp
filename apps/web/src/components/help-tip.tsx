import { createPortal } from 'react-dom';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { CircleHelp, X } from 'lucide-react';
import { useI18n } from '../lib/i18n';
export function HelpTip({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useI18n(),
    id = useId(),
    root = useRef<HTMLSpanElement>(null),
    panel = useRef<HTMLDivElement>(null),
    button = useRef<HTMLButtonElement>(null),
    [open, setOpen] = useState(false),
    [position, setPosition] = useState({ left: 12, top: 60 });
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node) && !panel.current?.contains(e.target as Node))
        setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    const resize = () => setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', resize);
    };
  }, [open]);
  return (
    <span ref={root} className="help-tip">
      <button
        ref={button}
        className="help-trigger"
        type="button"
        aria-label={t(title)}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          const r = button.current!.getBoundingClientRect();
          setPosition({
            left: Math.max(12, Math.min(r.left, innerWidth - 312)),
            top: Math.min(r.bottom + 8, Math.max(12, innerHeight - 260)),
          });
          setOpen((v) => !v);
        }}
      >
        <CircleHelp size={17} />
      </button>
      {open
        ? createPortal(
            <div
              ref={panel}
              style={{
                position: 'fixed',
                left: position.left,
                top: position.top,
                right: 'auto',
                maxHeight: `min(70vh, calc(100dvh - ${position.top + 12}px))`,
                overflowY: 'auto',
              }}
              className="help-popover"
              role="dialog"
              aria-label={t(title)}
              id={id}
            >
              <strong>{t(title)}</strong>
              <button
                type="button"
                aria-label={t('Close')}
                onClick={() => {
                  setOpen(false);
                  button.current?.focus();
                }}
              >
                <X size={15} />
              </button>
              <div className="help-content">
                {typeof children === 'string' ? t(children) : children}
              </div>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
