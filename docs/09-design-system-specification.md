# Seamlis — Design System Specification

**Version:** 1.0  
**Phase:** 0 — Architecture Foundation  
**Date:** 2026-08-18  
**Status:** Approved

---

## 1. Brand Identity

**Platform:** Seamlis  
**Personality:** Modern, premium, creator-first, energetic, trustworthy  
**Visual language:** Clean, bold, green-accented — green signals growth, creation, and discovery  
**Typography direction:** Geometric sans-serif — confident, readable, modern

---

## 2. Color System

### 2.1 Core Palette

```css
/* Primary Brand — Green */
--color-green-50:  #F0FDF4;
--color-green-100: #DCFCE7;
--color-green-200: #BBF7D0;
--color-green-300: #86EFAC;
--color-green-400: #4ADE80;
--color-green-500: #22C55E;
--color-green-600: #16A34A;  /* PRIMARY BRAND */
--color-green-700: #15803D;
--color-green-800: #166534;
--color-green-900: #14532D;
--color-green-950: #052E16;

/* Dark Green (Depth) */
--color-emerald-900: #064E3B;
--color-emerald-950: #022C22;  /* DARK BACKGROUND */

/* Neutral — Gray */
--color-gray-50:  #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-600: #4B5563;
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;
--color-gray-950: #030712;

/* Semantic */
--color-red-500:    #EF4444;
--color-amber-400:  #FBBF24;
--color-blue-500:   #3B82F6;
```

### 2.2 Semantic Design Tokens

#### Light Mode

```css
:root {
  /* Backgrounds */
  --bg-base:          #F8FAFC;   /* Page background */
  --bg-surface:       #FFFFFF;   /* Cards, modals */
  --bg-elevated:      #F3F4F6;   /* Hover states, secondary */
  --bg-overlay:       rgba(0, 0, 0, 0.4);

  /* Text */
  --text-primary:     #111827;
  --text-secondary:   #4B5563;
  --text-muted:       #6B7280;
  --text-disabled:    #9CA3AF;
  --text-on-brand:    #FFFFFF;

  /* Brand */
  --brand-primary:    #16A34A;
  --brand-hover:      #15803D;
  --brand-active:     #166534;
  --brand-subtle:     #DCFCE7;
  --brand-text:       #15803D;

  /* Border */
  --border-default:   #E5E7EB;
  --border-strong:    #D1D5DB;
  --border-focus:     #16A34A;

  /* Status */
  --status-success:   #16A34A;
  --status-error:     #EF4444;
  --status-warning:   #F59E0B;
  --status-info:      #3B82F6;

  /* Video specific */
  --duration-bg:      rgba(0, 0, 0, 0.8);
  --duration-text:    #FFFFFF;
}
```

#### Dark Mode

```css
[data-theme="dark"] {
  /* Backgrounds */
  --bg-base:          #071A12;   /* Deep dark green-black */
  --bg-surface:       #0F2218;   /* Card backgrounds */
  --bg-elevated:      #1A3329;   /* Hover, secondary */
  --bg-overlay:       rgba(0, 0, 0, 0.7);

  /* Text */
  --text-primary:     #F9FAFB;
  --text-secondary:   #D1D5DB;
  --text-muted:       #6B7280;
  --text-disabled:    #4B5563;
  --text-on-brand:    #FFFFFF;

  /* Brand */
  --brand-primary:    #22C55E;   /* Brighter green on dark */
  --brand-hover:      #16A34A;
  --brand-active:     #15803D;
  --brand-subtle:     rgba(34, 197, 94, 0.15);
  --brand-text:       #4ADE80;

  /* Border */
  --border-default:   #1F3D2E;
  --border-strong:    #2D5040;
  --border-focus:     #22C55E;

  /* Status */
  --status-success:   #22C55E;
  --status-error:     #F87171;
  --status-warning:   #FCD34D;
  --status-info:      #60A5FA;
}
```

---

## 3. Typography

### 3.1 Font Family

