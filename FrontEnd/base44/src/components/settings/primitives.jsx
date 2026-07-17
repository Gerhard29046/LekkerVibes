import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle } from 'lucide-react';

// Section-identity colours used throughout Settings — a controlled palette
// so each category reads as its own colourful "place" without the page
// turning into a rainbow. Kept separate from the user's profile accent
// theme, which is reserved for active/selected states.
export const SECTION_COLORS = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-800', ring: 'ring-teal-200', solid: '#0F766E' },
  coral: { bg: 'bg-coral/10', text: 'text-[#C95145]', ring: 'ring-coral/30', solid: '#F97366' },
  green: { bg: 'bg-lime-50', text: 'text-[#4D7C0F]', ring: 'ring-lime-200', solid: '#65A30D' },
  amber: { bg: 'bg-amber-50', text: 'text-[#A95405]', ring: 'ring-amber-200', solid: '#D97706' },
  sky: { bg: 'bg-sky-50', text: 'text-[#036994]', ring: 'ring-sky-200', solid: '#0284C7' },
  peach: { bg: 'bg-[#FFF0E3]', text: 'text-[#B85E27]', ring: 'ring-[#FFD2AE]', solid: '#EA8A4A' },
  lavender: { bg: 'bg-[#F3EEFF]', text: 'text-[#6D3FD1]', ring: 'ring-[#D8C8FF]', solid: '#8B5CF6' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-800', ring: 'ring-blue-200', solid: '#2563EB' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200', solid: '#475569' },
  red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', solid: '#DC2626' },
};

export function IconBlock({ icon: Icon, color = 'teal', size = 'md' }) {
  const c = SECTION_COLORS[color] || SECTION_COLORS.teal;
  const dims = size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconDims = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className={`${dims} rounded-2xl flex items-center justify-center shrink-0 ${c.bg} ${c.text}`}>
      <Icon className={iconDims} />
    </div>
  );
}

export function PanelHeader({ icon, color, title, description }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <IconBlock icon={icon} color={color} size="lg" />
      <div className="min-w-0">
        <h1 className="font-body text-2xl sm:text-[28px] font-bold text-slate-950 leading-tight">{title}</h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function SettingsSection({ title, children, className = '' }) {
  return (
    <section className={`rounded-[22px] border border-slate-200 bg-white/95 p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,76,92,0.05)] ${className}`}>
      {title && <h2 className="font-body text-lg font-bold text-slate-900 mb-4">{title}</h2>}
      {children}
    </section>
  );
}

// Left label/description + right control — the standard settings row shape
// used across every panel. Minimum 64px click target per spec.
export function SettingsRow({ label, description, children, themeColor }) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 min-h-[64px] transition-all hover:shadow-sm"
      style={{ '--row-hover': themeColor || '#0F766E' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = themeColor || '#CBD5E1'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
    >
      <div className="min-w-0">
        <p className="font-bold text-[15px] text-slate-900">{label}</p>
        {description && <p className="mt-1 text-[13px] leading-5 text-slate-500">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsToggle({ checked, onChange, themeColor = '#0F766E', disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className="relative w-12 h-7 rounded-full transition-colors disabled:opacity-50"
      style={{ background: checked ? themeColor : '#E2E8F0' }}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  );
}

export function SettingsSelect({ value, onChange, options, themeColor }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 transition-shadow"
      style={{ '--tw-ring-color': themeColor || '#0F766E' }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function SettingsRadioCard({ selected, onClick, title, description, themeColor = '#0F766E' }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="relative text-left rounded-2xl border-2 p-4 transition-colors"
      style={{
        borderColor: selected ? themeColor : '#E2E8F0',
        background: selected ? `${themeColor}0D` : '#fff',
      }}
    >
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: themeColor }}>
          <Check className="w-3 h-3" />
        </span>
      )}
      <p className="font-bold text-sm text-slate-900 pr-6">{title}</p>
      {description && <p className="mt-1 text-xs text-slate-500 leading-5">{description}</p>}
    </motion.button>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    enabled: 'bg-teal-50 text-teal-700',
    verified: 'bg-teal-50 text-teal-700',
    current: 'bg-sky-50 text-sky-700',
    disabled: 'bg-slate-100 text-slate-500',
    unverified: 'bg-amber-50 text-amber-700',
  };
  const labels = {
    enabled: 'Enabled', verified: 'Verified', current: 'Current device',
    disabled: 'Disabled', unverified: 'Not verified',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${styles[status] || styles.disabled}`}>
      {labels[status] || status}
    </span>
  );
}

export function InlineFeedback({ status }) {
  if (!status) return null;
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={status.type + status.message}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`flex items-center gap-1.5 text-sm font-medium ${status.type === 'success' ? 'text-leaf' : 'text-coral'}`}
      >
        {status.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {status.message}
      </motion.p>
    </AnimatePresence>
  );
}

export function SaveButton({ onClick, saving, savedRecently, themeColor = '#0F766E', children = 'Save changes' }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
      style={{ background: themeColor }}
    >
      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
      {!saving && savedRecently && <Check className="w-4 h-4" />}
      {saving ? 'Saving...' : savedRecently ? 'Saved' : children}
    </button>
  );
}

// Sticky bottom bar shown while a panel has unsaved edits.
export function SaveBar({ visible, onDiscard, onSave, saving, themeColor = '#0F766E' }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-charcoal text-white rounded-2xl shadow-2xl px-5 py-3.5 max-w-[calc(100vw-2rem)]"
        >
          <span className="text-sm font-semibold whitespace-nowrap">Unsaved changes</span>
          <div className="flex items-center gap-2">
            <button onClick={onDiscard} className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-white/70 hover:text-white transition-colors">
              Discard
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold disabled:opacity-60"
              style={{ background: themeColor }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DangerZone({ title = 'Danger zone', children }) {
  return (
    <div className="rounded-[22px] border-2 border-red-200 bg-red-50/60 p-5 sm:p-6">
      <h2 className="font-body text-lg font-bold text-red-700 mb-1">{title}</h2>
      <p className="text-sm text-red-700/70 mb-4">These actions are hard to undo — read carefully before continuing.</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
