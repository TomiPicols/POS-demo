import { useState, useRef, useEffect } from 'react';

type Option = { value: string; label: string };
type SelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
};

const SelectField = ({ value, onChange, options, className = '' }: SelectFieldProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-10 px-3 pr-7 rounded-lg border border-borderSoft bg-white text-sm text-text shadow-[0_6px_16px_-12px_rgba(15,23,42,0.26)] hover:border-accent/40 focus:outline-none focus:border-[#c44b40] focus:shadow-[0_0_0_2px_rgba(196,75,64,0.18),0_8px_18px_-14px_rgba(15,23,42,0.3)] transition"
      >
        <span>{current?.label}</span>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#c44b40] text-sm">▾</span>
      </button>
      {open && (
        <div className="absolute mt-1 w-full rounded-lg border border-borderSoft bg-white shadow-[0_12px_22px_-18px_rgba(15,23,42,0.3)] z-20 overflow-hidden">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition ${
                  active ? 'bg-[#fbe7e4] text-[#b13c33] font-semibold' : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SelectField;
