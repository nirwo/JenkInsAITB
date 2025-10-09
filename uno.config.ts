import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'Inter:400,500,600,700',
        mono: 'Fira Code',
      },
    }),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  theme: {
    colors: {
      // DevOps Dark Theme Colors
      slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
      },
      primary: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
        950: '#1e1b4b',
      },
      success: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
        950: '#022c22',
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
        950: '#451a03',
      },
      error: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
        950: '#450a0a',
      },
      info: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554',
      },
    },
  },
  shortcuts: {
    // DevOps Admin Buttons
    'btn': 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:shadow-md',
    'btn-primary': 'btn bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 focus:ring-primary-500 border border-primary-500/20',
    'btn-secondary': 'btn bg-slate-700 text-slate-200 hover:bg-slate-600 focus:ring-slate-500 border border-slate-600',
    'btn-danger': 'btn bg-gradient-to-r from-error-600 to-error-500 text-white hover:from-error-500 hover:to-error-400 focus:ring-error-500 border border-error-500/20',
    'btn-success': 'btn bg-gradient-to-r from-success-600 to-success-500 text-white hover:from-success-500 hover:to-success-400 focus:ring-success-500 border border-success-500/20',
    'btn-ghost': 'btn bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700',
    
    // Cards
    'card': 'rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-xl backdrop-blur-sm text-slate-100',
    'card-interactive': 'card transition-all duration-300 hover:border-primary-500 hover:shadow-2xl hover:shadow-primary-500/10 cursor-pointer',
    'card-glass': 'rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6 shadow-xl text-slate-100',
    
    // Input
    'input': 'block w-full rounded-lg border-slate-600 bg-slate-800 text-slate-100 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 placeholder:text-slate-500 text-sm font-mono transition-all',
    'input-group': 'flex items-center gap-2',
    
    // Badges
    'badge': 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold font-mono border',
    'badge-success': 'badge bg-success-950/50 text-success-400 border-success-800',
    'badge-error': 'badge bg-error-950/50 text-error-400 border-error-800',
    'badge-warning': 'badge bg-warning-950/50 text-warning-400 border-warning-800',
    'badge-info': 'badge bg-info-950/50 text-info-400 border-info-800',
    'badge-slate': 'badge bg-slate-800 text-slate-300 border-slate-700',
    
    // Status indicators
    'status-dot': 'inline-block w-2 h-2 rounded-full',
    'status-online': 'status-dot bg-success-500 shadow-lg shadow-success-500/50 animate-pulse',
    'status-offline': 'status-dot bg-error-500 shadow-lg shadow-error-500/50',
    'status-idle': 'status-dot bg-warning-500 shadow-lg shadow-warning-500/50',
    
    // Metrics
    'metric-card': 'card-glass flex flex-col gap-2 hover:border-primary-500/50 transition-all',
    'metric-value': 'text-3xl font-bold font-mono bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent',
    'metric-label': 'text-xs uppercase tracking-wider text-slate-400 font-semibold',
    
    // Terminal
    'terminal': 'rounded-lg bg-slate-950 border border-slate-800 p-4 font-mono text-sm text-slate-300 overflow-x-auto shadow-inner',
    
    // Panels
    'panel': 'rounded-xl bg-slate-900 border border-slate-700 shadow-2xl',
    'panel-header': 'border-b border-slate-700 px-6 py-4 flex items-center justify-between',
    'panel-body': 'p-6',
    'panel-footer': 'border-t border-slate-700 px-6 py-4',
  },
});
