# AGENTS.md — Alpivo AI/Codex Working Rules

This file is the stable project context for AI coding agents working on Alpivo. Read it before making code, design, or architecture changes.

## Product identity

Alpivo is a premium alpine ski-trip matching platform. It should feel like a focused decision tool for finding the right ski resort, not like a generic travel directory.

The product promise is:

> Help users find the resort that actually fits their trip: skill level, group needs, budget, timing, travel effort, snow reliability, après-ski vibe, and terrain preferences.

Core product areas already described in the repository:

- Match quiz with result and ranking logic.
- Resort library with resort detail pages.
- Weather, route, and travel panels.
- Skipass and après-ski data models.
- Admin areas for content, resorts, prices, and media.
- Group planning module under `/trips`.

## Current technical baseline

Use the existing app structure and dependencies before adding anything new.

Known baseline from the repository:

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- Supabase.
- Framer Motion is already installed and should be the default animation library for UI-level motion.
- Leaflet is installed for map-related experiences.

Common scripts:

```bash
npm run dev
npm run lint
npm run build
npm run start -- -p 3002
```

Do not introduce large new dependencies unless there is a clear product and performance reason. For the Hero and Resort View refresh, prefer the existing stack: React, Tailwind, Framer Motion, Next Image, and CSS gradients/overlays.

## Design direction

Alpivo should feel:

- Premium, alpine, cinematic.
- Clear and trustworthy, not overloaded.
- Data-driven, but emotionally appealing.
- Calm and precise, not playful or chaotic.
- More like a high-end ski-trip advisor than a booking portal.

Visual language:

- Deep alpine midnight backgrounds.
- Snow/off-white text.
- Cool slate/ice glass surfaces.
- Limited accent color for match score, CTAs, and highlights.
- Large atmospheric resort imagery.
- Soft gradients, fog/mist overlays, and subtle depth.
- Clear hierarchy and fewer competing UI elements.

Avoid:

- Busy travel-agent layouts.
- Excessive badges and long card text.
- Random decorative animations.
- Heavy WebGL/3D as a default.
- Animation that damages readability or performance.

## Motion rules

Use motion to clarify state, hierarchy, and continuity. Do not use motion as decoration only.

Default animation approach:

- Use Framer Motion for component entrance, exit, hover, and shared layout transitions.
- Use CSS transforms and opacity whenever possible.
- Respect `prefers-reduced-motion` everywhere.
- Keep animation durations short and calm.
- Use staggered reveals for groups of cards.
- Use subtle hover lift and image zoom for Resort Cards.
- Use scroll-based movement sparingly; avoid complex scroll scenes unless necessary.

Hero motion should feel like:

- Slow alpine camera reveal.
- Background slightly zooms or pans.
- Fog/mist drifts subtly.
- Headline and CTA appear in a controlled stagger.
- Search/matching card floats in with soft glass depth.
- Scroll handoff from Hero into Resort Finder is smooth.

Resort View motion should feel like:

- Results settle into place.
- Cards reveal in a stagger.
- Hover creates slight elevation, border glow, and image scale.
- Match-score badges are readable and not gimmicky.
- Detail-page transitions preserve context where possible.

## Hero page target

The Hero should communicate Alpivo's value in one glance:

- Premium alpine environment.
- Resort matching, not generic browsing.
- Clear CTA into the match flow or resort finder.
- A floating glass matching/search card with a small number of meaningful inputs.

Recommended Hero elements:

- Full-width/full-viewport alpine background image or optimized video.
- Dark gradient overlay for text contrast.
- Optional fog/mist layer using CSS or a lightweight asset.
- Headline focused on fit/matching.
- Short subline explaining the benefit.
- Primary CTA: start matching.
- Secondary CTA: explore resorts.
- Floating glass panel showing matching criteria such as skill level, group type, budget, date range, and trip vibe.

## Resort View target

The Resort View should be cleaned up into a clear decision interface.

Recommended structure:

1. Results header
   - Title.
   - Result count.
   - Active filters as chips.
   - View switch: Recommended / Map / Compare.

2. Sticky filter/search layer
   - Compact, glassy, not form-heavy.
   - Search, region, skill level, vibe, budget/travel filters.
   - Clear reset action.

3. Resort card grid
   - Large image.
   - Resort name and location.
   - Match score.
   - 2–4 vibe/feature tags.
   - Short “why this fits you” copy.
   - Key facts only: snow confidence, terrain, travel effort, price band, après-ski, family/group fit.
   - CTA into detail page or comparison.

4. Detail transition
   - Maintain visual continuity from card to detail where possible.
   - Do not hide important resort facts behind animation.

## Copy and content rules

Tone:

- Confident.
- Premium.
- Clear.
- Practical.
- Not hypey.

Good Alpivo copy examples:

- “Find the ski resort that actually fits your trip.”
- “Ranked by terrain, snow confidence, travel effort, and group fit.”
- “Why it fits you.”
- “Best for intermediate groups with strong après-ski preferences.”
- “Short transfer, reliable snow window, balanced terrain mix.”

Avoid vague copy like:

- “Discover amazing places.”
- “The best resorts ever.”
- “Your dream vacation starts here.”

## Implementation rules

Before coding:

1. Inspect existing routing, components, styles, and data flow.
2. Reuse existing resort data models and fetch logic.
3. Check whether components are server or client components before adding hooks or motion.
4. Keep changes incremental and reviewable.

When coding:

- Preserve existing routes and data flow unless explicitly changing them.
- Do not hardcode secrets or expose server-side Supabase keys in client components.
- Do not replace working resort data with throwaway mock data.
- Use semantic HTML and accessible labels.
- Maintain keyboard usability.
- Use responsive layouts from mobile to desktop.
- Keep image assets optimized.
- Avoid layout shift.
- Use skeleton states for loading.
- Include reduced-motion fallbacks.

After coding:

```bash
npm run lint
npm run build
```

Also manually check:

- Desktop Hero.
- Mobile Hero.
- Resort View card grid.
- Empty/filter states.
- Loading states.
- Reduced-motion mode.
- Dark-background contrast.

## Security and data safety

- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, or admin tokens client-side.
- Avoid logging secrets.
- Do not weaken access-mode/private-beta behavior.
- Keep admin endpoints protected.
- Do not remove existing Supabase fallback/demo behavior unless the task explicitly requires it.

## Preferred Codex behavior

When asked to redesign or animate Hero/Resort View:

- First identify the relevant files and current components.
- Then propose a small implementation plan.
- Then modify components/styles.
- Then run lint/build if possible.
- Summarize changed files and any known limitations.

A good result is not “more animation.” A good result is a calmer, more premium, more useful Alpivo experience.