```css
/* Primary — UI Text */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;

/* Display — Hero, Large headings */
--font-display: 'Plus Jakarta Sans', 'Inter', sans-serif;

/* Mono — Code, technical */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 3.2 Type Scale

```css
--text-xs:   0.75rem;   /* 12px — Badges, captions */
--text-sm:   0.875rem;  /* 14px — Secondary labels, metadata */
--text-base: 1rem;      /* 16px — Body text */
--text-lg:   1.125rem;  /* 18px — Large body */
--text-xl:   1.25rem;   /* 20px — Section headers */
--text-2xl:  1.5rem;    /* 24px — Page headers */
--text-3xl:  1.875rem;  /* 30px — Large headers */
--text-4xl:  2.25rem;   /* 36px — Display */
--text-5xl:  3rem;      /* 48px — Hero display */
```

### 3.3 Font Weights

```css
--font-regular:   400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
--font-extrabold: 800;
```

### 3.4 Line Heights

```css
--leading-tight:   1.25;
--leading-snug:    1.375;
--leading-normal:  1.5;
--leading-relaxed: 1.625;
```

### 3.5 Usage Guidelines

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|------------|
| Page title | Plus Jakarta Sans | 3xl (30px) | Bold | tight |
| Section header | Inter | xl (20px) | Semibold | snug |
| Card title | Inter | base (16px) | Medium | snug |
| Body text | Inter | base (16px) | Regular | normal |
| Caption / metadata | Inter | sm (14px) | Regular | normal |
| Badge | Inter | xs (12px) | Medium | tight |
| Button | Inter | sm (14px) | Semibold | tight |
| Video duration | Inter | xs (12px) | Medium | tight |

---

## 4. Spacing System

```css
/* 4px base unit */
--space-0:   0;
--space-1:   0.25rem;  /* 4px */
--space-2:   0.5rem;   /* 8px */
--space-3:   0.75rem;  /* 12px */
--space-4:   1rem;     /* 16px */
--space-5:   1.25rem;  /* 20px */
--space-6:   1.5rem;   /* 24px */
--space-8:   2rem;     /* 32px */
--space-10:  2.5rem;   /* 40px */
--space-12:  3rem;     /* 48px */
--space-16:  4rem;     /* 64px */
--space-20:  5rem;     /* 80px */
--space-24:  6rem;     /* 96px */
```

---

## 5. Border Radius

```css
--radius-sm:   0.25rem;   /* 4px — Tags, small badges */
--radius-md:   0.5rem;    /* 8px — Buttons, inputs */
--radius-lg:   0.75rem;   /* 12px — Cards */
--radius-xl:   1rem;      /* 16px — Large cards, panels */
--radius-2xl:  1.5rem;    /* 24px — Modals */
--radius-full: 9999px;    /* Pills, avatars */
```

---

## 6. Shadow System

```css
--shadow-sm:    0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md:    0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg:    0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl:    0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-green: 0 0 0 3px rgba(22, 163, 74, 0.25);  /* Focus ring */
```

---

## 7. Component Specifications

### 7.1 Button

**Variants:**
- `primary` — Green background, white text
- `secondary` — Outlined, green border + text
- `ghost` — No background, colored text on hover
- `destructive` — Red background
- `icon` — Square, icon only

**Sizes:**
- `sm` — 32px height, 14px text, 12px/20px padding
- `md` — 40px height, 14px text, 16px/24px padding (default)
- `lg` — 48px height, 16px text, 20px/32px padding

```css
.btn-primary {
  background: var(--brand-primary);
  color: var(--text-on-brand);
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  transition: background 150ms ease, transform 100ms ease;
}
.btn-primary:hover  { background: var(--brand-hover); }
.btn-primary:active { transform: scale(0.97); }
.btn-primary:focus-visible { box-shadow: var(--shadow-green); outline: none; }
```

### 7.2 Input Field

```css
.input {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  height: 40px;
  transition: border-color 150ms ease;
}
.input:focus { border-color: var(--border-focus); box-shadow: var(--shadow-green); }
.input.error { border-color: var(--status-error); }
```

### 7.3 Video Card

```
┌──────────────────────────────┐
│                              │  thumbnail-container
│     16:9 Thumbnail           │  aspect-ratio: 16/9
│     [duration badge]         │  border-radius: 8px
│                              │
└──────────────────────────────┘
┌──┐  Title (max 2 lines)       avatar: 36px circle
│👤│  Channel Name              metadata: color-text-muted
└──┘  1.2M views · 2 weeks ago  menu: ⋮ appears on hover
```

**States:**
- Default: Shadow-none
- Hover: Slight scale (1.02) on thumbnail, shadow-md

### 7.4 Avatar

```css
/* Sizes */
.avatar-xs  { width: 24px;  height: 24px;  }
.avatar-sm  { width: 32px;  height: 32px;  }
.avatar-md  { width: 40px;  height: 40px;  }  /* Default */
.avatar-lg  { width: 48px;  height: 48px;  }
.avatar-xl  { width: 64px;  height: 64px;  }
.avatar-2xl { width: 96px;  height: 96px;  }
.avatar-3xl { width: 128px; height: 128px; }

