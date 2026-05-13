# Alpivo Motion System

This document defines the preferred motion behavior for Alpivo UI work.

## Purpose of motion

Motion in Alpivo should do three things:

1. Create alpine atmosphere.
2. Help users understand UI hierarchy and state changes.
3. Preserve context while moving between Hero, Resort View, cards, and detail pages.

Motion should not become visual noise.

## Current preferred library

Use the existing Framer Motion dependency for component-level animation.

Preferred uses:

- Hero text reveal.
- Search/matching card entrance.
- Card grid stagger.
- Card hover/tap microinteractions.
- Filter chips appearing/disappearing.
- Shared layout transitions where appropriate.

Avoid adding new motion libraries unless there is a clear, reviewed reason.

## Reduced motion

Every animated component should support reduced motion.

Use Framer Motion's `useReducedMotion()` where components are client-side:

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function AnimatedBlock({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

Also include CSS-level fallbacks:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}
```

## Recommended presets

### Hero headline reveal

```ts
export const heroContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

export const heroItem = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};
```

Use blur carefully. Avoid it if performance suffers.

### Resort card reveal

```ts
export const cardGrid = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const resortCard = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};
```

### Hover behavior

```tsx
<motion.article
  whileHover={{ y: -4 }}
  whileTap={{ scale: 0.99 }}
  transition={{ duration: 0.18, ease: 'easeOut' }}
>
  {/* card */}
</motion.article>
```

Pair hover movement with a subtle image scale using CSS or motion.

## Hero atmosphere without heavy 3D

Before adding 3D/WebGL, use lightweight layers:

- background image;
- dark gradient overlay;
- low-opacity fog image or CSS radial gradients;
- slow transform animation;
- static fallback for reduced-motion users.

Example CSS direction:

```css
.hero-fog {
  position: absolute;
  inset: -10%;
  pointer-events: none;
  opacity: 0.22;
  filter: blur(18px);
  background:
    radial-gradient(circle at 20% 40%, rgba(255,255,255,0.22), transparent 32%),
    radial-gradient(circle at 70% 30%, rgba(255,255,255,0.14), transparent 28%),
    radial-gradient(circle at 50% 70%, rgba(180,210,255,0.12), transparent 30%);
  animation: alpivoFogDrift 22s ease-in-out infinite alternate;
}

@keyframes alpivoFogDrift {
  from { transform: translate3d(-2%, 1%, 0) scale(1.02); }
  to { transform: translate3d(2%, -1%, 0) scale(1.06); }
}
```

## Animation quality checklist

Before shipping an animated UI change, check:

- Does it still work when reduced motion is enabled?
- Does the page remain readable while animation plays?
- Are only transform/opacity/filter animated where possible?
- Is there any layout shift?
- Does mobile feel calmer than desktop?
- Does the animation explain state or add atmosphere?
- Does it avoid looking like a generic template demo?

## Do not do

- Do not add scroll-jacking.
- Do not use aggressive bounce/spring effects everywhere.
- Do not animate every small element independently.
- Do not introduce large animation dependencies for simple fades/slides.
- Do not hide information behind hover-only interactions.
- Do not let motion delay the user from taking action.
