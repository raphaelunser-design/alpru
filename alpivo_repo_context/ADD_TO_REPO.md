# Add this context pack to the Alpivo repo

Target repo found through GitHub connector:

```text
raphaelunser-design/alpru
```

I could inspect the repo, but the available GitHub toolset in this chat did not expose a commit/write-file action. Add these files manually or ask Codex to create them in the repo.

## Recommended file placement

Copy the files exactly into the repository root:

```text
AGENTS.md
docs/ALPIVO_DESIGN_DIRECTION.md
docs/MOTION_SYSTEM.md
docs/CODEX_TASK_HERO_RESORT_VIEW.md
docs/design-references/hero-motion-reference/README.md
docs/design-references/hero-motion-reference/contact_sheet.jpg
docs/design-references/hero-motion-reference/frames/*.jpg
```

## Manual copy commands

From a local clone of the repo, copy the pack contents into the repo root, then run:

```bash
git status
git add AGENTS.md docs/ALPIVO_DESIGN_DIRECTION.md docs/MOTION_SYSTEM.md docs/CODEX_TASK_HERO_RESORT_VIEW.md docs/design-references/hero-motion-reference
git commit -m "Add Alpivo design direction and Codex context"
git push
```

## Codex instruction

After adding the files, start the next Codex task with:

```text
Read AGENTS.md, docs/ALPIVO_DESIGN_DIRECTION.md, docs/MOTION_SYSTEM.md, and docs/CODEX_TASK_HERO_RESORT_VIEW.md first. Then implement the Hero + Resort View refresh according to those docs.
```