/* All avatars: border-radius: full (circle) */
/* Fallback: initials on brand-subtle background */
```

### 7.5 Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

/* Variants */
.badge-green   { background: var(--brand-subtle); color: var(--brand-text); }
.badge-gray    { background: var(--bg-elevated);  color: var(--text-secondary); }
.badge-red     { background: #FEE2E2;             color: #DC2626; }
.badge-live    { background: #DC2626;             color: white; }
.badge-verified { /* Green checkmark icon + channel name */ }
```

### 7.6 Skeleton Loader

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-surface) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 7.7 Toast / Notification

- Position: Bottom-center (mobile), Bottom-right (desktop)
- Duration: 4 seconds auto-dismiss
- Types: success (green), error (red), info (blue), warning (amber)
- Action button optional (e.g., "Undo")

### 7.8 Modal / Dialog

- Backdrop: semi-transparent overlay
- Entry animation: Scale from 0.95 + fade in (150ms)
- Max-width: 600px (default), 400px (small), 800px (large)
- Close: Escape key, click backdrop, X button

---

## 8. Icon System

**Library:** [Lucide Icons](https://lucide.dev/) — consistent, minimal, open source  
**Sizes:**
- `16px` — Inline with text
- `20px` — Default UI icon
- `24px` — Navigation, primary actions
- `32px+` — Feature/hero icons (rare)

**Custom icons (platform-specific):**
- Seamlis logo mark (SVG)
- "S" monogram (favicon)
- Verified creator badge (custom)
- Seamlis creator badge (gold/premium tier)

---

## 9. Animation System

**Principles:**
- Animations serve function, not decoration
- Respect `prefers-reduced-motion`
- Duration: 100ms (micro) → 200ms (standard) → 350ms (page transitions)
- Easing: `ease-out` for enters, `ease-in` for exits, `ease-in-out` for transforms

```css
/* Standard easings */
--ease-out:     cubic-bezier(0, 0, 0.2, 1);
--ease-in:      cubic-bezier(0.4, 0, 1, 1);
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);  /* Bouncy — use sparingly */

/* Durations */
--duration-fast:   100ms;
--duration-normal: 200ms;
--duration-slow:   350ms;
```

**Standard animations:**
- Button press: `scale(0.97)` 100ms
- Card hover: `translateY(-2px)` 150ms
- Modal open: `scale(0.95 → 1) + opacity(0 → 1)` 150ms
- Toast enter: `translateY(100% → 0)` 250ms
- Skeleton shimmer: 1.5s infinite

---

## 10. Tailwind CSS Configuration

```js
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',  // [data-theme="dark"] via class
  theme: {
    extend: {
      colors: {
        green: { /* full 50-950 scale from section 2.1 */ },
        brand: {
          primary: '#16A34A',
          hover:   '#15803D',
          subtle:  '#DCFCE7',
        },
        surface: {
          base:     '#F8FAFC',
          card:     '#FFFFFF',
          elevated: '#F3F4F6',
        },
        dark: {
          base:     '#071A12',
          card:     '#0F2218',
          elevated: '#1A3329',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 250ms ease-out',
      },
    },
  },
  plugins: [],
};
```

---

## 11. Google Fonts Import

```html
<!-- In Next.js app/layout.tsx -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&family=JetBrains+Mono&display=swap" rel="stylesheet" />
```

---

*Document prepared as part of Phase 0 — Architecture Foundation*  
*Previous: [UX Information Architecture ←](./08-ux-information-architecture.md) | Next: [Security Architecture →](./10-security-architecture.md)*
