# Codex Task — Alpivo Hero + Resort View Refresh

Use this task when asking Codex to implement the Hero and Resort View redesign.

## Context

Alpivo is a premium alpine ski-trip matching platform. The app should help users find ski resorts that fit their trip, not merely browse a generic resort directory.

Existing repo baseline:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Supabase.
- Framer Motion is already installed.
- Resort data, weather/travel panels, admin features, and trip planning already exist.

Design references are located in:

```text
docs/design-references/hero-motion-reference/
```

Use those references for mood only: cinematic alpine background, fog/mist, calm parallax, text reveal, premium minimal UI. Do not copy the reference literally.

## Objective

Refresh the Hero and Resort View so Alpivo feels more premium, more cinematic, and easier to use.

The result should be:

- less cluttered;
- more image-led;
- clearer in hierarchy;
- more focused on matching logic;
- animated tastefully;
- responsive and accessible.

## Task scope

### 1. Inspect current implementation

Before changing code, identify:

- current home/Hero files;
- current resort listing files;
- current resort card components;
- current global styles/tokens;
- current data shape for resorts and match scores;
- whether components are server or client components.

Do not rewrite routing or data flow unless required.

### 2. Hero refresh

Create or update the Hero with:

- full-width cinematic alpine visual;
- dark gradient overlay for text contrast;
- optional lightweight fog/mist layer;
- animated headline and subline reveal;
- clear primary CTA to match flow;
- secondary CTA to explore resorts;
- floating glass search/matching card;
- responsive mobile version;
- reduced-motion fallback.

Suggested Hero copy:

```text
Find the ski resort that actually fits your trip.
```

Suggested subline:

```text
Alpivo ranks resorts by terrain, snow confidence, travel effort, budget, group fit, and alpine vibe.
```

Suggested CTAs:

```text
Start matching
Explore resorts
```

### 3. Resort View refresh

Redesign the Resort View into a clearer decision interface.

Include:

- clean result header;
- active filter chips;
- compact filter/search layer;
- view switch if supported: Recommended / Map / Compare;
- image-led resort cards;
- match score badge;
- vibe tags;
- “Why this fits you” explanation;
- key facts row;
- loading skeletons;
- empty state;
- responsive mobile layout.

Resort Card target structure:

```text
Image
Match score badge
Resort name
Location
Vibe tags
Why this fits you:
- reason 1
- reason 2
- reason 3
Key facts row
CTA
```

### 4. Motion implementation

Use existing Framer Motion for:

- Hero text reveal;
- matching card entrance;
- Resort Card grid stagger;
- card hover/tap microinteractions;
- optional shared layout transition.

Respect `prefers-reduced-motion`.

Use transform/opacity first. Avoid layout-changing animations.

### 5. Performance requirements

- Do not block LCP with heavy video/WebGL.
- Optimize images.
- Avoid adding GSAP/Spline/Three/Rive unless a specific need is proven.
- Keep mobile animation lighter than desktop.
- Do not introduce large layout shift.

### 6. Accessibility requirements

- Maintain semantic heading order.
- Ensure text contrast over images.
- Keep CTAs keyboard accessible.
- Do not put essential information behind hover-only states.
- Use accessible labels for filters and switches.
- Reduced-motion mode must remain usable and visually polished.

## Suggested files to look for

These paths may vary. Inspect the repo first.

```text
app/page.tsx
app/resorts/page.tsx
app/resorts/[slug]/page.tsx
components/**
components/resorts/**
components/home/**
app/globals.css
```

## Implementation strategy

Prefer a small, reviewable set of changes:

1. Add or refine design tokens/global classes if needed.
2. Refresh Hero component.
3. Refresh Resort Card component.
4. Refresh Resort listing layout.
5. Add loading/empty/reduced-motion states.
6. Run checks.

## Acceptance criteria

The task is successful when:

- Hero immediately feels premium and alpine.
- Resort View is easier to scan and less cluttered.
- Resort cards explain why a resort matches the user.
- Animations are smooth, subtle, and purposeful.
- Mobile layout remains clean and fast.
- Reduced-motion mode works.
- Existing data flow and routes are preserved.
- No secrets or server-only Supabase keys are exposed client-side.
- `npm run lint` passes or all remaining issues are clearly reported.
- `npm run build` passes or all remaining issues are clearly reported.

## Do not do

- Do not replace real resort data with static mock data.
- Do not delete existing admin, trip planning, weather, or access-mode functionality.
- Do not introduce a full new design system without need.
- Do not add animation libraries for simple fades/slides.
- Do not copy the reference video literally.
- Do not make the Hero so animated that users cannot read or act quickly.

## Copy-paste prompt for Codex

```text
Implement a visual refresh for Alpivo's Hero and Resort View.

Read AGENTS.md, docs/ALPIVO_DESIGN_DIRECTION.md, docs/MOTION_SYSTEM.md, and docs/design-references/hero-motion-reference/README.md first.

Context:
- Alpivo is a premium alpine ski-trip matching platform, not a generic resort directory.
- Use the existing Next.js App Router, React, TypeScript, Tailwind CSS, Supabase, and Framer Motion setup.
- Preserve existing data flow, routes, and admin/private access behavior.

Tasks:
1. Inspect the current Hero, Resort View, Resort Card, global styles, and resort data shape.
2. Refresh the Hero with a cinematic alpine background, dark overlay, subtle fog/parallax, animated headline reveal, CTA pair, and floating glass matching card.
3. Redesign the Resort View with a cleaner results header, active filter chips, compact filter layer, image-led resort cards, match score badges, vibe tags, key facts, and “Why this fits you” explanations.
4. Add subtle Framer Motion animations: hero reveal, matching card entrance, card grid stagger, hover lift/image zoom, and reduced-motion fallbacks.
5. Add or refine loading skeletons, empty states, and mobile layout.
6. Run npm run lint and npm run build. Report any issues clearly.

Acceptance criteria:
- Premium alpine look.
- Less clutter.
- Clear recommendation logic.
- Smooth but restrained animation.
- Strong mobile experience.
- prefers-reduced-motion respected.
- No breaking changes to existing routing/data/security.
```
