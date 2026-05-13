# Alpivo Design Direction

This document centralizes Alpivo's product, UI, and motion direction so that ChatGPT, Codex, and future contributors work from the same brief.

## One-line product direction

Alpivo is a premium ski-resort matching platform that helps users choose the resort that best fits their trip, group, budget, travel constraints, skill level, and desired alpine vibe.

## Experience goal

Alpivo should feel less like a travel listing site and more like a high-end alpine decision cockpit:

- emotionally strong because of cinematic mountain imagery;
- rational because recommendations are explained with match logic;
- calm because the UI removes clutter;
- premium because details, motion, typography, and spacing are controlled.

The core design principle:

> Less UI, more meaning. Strong imagery, clear hierarchy, and purposeful motion.

## Brand feel

Use this as the target mood:

- cinematic alpine;
- premium but not luxury-snobbish;
- clean and data-driven;
- trustworthy, not salesy;
- adventurous but calm;
- modern European ski-trip planning.

Potential visual adjectives:

- midnight;
- glacial;
- snow-soft;
- panoramic;
- crisp;
- atmospheric;
- editorial;
- precise.

## Visual system direction

### Color mood

This is not a final token system, but a direction for design decisions:

- Base: deep midnight blue / near-black alpine navy.
- Surface: translucent slate / glass over image.
- Text: snow/off-white, cool gray, muted slate.
- Accent: icy blue or warm amber used sparingly for match score, CTA, and highlights.
- Status: do not overuse red/green; keep status indicators refined.

### Typography

Use typography to create product confidence:

- Large hero headline with strong line-height control.
- Short subline, not long marketing copy.
- Resort names should be visually prominent.
- Data labels should be compact and readable.
- Avoid too many font weights in one card.

### Surfaces

Preferred surfaces:

- Soft glass panels over alpine imagery.
- Subtle borders with low-opacity white/ice strokes.
- Slight blur only where performance allows.
- Gradients that support readability.

Avoid:

- heavy opaque boxes everywhere;
- noisy shadows;
- too many nested panels;
- intense neon borders.

## Hero Page direction

The Hero is the main emotional entry point. It should make Alpivo feel premium before the user reads much text.

### Hero concept

A cinematic alpine opening scene with:

- large mountain/resort background;
- dark overlay for contrast;
- optional drifting fog/mist layer;
- subtle background scale/pan;
- controlled text reveal;
- floating glass matching/search panel.

### Suggested layout

Desktop:

- Left/center: headline and subline.
- Under headline: primary and secondary CTAs.
- Right or lower-right: glass matching card.
- Top: minimal navigation.
- Bottom: subtle cue into Resort Finder / “Recommended for your trip.”

Mobile:

- Headline first.
- Matching card below CTA.
- Reduce parallax and fog intensity.
- Avoid tiny controls.

### Hero copy direction

Possible headline options:

- “Find the ski resort that actually fits your trip.”
- “Your next ski trip, matched by terrain, snow, travel, and vibe.”
- “Stop browsing resorts. Start matching your trip.”

Possible subline options:

- “Alpivo ranks resorts by skill level, group needs, snow confidence, travel effort, budget, and après-ski preferences.”
- “Compare the resorts that fit your group instead of scrolling through generic lists.”

CTA options:

- Primary: “Start matching”
- Secondary: “Explore resorts”
- Secondary: “View recommendations”

### Hero animation sequence

Target sequence:

1. Background loads with slight zoom-in or zoom-out.
2. Dark gradient settles immediately for readability.
3. Fog/mist begins slow drift.
4. Eyebrow text fades in.
5. Headline reveals line by line or word by word.
6. Subline and CTAs fade/slide in.
7. Matching card enters slightly later.
8. On scroll, Hero hands off into Resort View without a harsh jump.

Motion should be subtle. The goal is alpine atmosphere, not a splash-screen gimmick.

## Resort View direction

