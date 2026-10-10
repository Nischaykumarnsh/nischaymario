# ★ Nischay's Adventure ★
A complete, playable 2D retro platformer built with vanilla JavaScript, HTML5 Canvas, and modern Web Audio API. Inspired by the golden era of 8-bit platformers, featuring an original hero named **Nischay**, custom pixel artwork, procedural audio synthesis, and fine-tuned platformer physics.

---

## 🎮 How to Play

### Running Locally
No build step, dependencies, or server installation required!
1. Double-click `index.html` to open it directly in Google Chrome, Firefox, Microsoft Edge, or Safari.
   - Alternatively, you can serve it via any local web server (e.g., Python: `python -m http.server 8000`, VS Code Live Server, or Node `npx serve`).
2. Click **"▶ START ADVENTURE"** on the title screen to begin!

---

## 🕹️ Controls

### Keyboard (Desktop)
| Action | Key(s) |
| :--- | :--- |
| **Move Left** | `←` Left Arrow or `A` |
| **Move Right** | `→` Right Arrow or `D` |
| **Jump** | `Spacebar`, `↑` Up Arrow, or `W` |
| **High Jump** | Hold down Jump key |
| **Short Hop** | Tap Jump key quickly |
| **Mute / Unmute** | `M` key |
| **Pause Game** | `P` key |
| **Quick Restart**| `R` key |

### Touch Controls (Mobile & Tablets)
- **◀ / ▶ D-Pad**: Tap and hold to run left or right.
- **JUMP Button**: Tap to jump; hold to leap higher.
- **🔊 Sound Button**: Tap the speaker icon on the HUD to toggle audio anytime.

---

## 🌟 Gameplay Features & Mechanics

1. **Original Hero: Nischay**
   - Custom pixel-art design with red headband, navy explorer jacket, golden-yellow shirt, denim jeans, and running sneakers.
   - Fluid 4-frame running animation cycle with footstep dust effects, airborne jump pose, and invulnerability flicker on damage.

2. **Game Feel & Responsive Controls**
   - **Variable Jump Height**: Jump height dynamically responds to how long the jump button is held.
   - **Coyote Time**: Forgiving 6-frame window allowing jumps right after stepping off platforms.
   - **Jump Buffering**: Early jump presses right before landing automatically trigger upon touching the ground.
   - **One-Way Platforms**: Wooden platforms allow jumping up through them from below and landing solidly on top.

3. **Stage 1: Greenwood Hills**
   - **8 Progressive Zones**:
     - *Zone 1*: Safe grassy plains with friendly introductory coins.
     - *Zone 2*: Mystery question blocks, terracotta bricks, and the first Grumper patrol.
     - *Zone 3*: Green pipes of varying heights and elevated floating platforms.
     - *Zone 4*: Mystery block row with hidden coins and multi-enemy patrol.
     - *Zone 5*: Deep pit gaps requiring precision timing on floating stepping planks.
     - *Zone 6*: High brick pyramid and coin vaults.
     - *Zone 7*: Wooden bridge crossing over final hazards.
     - *Zone 8*: Grand brick staircase, flag pole, and the victory castle!
   - Over **30 collectible gold coins** with 4-frame metallic spinning animation.
   - **Mystery Blocks (`?`)**: Hit them from below to bounce them, spawn collectible coins, and convert them to metallic steel.
   - **Terracotta Bricks**: Bumpable bricks with debris burst particle physics.

4. **Combat & Enemies**
   - **Grumper Critters**: Patrol creatures pacing back and forth.
   - **Stomp Attack**: Jump onto a Grumper from above to squash them, trigger a victory bounce, and earn `+200` points!
   - **Block Bump Attack**: Hit a block from directly underneath when an enemy is walking on top of it to flip them!
   - **Damage & Lives**: Touching an enemy from the side knocks Nischay back, flashes invulnerability frames, and deducts 1 of his 3 hearts.
   - **Safe Respawn**: Falling into a pit safely respawns Nischay at the nearest platform checkpoint as long as lives remain.

5. **Victory & Game Over**
   - Reach the **finish flagpole** at the end of the stage to trigger the victory sequence: the flag glides down, Nischay marches into the castle archway, fanfare plays, and a victory summary appears!
   - If all 3 lives are lost, a Game Over overlay provides a one-click **"Restart Game"** option.

6. **Web Audio Synthesizer (`audio.js`)**
   - 100% procedurally synthesized retro sound effects using the standard HTML5 Web Audio API.
   - Zero external audio files or network requests required—runs reliably offline anywhere.
   - Audio includes: Jump sweep, Coin chime arpeggio, Enemy stomp crunch, Block bump thud, Hurt dissonance, Victory fanfare melody, and Game Over jingle.

---

## 📁 Project Architecture

```
Nischay/
├── index.html     # Semantic HTML5 layout, HUD, overlays, and viewport controls
├── style.css      # Retro arcade visual styles, responsive canvas letterboxing, animations
├── audio.js       # SoundSystem class: 8-bit procedural Web Audio synthesis
├── sprites.js     # SpriteEngine class: procedural pixel-art rasterization to offscreen canvases
├── game.js        # Core Game engine: physics, AABB collisions, camera, enemies, level logic
└── README.md      # Game documentation and manual
```

---

## 🚀 Adding More Levels
Additional levels can be added easily in `game.js`:
1. Define a new builder method like `buildLevel2()` with custom tile placements, enemy spawns, and pit gaps.
2. In `loadLevel(levelNum)`, switch on `levelNum` to invoke `buildLevel1()`, `buildLevel2()`, etc.
3. Update `hud-val` World display in `updateHUD()`.

Enjoy playing **Nischay's Adventure**!
