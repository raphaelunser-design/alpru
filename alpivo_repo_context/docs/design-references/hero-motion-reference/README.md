# Hero Motion Reference — Alpivo

This folder contains visual reference frames extracted from the provided screen recording.

Use these frames for mood and motion direction only. Do not copy the design literally.

## What the reference shows

The reference points toward:

- cinematic mountain landscapes;
- slow camera-like movement;
- soft fog/cloud reveal;
- minimal navigation;
- text/logo reveal over landscape;
- premium atmospheric pacing;
- low-clutter layout.

## How to adapt it for Alpivo

Translate the feeling into Alpivo's product context:

- Ski-resort matching, not a generic mountain landing page.
- Hero should support the match-flow CTA.
- Motion should feel alpine and premium, not like a template demo.
- Resort View should become clearer and more useful, not only prettier.

## Reference frames

```text
frames/01_blue_mountain_navigation.jpg
frames/02_bright_fog_reveal.jpg
frames/03_mist_masked_logo.jpg
frames/04_green_mountain_landscape.jpg
frames/05_field_text_overlay.jpg
contact_sheet.jpg
```

## Implementation notes

Recommended approach:

- Background image/video with dark gradient overlay.
- Lightweight fog layer via CSS or optimized asset.
- Framer Motion headline reveal.
- Floating glass matching card.
- Smooth scroll handoff into Resort View.
- Reduced-motion fallback.

Do not make this heavy by default:

- Avoid WebGL unless absolutely necessary.
- Avoid scroll-jacking.
- Avoid autoplay video if it harms LCP or mobile performance.
