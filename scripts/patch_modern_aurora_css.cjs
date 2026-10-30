const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(__dirname, '../frontend/src/index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Replace :root palette
const rootOld = `:root {
  /* Fonts */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Primary Brand: Deep Enterprise Blue */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-active: #1e40af;
  --color-primary-light: #eff6ff;
  --color-primary-subtle: #dbeafe;
  --color-primary-ring: rgba(37, 99, 235, 0.2);

  /* Secondary / Slate Neutral Stack (Light Mode) */
  --color-secondary: #475569;
  --color-secondary-hover: #334155;
  --color-secondary-light: #f1f5f9;

  /* Canvas & Backgrounds (Light Mode) */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-hover: #f8fafc;
  --color-card: #ffffff;
  --color-card-muted: #f8fafc;
  --color-tag-bg: #f1f5f9;

  /* Sidebar Theme (Always high-contrast dark enterprise navy) */
  --color-sidebar: #0f172a;
  --color-sidebar-surface: #1e293b;
  --color-sidebar-hover: #1e293b;
  --color-sidebar-active: #2563eb;
  --color-sidebar-text: #f8fafc;
  --color-sidebar-muted: #94a3b8;
  --color-sidebar-border: #1e293b;

  /* Borders (Light Mode) */
  --color-border: #e2e8f0;
  --color-border-subtle: #f1f5f9;
  --color-border-strong: #cbd5e1;

  /* Typography (Light Mode) */
  --color-text-main: #0f172a;
  --color-text-secondary: #334155;
  --color-text-muted: #64748b;
  --color-text-inverse: #ffffff;

  /* Semantic Statuses (Light Mode) */
  --color-danger: #e11d48;
  --color-danger-hover: #be123c;
  --color-danger-bg: #fff1f2;
  --color-danger-border: #fecdd3;
  --color-danger-text: #9f1239;

  --color-success: #16a34a;
  --color-success-hover: #15803d;
  --color-success-bg: #f0fdf4;
  --color-success-border: #bbf7d0;
  --color-success-text: #166534;

  --color-warning: #d97706;
  --color-warning-hover: #b45309;
  --color-warning-bg: #fffbeb;
  --color-warning-border: #fde68a;
  --color-warning-text: #92400e;

  --color-info: #0284c7;
  --color-info-hover: #0369a1;
  --color-info-bg: #f0f9ff;
  --color-info-border: #bae6fd;
  --color-info-text: #075985;

  --color-purple: #7c3aed;
  --color-purple-bg: #f5f3ff;
  --color-purple-border: #ddd6fe;
  --color-purple-text: #5b21b6;`;

const rootNew = `:root {
  /* Fonts */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Modern Aurora Brand Colors */
  --color-navy: #111D35;
  --color-primary: #4F72EA;
  --color-primary-hover: #3E60D6;
  --color-primary-active: #3251BF;
  --color-primary-light: #F0F4FF;
  --color-primary-subtle: #E1E8FD;
  --color-primary-ring: rgba(79, 114, 234, 0.25);

  --color-lavender: #9C8AE8;
  --color-lavender-light: #F5F3FF;
  --color-lavender-subtle: #E9E5FC;
  --color-mint: #42BBAF;
  --color-mint-subtle: #E6F7F5;
  --color-mint-text: #0E6B62;

  /* Master Modern Aurora Gradient */
  --color-primary-gradient: linear-gradient(110deg, #4F72EA 0%, #9380E9 100%);
  --color-primary-gradient-hover: linear-gradient(110deg, #4264DC 0%, #8672DE 100%);
  --color-primary-gradient-active: linear-gradient(110deg, #3756C7 0%, #7B66D4 100%);

  /* Secondary / Slate Neutral Stack */
  --color-secondary: #4A5872;
  --color-secondary-hover: #334155;
  --color-secondary-light: #F1F4F9;

  /* Canvas & Backgrounds (Modern Aurora Canvas: #F3F5FC) */
  --color-bg: #F3F5FC;
  --color-surface: #FFFFFF;
  --color-surface-hover: #F8FAFD;
  --color-card: #FFFFFF;
  --color-card-muted: #F8FAFD;
  --color-tag-bg: #EEF2FA;
  --color-table-header-bg: #F4F6FC;

  /* Sidebar Theme: Deep Navy with subtle purple tint (#111D35) */
  --color-sidebar: #111D35;
  --color-sidebar-surface: #182748;
  --color-sidebar-hover: #1E315A;
  --color-sidebar-active: #4F72EA;
  --color-sidebar-active-bg: rgba(79, 114, 234, 0.16);
  --color-sidebar-text: #F3F5FC;
  --color-sidebar-muted: #8E9CB2;
  --color-sidebar-border: #1C2D52;

  /* Borders */
  --color-border: #E2E7F3;
  --color-border-subtle: #EEF2FA;
  --color-border-strong: #CBD5E8;

  /* Typography */
  --color-text-main: #17233B;
  --color-text-secondary: #4A5872;
  --color-text-muted: #697892;
  --color-text-inverse: #FFFFFF;

  /* Semantic Statuses (Mint Teal for Success) */
  --color-danger: #E11D48;
  --color-danger-hover: #BE123C;
  --color-danger-bg: #FFF1F2;
  --color-danger-border: #FECDD3;
  --color-danger-text: #9F1239;

  --color-success: #42BBAF;
  --color-success-hover: #35A398;
  --color-success-bg: #E6F7F5;
  --color-success-border: #B2E8E2;
  --color-success-text: #0E6B62;

  --color-warning: #D97706;
  --color-warning-hover: #B45309;
  --color-warning-bg: #FFFBEB;
  --color-warning-border: #FDE68A;
  --color-warning-text: #92400E;

  --color-info: #0284C7;
  --color-info-hover: #0369A1;
  --color-info-bg: #F0F9FF;
  --color-info-border: #BAE6FD;
  --color-info-text: #075985;

  --color-purple: #9C8AE8;
  --color-purple-bg: #F5F3FF;
  --color-purple-border: #DDD6FE;
  --color-purple-text: #5B21B6;`;

// Normalize line breaks for matching
const normalize = s => s.replace(/\r\n/g, '\n');

if (normalize(css).includes(normalize(rootOld))) {
  css = normalize(css).replace(normalize(rootOld), rootNew);
  console.log('1. Updated :root palette successfully');
} else {
  console.warn('1. Warning: :root target not found exactly');
}

// 2. Replace [data-theme="dark"]
const darkOld = `[data-theme="dark"] {
  --color-bg: #0b0f19;
  --color-surface: #111827;
  --color-surface-hover: #1e293b;
  --color-card: #151e30;
  --color-card-muted: #101726;
  --color-tag-bg: #1e293b;

  --color-border: #1f293d;
  --color-border-subtle: #172033;
  --color-border-strong: #334155;

  --color-text-main: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #8292a8;

  --color-primary-light: #1e293b;
  --color-primary-subtle: #1e3a8a;

  --color-danger-bg: #371420;
  --color-danger-border: #881337;
  --color-danger-text: #fda4af;

  --color-success-bg: #062e1e;
  --color-success-border: #065f46;
  --color-success-text: #86efac;

  --color-warning-bg: #351c05;
  --color-warning-border: #78350F;
  --color-warning-text: #fde047;

  --color-info-bg: #08283d;
  --color-info-border: #075985;
  --color-info-text: #7dd3fc;

  --color-purple-bg: #2e1065;
  --color-purple-border: #5b21b6;
  --color-purple-text: #d8b4fe;

  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
}`;

const darkNew = `[data-theme="dark"] {
  --color-bg: #0C1322;
  --color-surface: #111D35;
  --color-surface-hover: #172746;
  --color-card: #15223D;
  --color-card-muted: #0F192E;
  --color-tag-bg: #1B2945;
  --color-table-header-bg: #142038;

  --color-border: #1E2F52;
  --color-border-subtle: #17243F;
  --color-border-strong: #2D426E;

  --color-text-main: #F3F5FC;
  --color-text-secondary: #C8D3E6;
  --color-text-muted: #8C9CB8;

  --color-primary-light: rgba(79, 114, 234, 0.16);
  --color-primary-subtle: rgba(79, 114, 234, 0.25);

  --color-sidebar: #0B1426;
  --color-sidebar-surface: #121D36;
  --color-sidebar-hover: #182645;
  --color-sidebar-border: #182645;

  --color-danger-bg: #371420;
  --color-danger-border: #881337;
  --color-danger-text: #FDA4AF;

  --color-success: #42BBAF;
  --color-success-bg: rgba(66, 187, 175, 0.16);
  --color-success-border: rgba(66, 187, 175, 0.35);
  --color-success-text: #5EEAD4;

  --color-warning-bg: #351C05;
  --color-warning-border: #78350F;
  --color-warning-text: #FDE047;

  --color-info-bg: #08283D;
  --color-info-border: #075985;
  --color-info-text: #7DD3FC;

  --color-purple-bg: #2E1065;
  --color-purple-border: #5B21B6;
  --color-purple-text: #D8B4FE;

  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
}`;

if (normalize(css).includes(normalize(darkOld))) {
  css = normalize(css).replace(normalize(darkOld), darkNew);
  console.log('2. Updated [data-theme="dark"] successfully');
} else {
  console.warn('2. Warning: dark theme target not found exactly');
}

// 3. Primary Button with Modern Aurora Gradient
const btnPrimaryOld = `.ent-btn--primary, .btn-primary {
  background-color: var(--color-primary);
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
}

.ent-btn--primary:hover, .btn-primary:hover {
  background-color: var(--color-primary-hover);
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
}`;

const btnPrimaryNew = `.ent-btn--primary, .btn-primary {
  background: var(--color-primary-gradient, linear-gradient(110deg, #4F72EA 0%, #9380E9 100%));
  color: #FFFFFF;
  border: 1px solid transparent;
  box-shadow: 0 2px 6px rgba(79, 114, 234, 0.25);
  transition: all 180ms cubic-bezier(0.4, 0, 0.2, 1);
}

.ent-btn--primary:hover, .btn-primary:hover {
  background: var(--color-primary-gradient-hover, linear-gradient(110deg, #4264DC 0%, #8672DE 100%));
  color: #FFFFFF;
  box-shadow: 0 4px 12px rgba(79, 114, 234, 0.35);
  transform: translateY(-1px);
}

.ent-btn--primary:active, .btn-primary:active {
  background: var(--color-primary-gradient-active, linear-gradient(110deg, #3756C7 0%, #7B66D4 100%));
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(79, 114, 234, 0.2);
}`;

if (normalize(css).includes(normalize(btnPrimaryOld))) {
  css = normalize(css).replace(normalize(btnPrimaryOld), btnPrimaryNew);
  console.log('3. Updated primary button gradient successfully');
} else {
  console.warn('3. Warning: btnPrimary target not found exactly');
}

// 4. Append comprehensive Modern Aurora Component Suite
const modernAuroraSuite = `
/* ==========================================================================
   MODERN AURORA UI SUITE: NOTIFICATION PANEL, DATA TABLE, USERS & TASKS
   ========================================================================== */

/* --- A. TOPBAR & NOTIFICATION PANEL DROPDOWN --- */
.ent-topbar__notif-popover,
.ent-topbar__notif-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 70;
  filter: drop-shadow(0 14px 32px rgba(17, 29, 53, 0.16));
}

.notification-panel-dropdown {
  width: 410px;
  max-width: min(420px, calc(100vw - 24px));
  max-height: min(620px, 75vh);
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  box-sizing: border-box;
  animation: notifPopDown 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes notifPopDown {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.notification-panel-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 0.9rem 1.1rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.header-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notif-title-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.notif-bell-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-primary-light, #F0F4FF);
  color: var(--color-primary, #4F72EA);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

[data-theme="dark"] .notif-bell-icon-wrap {
  background: rgba(79, 114, 234, 0.2);
  color: #9C8AE8;
}

.notif-heading {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-main);
  letter-spacing: -0.01em;
}

.notif-unread-count-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.15rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  background: var(--color-primary-gradient, linear-gradient(110deg, #4F72EA 0%, #9380E9 100%));
  color: #FFFFFF;
  border-radius: var(--radius-full);
  line-height: 1.2;
}

.btn-icon-close {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
}

.btn-icon-close:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-text-main);
  border-color: var(--color-border);
}

.header-actions-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.filter-pill-group {
  display: inline-flex;
  background-color: var(--color-bg);
  padding: 3px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  gap: 2px;
}

.filter-pill {
  padding: 0.25rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
}

.filter-pill:hover {
  color: var(--color-text-main);
}

.filter-pill.active {
  background-color: var(--color-surface);
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(17, 29, 53, 0.08);
}

[data-theme="dark"] .filter-pill.active {
  background-color: var(--color-card);
  color: #9C8AE8;
}

.btn-mark-all {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.28rem 0.65rem;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
}

.btn-mark-all:hover:not(:disabled) {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
  border-color: var(--color-primary-subtle);
}

.btn-mark-all:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  border-color: transparent;
}

.notification-panel-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-strong) transparent;
  max-height: calc(min(620px, 75vh) - 110px);
}

.notification-panel-body::-webkit-scrollbar {
  width: 5px;
}

.notification-panel-body::-webkit-scrollbar-thumb {
  background-color: var(--color-border-strong);
  border-radius: 4px;
}

.notification-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.notification-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.notification-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: background-color 150ms ease;
  position: relative;
  text-align: left;
}

.notification-item:hover {
  background-color: var(--color-surface-hover);
}

.notification-item.unread {
  background-color: rgba(79, 114, 234, 0.04);
}

.notification-item.unread:hover {
  background-color: rgba(79, 114, 234, 0.08);
}

.notification-item.unread::before {
  content: "";
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  background: var(--color-primary-gradient, linear-gradient(110deg, #4F72EA 0%, #9380E9 100%));
  border-radius: 0 2px 2px 0;
}

.notification-icon-col {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  background-color: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.notification-content-col {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.notification-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.notification-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-main);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.35;
}

.unread-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4F72EA;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(79, 114, 234, 0.2);
}

.notification-message {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.4;
}

.notification-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.notification-time {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.btn-mark-single-read {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-primary);
  background-color: rgba(79, 114, 234, 0.08);
  border: 1px solid rgba(79, 114, 234, 0.2);
  border-radius: var(--radius-xs);
  padding: 2px 7px;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
}

.btn-mark-single-read:hover {
  background-color: var(--color-primary);
  color: #FFFFFF;
  border-color: var(--color-primary);
}

@media (max-width: 480px) {
  .ent-topbar__notif-popover,
  .ent-topbar__notif-dropdown {
    position: fixed;
    top: 64px;
    left: 12px;
    right: 12px;
    width: auto;
  }
  .notification-panel-dropdown {
    width: 100%;
    max-width: 100%;
    max-height: calc(100vh - 80px);
  }
}

/* --- B. DATA TABLE & CARD SYSTEM (.data-table, .table-responsive-card) --- */
.table-responsive-card, .card-table {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
  overflow-y: hidden;
  margin-bottom: 1.25rem;
}

.data-table, .custom-table, .ent-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.data-table th, .custom-table th, .ent-table th {
  background-color: var(--color-table-header-bg, #F4F6FC);
  color: var(--color-text-muted);
  font-weight: 600;
  padding: 0.85rem 1.15rem;
  border-bottom: 1px solid var(--color-border);
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.data-table td, .custom-table td, .ent-table td {
  padding: 0.85rem 1.15rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-main);
  vertical-align: middle;
  transition: background-color 150ms ease;
}

.data-table tbody tr:hover, .custom-table tbody tr:hover, .ent-table tbody tr:hover {
  background-color: var(--color-surface-hover);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tr.row-disabled td {
  opacity: 0.65;
  background-color: var(--color-bg);
}

.empty-table-cell {
  text-align: center;
  padding: 3rem 1.5rem !important;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.table-loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 1.5rem;
  gap: 0.75rem;
  color: var(--color-text-muted);
}

/* User Info Layout inside Table Cell */
.user-cell-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar-initials {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-primary-light, #F0F4FF);
  color: var(--color-primary, #4F72EA);
  border: 1px solid var(--color-primary-subtle, #E1E8FD);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.825rem;
  flex-shrink: 0;
}

[data-theme="dark"] .user-avatar-initials {
  background: rgba(79, 114, 234, 0.2);
  color: #9C8AE8;
  border-color: rgba(79, 114, 234, 0.35);
}

.user-details-col {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.user-username-text {
  font-weight: 600;
  color: var(--color-text-main);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.badge-you {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-full);
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  border: 1px solid var(--color-primary-subtle);
}

.user-fullname-sub {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.user-email-text {
  font-size: 0.825rem;
  color: var(--color-text-secondary);
}

/* Action Buttons Group & Sizing */
.action-buttons-group, .table-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
}

.btn-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 180ms cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
}

.btn-icon:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
  color: var(--color-text-main);
  border-color: var(--color-border-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-xs);
}

.btn-icon-secondary {
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}

.btn-icon-secondary:hover:not(:disabled) {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
  border-color: var(--color-primary-subtle);
}

.btn-icon-danger {
  color: var(--color-danger);
  border-color: var(--color-danger-border);
  background-color: var(--color-danger-bg);
}

.btn-icon-danger:hover:not(:disabled) {
  background-color: var(--color-danger);
  color: #FFFFFF;
  border-color: var(--color-danger);
}

.btn-icon-success {
  color: var(--color-success-text);
  border-color: var(--color-success-border);
  background-color: var(--color-success-bg);
}

.btn-icon-success:hover:not(:disabled) {
  background-color: var(--color-success);
  color: #FFFFFF;
  border-color: var(--color-success);
}

.btn-icon:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

/* Role Badges */
.badge-role {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-full);
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.badge-role--admin {
  background: linear-gradient(135deg, rgba(79, 114, 234, 0.15) 0%, rgba(156, 138, 232, 0.2) 100%);
  color: #4338CA;
  border: 1px solid rgba(156, 138, 232, 0.4);
}

[data-theme="dark"] .badge-role--admin {
  background: linear-gradient(135deg, rgba(79, 114, 234, 0.25) 0%, rgba(156, 138, 232, 0.25) 100%);
  color: #C7D2FE;
  border-color: rgba(156, 138, 232, 0.4);
}

.badge-role--staff {
  background-color: var(--color-primary-light, #EFF6FF);
  color: var(--color-primary, #4F72EA);
  border: 1px solid var(--color-primary-subtle, #DBEAFE);
}

[data-theme="dark"] .badge-role--staff {
  background-color: rgba(79, 114, 234, 0.18);
  color: #93C5FD;
  border-color: rgba(79, 114, 234, 0.35);
}

.badge-role--user {
  background-color: var(--color-tag-bg, #F1F5F9);
  color: var(--color-text-secondary, #475569);
  border: 1px solid var(--color-border, #E2E8F0);
}

[data-theme="dark"] .badge-role--user {
  background-color: rgba(255, 255, 255, 0.08);
  color: #CBD5E1;
  border-color: rgba(255, 255, 255, 0.12);
}

/* Status Pills */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-full);
  font-size: 0.76rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-pill.status-active, .status-pill--active {
  background-color: #E6F7F5;
  color: #0E6B62;
  border: 1px solid #B2E8E2;
}

[data-theme="dark"] .status-pill.status-active, [data-theme="dark"] .status-pill--active {
  background-color: rgba(66, 187, 175, 0.18);
  color: #5EEAD4;
  border-color: rgba(66, 187, 175, 0.35);
}

.status-pill.status-disabled, .status-pill--disabled {
  background-color: #FFF1F2;
  color: #BE123C;
  border: 1px solid #FECDD3;
}

[data-theme="dark"] .status-pill.status-disabled, [data-theme="dark"] .status-pill--disabled {
  background-color: rgba(225, 29, 72, 0.18);
  color: #FDA4AF;
  border-color: rgba(225, 29, 72, 0.35);
}

/* Pagination Component */
.ent-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  gap: 1rem;
  flex-wrap: wrap;
}

.ent-pagination__info {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.ent-pagination__controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.ent-pagination__btn {
  min-width: 32px;
  height: 32px;
  padding: 0 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-main);
  font-size: 0.825rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 150ms ease;
}

.ent-pagination__btn:hover:not(:disabled) {
  background-color: var(--color-surface-hover);
  border-color: var(--color-primary-subtle);
  color: var(--color-primary);
}

.ent-pagination__btn.active {
  background: var(--color-primary-gradient, linear-gradient(110deg, #4F72EA 0%, #9380E9 100%));
  color: #FFFFFF;
  border-color: transparent;
  font-weight: 700;
}

.ent-pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ent-pagination__select {
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-main);
  font-size: 0.825rem;
}

/* --- C. TASK CENTER MODERN AURORA UPGRADE --- */
.task-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.task-kpi-card {
  padding: 1.15rem 1.25rem;
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 180ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  position: relative;
  overflow: hidden;
}

.task-kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}

.task-kpi-card.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(79, 114, 234, 0.2), var(--shadow-md);
}

.task-kpi-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}

.task-kpi-card--all::before {
  background: var(--color-primary-gradient, linear-gradient(110deg, #4F72EA 0%, #9380E9 100%));
}

.task-kpi-card--review::before {
  background: #4F72EA;
}

.task-kpi-card--disposition::before {
  background: #F59E0B;
}

.task-kpi-card--revision::before {
  background: #E11D48;
}

.task-kpi-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-kpi-card__label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.task-kpi-card__icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-kpi-card--all .task-kpi-card__icon-wrap {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.task-kpi-card--review .task-kpi-card__icon-wrap {
  background: #EFF6FF;
  color: #3B82F6;
}

.task-kpi-card--disposition .task-kpi-card__icon-wrap {
  background: #FEF3C7;
  color: #D97706;
}

.task-kpi-card--revision .task-kpi-card__icon-wrap {
  background: #FFE4E6;
  color: #E11D48;
}

.task-kpi-card__value {
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--color-text-main);
  line-height: 1.2;
}

.task-kpi-card__desc {
  font-size: 0.76rem;
  color: var(--color-text-muted);
}

/* Tasks Container Card */
.task-list-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.task-list-card__header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  background-color: var(--color-table-header-bg, #F4F6FC);
}

.task-item-row {
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-subtle);
  transition: background-color 150ms ease;
  gap: 1rem;
  flex-wrap: wrap;
}

.task-item-row:hover {
  background-color: var(--color-surface-hover);
}

.task-item-row:last-child {
  border-bottom: none;
}
`;

css += '\n' + modernAuroraSuite;
fs.writeFileSync(cssPath, css, 'utf8');
console.log('4. Successfully appended Modern Aurora UI suite to index.css');
