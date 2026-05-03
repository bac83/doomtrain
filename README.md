# Doomtrain

A Doom-style raycaster browser game with a Dometrain theme. Personal project, not for release. Born from a typo of "Dometrain" → "Doomtrain" during a workshop.

![gold-on-navy aesthetic](docs/screenshot-placeholder.png)

## Play it

```bash
python3 -m http.server 8000
```

Open http://localhost:8000.

## Controls

- **WASD** — move
- **Mouse** — look (click canvas to lock pointer)
- **Space / Left click** — fire
- **Shift** — run
- **← / →** — keyboard turning fallback

## Goal

Clear the level. Find Nick Chapsas at the exit. Squash bugs along the way. Drink coffee.

## What's inside

- 320×200 internal raycaster, scaled up for chunky pixels
- Procedural pixel-art sprites (bug demons, coffee cups with the Dometrain D, Nick himself with a halo)
- Procedural WebAudio sound effects — no asset files
- Doom-style HUD with a pixel portrait of Nick that frowns when you're hurting

## Project structure

See [`CLAUDE.md`](./CLAUDE.md) — has the full architecture rundown and how to add new levels, enemies, weapons, etc.

## Stack

Plain HTML + CSS + JavaScript. No build, no bundler, no dependencies. Just open `index.html` (or serve the directory).

## Why "Doomtrain"

It's a Dometrain typo. The platform is real and great — go check out the actual courses at https://dometrain.com.