The Resort View should become the clearest part of the product. The user should understand:

- what results they are seeing;
- why these resorts fit;
- how to compare them;
- what to do next.

### Target layout

Recommended structure:

1. Results header
   - “Recommended resorts” / “Best matches for your ski trip.”
   - Result count.
   - Active filter chips.
   - View switch: Recommended / Map / Compare.

2. Compact filter layer
   - Search.
   - Region/country.
   - Skill level.
   - Group type.
   - Budget/travel effort.
   - Vibe: après-ski, family, freeride, beginner-friendly, premium, quiet.

3. Card grid
   - Strong image-led cards.
   - Match score badge.
   - Resort name and location.
   - Key facts.
   - Vibe tags.
   - “Why this fits you” explanation.
   - CTA to details or compare.

4. Optional side/map layer
   - Map view should be useful, not decorative.
   - It should support resort comparison and travel context.

### Resort Card anatomy

A premium card should include only the highest-signal information upfront:

- Image.
- Resort name.
- Location.
- Match score.
- 2–4 tags.
- 2–3 concise reasons.
- A small row of facts.
- CTA.

Example card content:

```text
St. Anton am Arlberg
Austria · Tyrol
92% match

Tags: Après-ski · Advanced terrain · Snow reliable · Group trip

Why this fits you:
- Strong terrain mix for intermediate-to-advanced skiers
- High après-ski energy for groups
- Reliable snow window for your selected dates

View resort · Compare
```

### Card visual rules

Use:

- large image crop;
- gradient overlay at image bottom if text sits on image;
- readable match badge;
- subtle border/glow on hover;
- controlled spacing;
- rounded premium surfaces;
- icon use only where it improves scanning.

Avoid:

- too many badges;
- long paragraphs;
- equal visual weight for every data point;
- loud colors;
- cramped mobile cards.

## Motion language

### General motion principles

- Motion should support understanding.
- Animate opacity and transform first.
- Avoid animating layout dimensions when possible.
- Prefer calm easing and short durations.
- Use stagger for multiple cards.
- Respect reduced motion.

### Suggested timing

- Micro hover: 120–220ms.
- Card entrance: 350–550ms.
- Hero text reveal: 500–900ms total.
- Stagger: 50–90ms between cards.
- Background atmosphere: 10–25s slow loop if CSS-based.

### Good animation examples

Hero:

- Background image scale from 1.06 to 1.00.
- Fog layer drifts slowly with low opacity.
- Text fades in with `y: 16 -> 0`.
- Matching card fades in with `y: 24 -> 0` and slight blur-to-clear.

Cards:

- Initial: `opacity: 0, y: 18`.
- Enter: `opacity: 1, y: 0`.
- Hover: `y: -4`, image scale `1.03`, soft border highlight.
- Tap: slight scale down.

Avoid:

- bouncing;
- spinning;
- aggressive scroll-jacking;
- fast parallax that fights reading;
- animations that trigger layout shift.

## Accessibility and performance

Non-negotiables:

- Respect `prefers-reduced-motion`.
- Keep contrast high on image backgrounds.
- Do not rely on animation to reveal essential content.
- Use semantic headings and accessible labels.
- Keep controls keyboard reachable.
- Use optimized images and avoid blocking LCP.
- Do not make heavy video/WebGL the default Hero implementation.
- Ensure mobile performance is good before adding more effects.

## Implementation preferences

Given the current repo baseline, prefer:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Framer Motion for UI animation.
- CSS gradients and pseudo-elements for fog/glass where possible.
- Next Image for optimized imagery where compatible with the current setup.

Do not add GSAP, Rive, Spline, or Three.js just because the reference feels animated. Add only when a clear interaction requires it and performance is acceptable.

## North-star result

The refreshed Alpivo Hero and Resort View should make a user think:

> “This feels premium, I understand why these resorts are recommended, and I want to start comparing them.”
