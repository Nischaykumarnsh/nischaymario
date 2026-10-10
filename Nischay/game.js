/**
 * Nischay's Adventure - Core Game Engine
 * Handles physics, collisions, camera, entities, levels, and game loop.
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    // Fixed virtual resolution (800 x 448 = 25 x 14 tiles of 32px)
    this.width = 800;
    this.height = 448;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Subsystems
    this.sound = new SoundSystem();
    this.sprites = new SpriteEngine();

    // Input state
    this.keys = {
      left: false,
      right: false,
      up: false,
      jump: false,
      down: false
    };

    // Camera
    this.camera = { x: 0, y: 0 };

    // Game stats
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.levelIndex = 1;
    this.state = 'START'; // START, PLAYING, HURT_RESPAWN, LEVEL_CLEAR, GAME_OVER, PAUSED

    // Animation & timers
    this.animTick = 0;
    this.particles = [];
    this.floatingTexts = [];
    this.blockBounces = []; // Blocks currently animating a bump

    // Setup input listeners
    this.setupInputs();
    this.setupUI();

    // Initialize level
    this.loadLevel(1);

    // Start loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  // ==========================================
  // LEVEL DEFINITION & BUILDER
  // ==========================================
  loadLevel(levelNum) {
    this.levelNum = levelNum;
    this.tileSize = 32;
    this.levelWidthInTiles = 135;
    this.levelHeightInTiles = 14;
    this.levelWidth = this.levelWidthInTiles * this.tileSize;
    this.levelHeight = this.levelHeightInTiles * this.tileSize;

    // Map grid: 2D array [y][x]
    this.map = [];
    for (let y = 0; y < this.levelHeightInTiles; y++) {
      this.map[y] = new Array(this.levelWidthInTiles).fill(0);
    }

    // Interactive tiles map (for breakables/question blocks)
    this.blockData = {}; // key "x,y" => { type: 'question'|'brick', content: 'coin', empty: false }

    // Entities
    this.enemies = [];
    this.collectibles = [];
    this.flag = null;
    this.castle = null;

    // Build Stage 1: "Greenwood Hills"
    this.buildLevel1();

    // Spawn player
    this.spawnPlayer(64, 300);

    // Reset camera
    this.camera.x = 0;
    this.camera.y = 0;
  }

  spawnPlayer(x, y) {
    this.player = {
      x: x,
      y: y,
      width: 24,
      height: 34,
      vx: 0,
      vy: 0,
      speed: 3.8,
      accel: 0.45,
      friction: 0.8,
      gravity: 0.46,
      jumpForce: -8.8,
      isGrounded: false,
      isJumping: false,
      facing: 'right',
      runFrame: 0,
      runTimer: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      invulnerableTimer: 0,
      dead: false,
      alpha: 1
    };
  }

  buildLevel1() {
    const W = this.levelWidthInTiles;
    const H = this.levelHeightInTiles;
    const groundY = 12; // ground surface starts at row 12

    // 1. Fill default base ground with a few gaps/pits
    const pitGaps = [
      { start: 38, end: 40 }, // small gap 1
      { start: 68, end: 71 }, // gap 2 with floating platform
      { start: 96, end: 98 }  // gap 3 near the end
    ];

    for (let x = 0; x < W; x++) {
      const isGap = pitGaps.some(g => x >= g.start && x <= g.end);
      if (!isGap) {
        this.map[groundY][x] = 1; // Grass
        for (let y = groundY + 1; y < H; y++) {
          this.map[y][x] = 2;     // Dirt
        }
      }
    }

    // Helper to add a block
    const addBlock = (tx, ty, type, content = 'coin') => {
      this.map[ty][tx] = (type === 'question') ? 3 : 4;
      this.blockData[`${tx},${ty}`] = {
        type: type,
        content: content,
        empty: false,
        origY: ty * this.tileSize,
        offsetY: 0
      };
    };

    // Helper to add wood platform
    const addPlatform = (startX, y, len) => {
      for (let x = startX; x < startX + len; x++) {
        this.map[y][x] = 5; // Wood platform
      }
    };

    // Helper to add pipe
    const addPipe = (tx, heightInTiles) => {
      const topY = groundY - heightInTiles;
      this.map[topY][tx] = 6;     // Cap Left
      this.map[topY][tx + 1] = 7; // Cap Right
      for (let y = topY + 1; y < groundY; y++) {
        this.map[y][tx] = 8;     // Body Left
        this.map[y][tx + 1] = 9; // Body Right
      }
    };

    // Helper to add coin
    const addCoin = (x, y) => {
      this.collectibles.push({
        x: x * this.tileSize + 6,
        y: y * this.tileSize + 6,
        width: 20,
        height: 20,
        type: 'coin',
        collected: false
      });
    };

    // Helper to add enemy
    const addEnemy = (x, y) => {
      this.enemies.push({
        x: x * this.tileSize,
        y: y * this.tileSize + 4,
        width: 28,
        height: 28,
        vx: -1.0,
        vy: 0,
        isGrounded: false,
        state: 'walk', // walk, squashed, dead
        squashTimer: 0,
        animFrame: 0,
        animTimer: 0
      });
    };

    // ==========================================
    // LEVEL GEOMETRY DESIGN (PROGRESSIVE CHALLENGE)
    // ==========================================

    // Zone 1: Intro (x: 0 - 20) - Friendly tutorial area
    // Starting coins floating
    addCoin(8, 10);
    addCoin(9, 10);
    addCoin(10, 10);

    // First question block
    addBlock(14, 8, 'question', 'coin');
    addBlock(16, 8, 'brick', 'coin');
    addBlock(18, 8, 'question', 'coin');

    // First enemy patrol
    addEnemy(22, 11);

    // Zone 2: Pipes and low jump introduction (x: 22 - 36)
    addPipe(26, 2); // 2-tile high pipe
    addCoin(26.5, 8.5);
    addCoin(29, 10);
    addCoin(31, 10);

    addPipe(34, 3); // 3-tile high pipe
    addCoin(34.5, 7.5);

    // Zone 3: Gap 1 & Floating platforms (x: 37 - 52)
    // Over pit 1 (x: 38 - 40)
    addPlatform(38, 9, 3); // Floating wooden plank
    addCoin(39, 7);

    addEnemy(43, 11);

    // High Question Block Row
    addBlock(46, 8, 'brick', 'coin');
    addBlock(47, 8, 'question', 'coin');
    addBlock(48, 8, 'brick', 'coin');
    addBlock(49, 8, 'question', 'coin');
    addBlock(50, 8, 'brick', 'coin');
    addCoin(47, 6);
    addCoin(49, 6);

    // Enemy under block row
    addEnemy(49, 11);

    // Zone 4: Stepped structures & high coins (x: 53 - 66)
    addPlatform(55, 9, 3);
    addCoin(55, 7);
    addCoin(56, 7);
    addCoin(57, 7);

    addPlatform(60, 6, 4);
    addCoin(61, 4);
    addCoin(62, 4);
    addCoin(63, 4);

    addEnemy(58, 11);

    // Zone 5: Deep Gap 2 with double floating stepping stones (x: 67 - 78)
    // Gap is at 68-71
    addPlatform(67, 10, 2);
    addPlatform(70, 8, 2);
    addCoin(67.5, 8);
    addCoin(70.5, 6);

    // Pipe after gap
    addPipe(74, 2);
    addEnemy(77, 11);

    // Zone 6: High Challenge Pyramid & Multi-coin Vault (x: 79 - 95)
    addBlock(81, 9, 'question', 'coin');
    addBlock(83, 9, 'brick', 'coin');
    addBlock(85, 9, 'question', 'coin');

    // Stepping blocks
    addBlock(87, 8, 'brick', 'empty');
    addBlock(88, 7, 'brick', 'empty');
    addBlock(89, 6, 'question', 'coin');
    addBlock(90, 6, 'brick', 'coin');
    addBlock(91, 7, 'brick', 'empty');
    addBlock(92, 8, 'brick', 'empty');

    addCoin(89, 4);
    addCoin(90, 4);

    addEnemy(84, 11);
    addEnemy(93, 11);

    // Zone 7: Gap 3 & Wooden bridge (x: 96 - 104)
    addPlatform(95, 9, 4);
    addCoin(96, 7);
    addCoin(97, 7);
    addCoin(98, 7);

    // Final Pipe
    addPipe(102, 3);

    // Zone 8: Victory Approach Stairs & Flagpole (x: 105 - 135)
    // Classic ascending staircase
    for (let step = 0; step < 5; step++) {
      for (let y = groundY - 1 - step; y < groundY; y++) {
        this.map[y][107 + step] = 4; // Solid brick stairs
      }
    }
    addCoin(108, 9);
    addCoin(109, 8);
    addCoin(110, 7);
    addCoin(111, 6);

    // The Flagpole at tile 118
    this.flag = {
      x: 118 * this.tileSize + 12,
      baseY: groundY * this.tileSize,
      topY: (groundY - 8) * this.tileSize,
      flagY: (groundY - 8) * this.tileSize,
      hit: false,
      down: false
    };

    // The Castle at tile 124
    this.castle = {
      x: 124 * this.tileSize,
      y: (groundY - 3) * this.tileSize
    };

    // Background scenery elements (clouds, hills, bushes)
    this.scenery = [
      // Clouds (slow parallax)
      { type: 'cloud', x: 80, y: 50 },
      { type: 'cloud', x: 260, y: 70 },
      { type: 'cloud', x: 500, y: 40 },
      { type: 'cloud', x: 780, y: 65 },
      { type: 'cloud', x: 1100, y: 45 },
      { type: 'cloud', x: 1450, y: 80 },
      { type: 'cloud', x: 1850, y: 50 },
      { type: 'cloud', x: 2200, y: 70 },
      { type: 'cloud', x: 2650, y: 40 },
      { type: 'cloud', x: 3100, y: 60 },
      { type: 'cloud', x: 3600, y: 50 },

      // Hills
      { type: 'hill', x: 30, y: groundY * this.tileSize - 64 },
      { type: 'hill', x: 420, y: groundY * this.tileSize - 64 },
      { type: 'hill', x: 880, y: groundY * this.tileSize - 64 },
      { type: 'hill', x: 1350, y: groundY * this.tileSize - 64 },
      { type: 'hill', x: 1900, y: groundY * this.tileSize - 64 },
      { type: 'hill', x: 2500, y: groundY * this.tileSize - 64 },
      { type: 'hill', x: 3050, y: groundY * this.tileSize - 64 },

      // Bushes
      { type: 'bush', x: 120, y: groundY * this.tileSize - 30 },
      { type: 'bush', x: 310, y: groundY * this.tileSize - 30 },
      { type: 'bush', x: 620, y: groundY * this.tileSize - 30 },
      { type: 'bush', x: 1040, y: groundY * this.tileSize - 30 },
      { type: 'bush', x: 1600, y: groundY * this.tileSize - 30 },
      { type: 'bush', x: 2320, y: groundY * this.tileSize - 30 },
      { type: 'bush', x: 2820, y: groundY * this.tileSize - 30 },
      { type: 'bush', x: 3500, y: groundY * this.tileSize - 30 }
    ];
  }

  // ==========================================
  // INPUT HANDLING
  // ==========================================
  setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.sound.ensureContext();
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        this.keys.left = true;
        e.preventDefault();
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        this.keys.right = true;
        e.preventDefault();
      }
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        if (!this.keys.jump) {
          this.triggerJump();
        }
        this.keys.jump = true;
        e.preventDefault();
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        this.keys.down = true;
        e.preventDefault();
      }
      if (e.code === 'KeyM') {
        this.toggleSound();
      }
      if (e.code === 'KeyR') {
        this.restartGame();
      }
      if (e.code === 'KeyP') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        this.keys.jump = false;
        // Variable jump height cut
        if (this.player && this.player.vy < -3.5) {
          this.player.vy = -3.5;
        }
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.keys.down = false;
    });

    // Touch controls for mobile / tablet
    const bindTouch = (id, onStart, onEnd) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (ev) => {
        ev.preventDefault();
        this.sound.ensureContext();
        onStart();
      };
      const end = (ev) => {
        ev.preventDefault();
        onEnd();
      };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('touchcancel', end, { passive: false });
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
    };

    bindTouch('btnLeft', () => { this.keys.left = true; }, () => { this.keys.left = false; });
    bindTouch('btnRight', () => { this.keys.right = true; }, () => { this.keys.right = false; });
    bindTouch('btnJump', () => {
      if (!this.keys.jump) this.triggerJump();
      this.keys.jump = true;
    }, () => {
      this.keys.jump = false;
      if (this.player && this.player.vy < -3.5) this.player.vy = -3.5;
    });
  }

  setupUI() {
    // Sound button toggle
    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.sound.ensureContext();
        this.toggleSound();
      });
    }

    // Start Screen Button
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.sound.ensureContext();
        this.startGame();
      });
    }

    // Restart Button (Game Over screen)
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.sound.ensureContext();
        this.restartGame();
      });
    }

    // Play Again Button (Win screen)
    const playAgainBtn = document.getElementById('playAgainBtn');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        this.sound.ensureContext();
        this.restartGame();
      });
    }

    // Pause Overlay click to resume
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) {
      pauseOverlay.addEventListener('click', () => {
        if (this.state === 'PAUSED') {
          this.togglePause();
        }
      });
    }
  }

  toggleSound() {
    const isMuted = this.sound.toggleMute();
    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) {
      soundBtn.innerText = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
      soundBtn.classList.toggle('muted', isMuted);
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('pauseOverlay').classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pauseOverlay').classList.add('hidden');
    }
  }

  startGame() {
    this.state = 'PLAYING';
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('winOverlay').classList.add('hidden');
  }

  restartGame() {
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.particles = [];
    this.floatingTexts = [];
    this.keys = {
      left: false,
      right: false,
      up: false,
      jump: false,
      down: false
    };
    this.loadLevel(1);
    this.state = 'PLAYING';
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('winOverlay').classList.add('hidden');
    document.getElementById('pauseOverlay').classList.add('hidden');
    this.updateHUD();
  }

  triggerJump() {
    if (this.state !== 'PLAYING') return;
    this.player.jumpBufferTimer = 8; // buffer for 8 frames
  }

  // ==========================================
  // GAME LOOP
  // ==========================================
  loop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.animTick++;

    if (this.state === 'PLAYING') {
      this.updatePlayer();
      this.updateEnemies();
      this.updateBlocks();
      this.updateCollectibles();
      this.updateParticles();
      this.updateCamera();
    } else if (this.state === 'LEVEL_CLEAR') {
      this.updateLevelClear();
      this.updateParticles();
      this.updateCamera();
    } else if (this.state === 'HURT_RESPAWN') {
      this.updateHurtRespawn();
      this.updateParticles();
    }

    this.render();
    this.updateHUD();

    requestAnimationFrame(this.loop.bind(this));
  }

  // ==========================================
  // PHYSICS & PLAYER UPDATE
  // ==========================================
  updatePlayer() {
    const p = this.player;

    // Horizontal Movement
    if (this.keys.left) {
      p.vx -= p.accel;
      p.facing = 'left';
    } else if (this.keys.right) {
      p.vx += p.accel;
      p.facing = 'right';
    } else {
      p.vx *= p.friction;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    }
    // Clamp horizontal speed
    p.vx = Math.max(-p.speed, Math.min(p.speed, p.vx));

    // Running animation cycle
    if (Math.abs(p.vx) > 0.4 && p.isGrounded) {
      p.runTimer++;
      if (p.runTimer > 6) {
        p.runTimer = 0;
        p.runFrame = (p.runFrame + 1) % 3;
        // Footstep dust particle
        if (Math.random() < 0.4) {
          this.createDustParticle(p.x + p.width / 2, p.y + p.height);
        }
      }
    } else {
      p.runFrame = 0;
    }

    // Gravity
    p.vy += p.gravity;
    if (p.vy > 10) p.vy = 10; // terminal velocity

    // Coyote Time & Jump Buffering
    if (p.isGrounded) {
      p.coyoteTimer = 6;
    } else if (p.coyoteTimer > 0) {
      p.coyoteTimer--;
    }

    if (p.jumpBufferTimer > 0) {
      p.jumpBufferTimer--;
      if (p.coyoteTimer > 0) {
        // Execute Jump!
        p.vy = p.jumpForce;
        p.isGrounded = false;
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        this.sound.playJump();
        this.createDustParticle(p.x + p.width / 2, p.y + p.height, 5);
      }
    }

    // Invulnerability timer
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer--;
    }

    // Move horizontally & test collisions
    p.x += p.vx;
    this.checkCollisionsX(p);

    // Move vertically & test collisions
    p.y += p.vy;
    p.isGrounded = false;
    this.checkCollisionsY(p);

    // Pit fall check
    if (p.y > this.levelHeight + 40) {
      this.handlePlayerDeath(true);
    }

    // Flagpole touch check
    if (this.flag && !this.flag.hit) {
      if (p.x + p.width >= this.flag.x - 6 && p.x <= this.flag.x + 18 && p.y + p.height >= this.flag.topY) {
        this.triggerVictory();
      }
    }
  }

  // ==========================================
  // TILE COLLISION RESOLUTION (AABB)
  // ==========================================
  isSolidTile(tileType) {
    // 1: Grass, 2: Dirt, 3: Question, 4: Brick, 5: Wood, 6..9: Pipes
    return tileType > 0;
  }

  checkCollisionsX(p) {
    const startY = Math.floor(p.y / this.tileSize);
    const endY = Math.floor((p.y + p.height - 1) / this.tileSize);

    // Left boundary
    if (p.x < 0) {
      p.x = 0;
      p.vx = 0;
      return;
    }
    // Right boundary
    if (p.x + p.width > this.levelWidth) {
      p.x = this.levelWidth - p.width;
      p.vx = 0;
      return;
    }

    if (p.vx > 0) {
      // Moving right: check column containing right edge
      const tx = Math.floor((p.x + p.width) / this.tileSize);
      if (tx >= 0 && tx < this.levelWidthInTiles) {
        for (let ty = startY; ty <= endY; ty++) {
          if (ty >= 0 && ty < this.levelHeightInTiles) {
            const tile = this.map[ty][tx];
            if (this.isSolidTile(tile) && tile !== 5) {
              p.x = tx * this.tileSize - p.width;
              p.vx = 0;
              break;
            }
          }
        }
      }
    } else if (p.vx < 0) {
      // Moving left: check column containing left edge
      const tx = Math.floor(p.x / this.tileSize);
      if (tx >= 0 && tx < this.levelWidthInTiles) {
        for (let ty = startY; ty <= endY; ty++) {
          if (ty >= 0 && ty < this.levelHeightInTiles) {
            const tile = this.map[ty][tx];
            if (this.isSolidTile(tile) && tile !== 5) {
              p.x = (tx + 1) * this.tileSize;
              p.vx = 0;
              break;
            }
          }
        }
      }
    }
  }

  checkCollisionsY(p) {
    const startX = Math.floor((p.x + 2) / this.tileSize);
    const endX = Math.floor((p.x + p.width - 3) / this.tileSize);

    if (p.vy >= 0) {
      // Falling or grounded: check row under feet
      const ty = Math.floor((p.y + p.height) / this.tileSize);
      if (ty >= 0 && ty < this.levelHeightInTiles) {
        for (let tx = startX; tx <= endX; tx++) {
          if (tx >= 0 && tx < this.levelWidthInTiles) {
            const tile = this.map[ty][tx];
            if (this.isSolidTile(tile)) {
              const tileTop = ty * this.tileSize;
              if (tile === 5) {
                // One-way wood platform: only land if descending and feet were above
                if (p.y + p.height - p.vy <= tileTop + 8) {
                  p.y = tileTop - p.height;
                  p.vy = 0;
                  p.isGrounded = true;
                  break;
                }
              } else {
                p.y = tileTop - p.height;
                p.vy = 0;
                p.isGrounded = true;
                break;
              }
            }
          }
        }
      }
    } else if (p.vy < 0) {
      // Jumping upwards: check ceiling row above head
      const ty = Math.floor(p.y / this.tileSize);
      if (ty >= 0 && ty < this.levelHeightInTiles) {
        for (let tx = startX; tx <= endX; tx++) {
          if (tx >= 0 && tx < this.levelWidthInTiles) {
            const tile = this.map[ty][tx];
            // Wood platforms (tile 5) can be jumped up through freely
            if (this.isSolidTile(tile) && tile !== 5) {
              const tileBottom = (ty + 1) * this.tileSize;
              p.y = tileBottom;
              p.vy = 0;
              if (tile === 3 || tile === 4) {
                this.bumpBlock(tx, ty);
              } else {
                this.sound.playBlockBump();
              }
              break;
            }
          }
        }
      }
    }
  }

  // Hit block from bottom
  bumpBlock(tx, ty) {
    const key = `${tx},${ty}`;
    const block = this.blockData[key];
    this.sound.playBlockBump();

    // Trigger bounce animation
    this.blockBounces.push({
      tx, ty,
      offset: 0,
      velocity: -4,
      originalY: ty * this.tileSize
    });

    if (block && !block.empty) {
      if (block.type === 'question') {
        block.empty = true;
        this.map[ty][tx] = 10; // Tile 10 is empty steel box

        // Coin pop out effect
        this.collectCoinBonus(tx * this.tileSize + 6, ty * this.tileSize - 20);
        this.createCoinPopParticle(tx * this.tileSize + 8, ty * this.tileSize - 8);
      } else if (block.type === 'brick') {
        // Brick bump particle burst
        this.createDebrisParticles(tx * this.tileSize + 16, ty * this.tileSize + 16);
        if (block.content === 'coin') {
          block.empty = true;
          this.map[ty][tx] = 10;
          this.collectCoinBonus(tx * this.tileSize + 6, ty * this.tileSize - 20);
          this.createCoinPopParticle(tx * this.tileSize + 8, ty * this.tileSize - 8);
        }
      }
    }

    // Check if an enemy is standing on top of this block when bumped
    this.enemies.forEach(enemy => {
      if (enemy.state === 'walk') {
        const enemyBottom = enemy.y + enemy.height;
        const blockTop = ty * this.tileSize;
        if (Math.abs(enemyBottom - blockTop) < 6 && enemy.x + enemy.width > tx * this.tileSize && enemy.x < (tx + 1) * this.tileSize) {
          this.defeatEnemy(enemy, 'flip');
        }
      }
    });
  }

  updateBlocks() {
    for (let i = this.blockBounces.length - 1; i >= 0; i--) {
      const b = this.blockBounces[i];
      b.offset += b.velocity;
      b.velocity += 0.8;
      if (b.offset >= 0) {
        b.offset = 0;
        this.blockBounces.splice(i, 1);
      }
    }
  }

  // ==========================================
  // ENEMIES (AI, PATROL, STOMP & DAMAGE)
  // ==========================================
  updateEnemies() {
    this.enemies.forEach(enemy => {
      if (enemy.state === 'squashed') {
        enemy.squashTimer--;
        return;
      }
      if (enemy.state === 'dead') {
        enemy.y += enemy.vy;
        enemy.vy += 0.4;
        return;
      }

      // Enemy horizontal patrol
      enemy.x += enemy.vx;

      // Enemy gravity
      enemy.vy += 0.4;
      if (enemy.vy > 8) enemy.vy = 8;
      enemy.y += enemy.vy;

      // Enemy tile collision
      this.checkEnemyCollisions(enemy);

      // Animation cycle
      enemy.animTimer++;
      if (enemy.animTimer > 12) {
        enemy.animTimer = 0;
        enemy.animFrame = (enemy.animFrame + 1) % 2;
      }

      // Interaction with Player
      if (this.player && this.state === 'PLAYING') {
        this.checkPlayerEnemyCollision(enemy);
      }
    });

    // Remove squashed enemies that finished their timer
    this.enemies = this.enemies.filter(e => !(e.state === 'squashed' && e.squashTimer <= 0) && e.y < this.levelHeight + 80);
  }

  checkEnemyCollisions(e) {
    // Solid tile horizontal check
    const startX = Math.floor(e.x / this.tileSize);
    const endX = Math.floor((e.x + e.width) / this.tileSize);
    const startY = Math.floor(e.y / this.tileSize);
    const endY = Math.floor((e.y + e.height - 1) / this.tileSize);

    for (let ty = startY; ty <= endY; ty++) {
      for (let tx = startX; tx <= endX; tx++) {
        if (ty >= 0 && ty < this.levelHeightInTiles && tx >= 0 && tx < this.levelWidthInTiles) {
          const tile = this.map[ty][tx];
          if (this.isSolidTile(tile) && tile !== 5) {
            if (e.vx > 0) {
              e.x = tx * this.tileSize - e.width;
              e.vx = -Math.abs(e.vx); // Reverse direction
            } else if (e.vx < 0) {
              e.x = (tx + 1) * this.tileSize;
              e.vx = Math.abs(e.vx); // Reverse direction
            }
          }
        }
      }
    }

    // Vertical check (ground)
    const checkBottomY = Math.floor((e.y + e.height) / this.tileSize);
    let foundGround = false;
    for (let tx = startX; tx <= endX; tx++) {
      if (checkBottomY >= 0 && checkBottomY < this.levelHeightInTiles && tx >= 0 && tx < this.levelWidthInTiles) {
        const tile = this.map[checkBottomY][tx];
        if (this.isSolidTile(tile)) {
          e.y = checkBottomY * this.tileSize - e.height;
          e.vy = 0;
          e.isGrounded = true;
          foundGround = true;
          break;
        }
      }
    }
    if (!foundGround) {
      e.isGrounded = false;
    }

    // Smart ledge turnaround (prevents falling off platforms unless intended)
    if (e.isGrounded) {
      const aheadX = e.vx > 0 ? e.x + e.width + 4 : e.x - 4;
      const aheadTileX = Math.floor(aheadX / this.tileSize);
      const belowTileY = Math.floor((e.y + e.height + 4) / this.tileSize);
      if (belowTileY >= 0 && belowTileY < this.levelHeightInTiles && aheadTileX >= 0 && aheadTileX < this.levelWidthInTiles) {
        if (!this.isSolidTile(this.map[belowTileY][aheadTileX])) {
          e.vx = -e.vx;
        }
      }
    }
  }

  checkPlayerEnemyCollision(e) {
    if (e.state !== 'walk') return;
    const p = this.player;

    // AABB intersection check
    const overlapX = p.x + p.width > e.x + 4 && p.x < e.x + e.width - 4;
    const overlapY = p.y + p.height > e.y && p.y < e.y + e.height;

    if (overlapX && overlapY) {
      // Stomp condition: player is falling and feet hit near enemy head
      const isStomp = p.vy > 0 && (p.y + p.height - p.vy <= e.y + 14 || p.y + p.height <= e.y + 18);

      if (isStomp) {
        // Player stomped enemy!
        this.defeatEnemy(e, 'stomp');
        p.vy = -6.8; // Bounce high
        p.isGrounded = false;
      } else {
        // Player touched enemy: Take damage!
        if (p.invulnerableTimer <= 0) {
          this.handlePlayerHurt();
        }
      }
    }
  }

  defeatEnemy(enemy, method = 'stomp') {
    if (method === 'stomp') {
      enemy.state = 'squashed';
      enemy.squashTimer = 35;
      this.sound.playStomp();
      this.addScore(200, enemy.x + enemy.width / 2, enemy.y);
      this.createStompParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    } else {
      // Flipped by bump
      enemy.state = 'dead';
      enemy.vy = -5;
      this.sound.playStomp();
      this.addScore(200, enemy.x + enemy.width / 2, enemy.y);
      this.createStompParticles(enemy.x + enemy.width / 2, enemy.y);
    }
  }

  handlePlayerHurt() {
    this.sound.playHurt();
    this.lives--;
    this.updateHUD();

    if (this.lives <= 0) {
      this.handlePlayerDeath(false, true);
    } else {
      // Knockback and temporary invulnerability
      this.player.invulnerableTimer = 90; // 1.5 seconds flash
      this.player.vy = -5.0;
      this.player.vx = this.player.facing === 'right' ? -3.5 : 3.5;
      this.createDustParticle(this.player.x, this.player.y, 8);
    }
  }

  handlePlayerDeath(fellInPit, alreadyDecremented = false) {
    this.player.dead = true;
    if (!alreadyDecremented) {
      this.sound.playHurt();
      this.lives--;
      this.updateHUD();
    }

    if (this.lives <= 0) {
      this.state = 'GAME_OVER';
      this.sound.playGameOver();
      document.getElementById('finalScore').innerText = this.score;
      document.getElementById('gameOverOverlay').classList.remove('hidden');
    } else {
      // Safe respawn after 1 second
      this.state = 'HURT_RESPAWN';
      this.respawnTimer = 60;
    }
  }

  findSafeRespawnX() {
    // Find closest solid ground tile to current camera
    let centerTileX = Math.max(2, Math.floor(this.camera.x / this.tileSize) + 2);
    for (let offset = 0; offset < 35; offset++) {
      const checkX = centerTileX - offset;
      if (checkX >= 0 && this.map[12] && this.map[12][checkX] === 1) {
        return checkX * this.tileSize;
      }
    }
    return 64; // Default safe spawn
  }

  updateHurtRespawn() {
    this.respawnTimer--;
    if (this.respawnTimer <= 0) {
      const respawnX = this.findSafeRespawnX();
      this.spawnPlayer(respawnX, 10 * this.tileSize);
      this.player.invulnerableTimer = 120; // 2 seconds flash
      this.state = 'PLAYING';
    }
  }

  // ==========================================
  // COLLECTIBLES (COINS & FINISH FLAG)
  // ==========================================
  updateCollectibles() {
    const p = this.player;

    this.collectibles.forEach(c => {
      if (c.collected) return;
      // Overlap check
      if (p.x + p.width > c.x && p.x < c.x + c.width &&
          p.y + p.height > c.y && p.y < c.y + c.height) {
        c.collected = true;
        this.collectCoinBonus(c.x, c.y);
      }
    });

    // Remove collected coins
    this.collectibles = this.collectibles.filter(c => !c.collected);
  }

  collectCoinBonus(x, y) {
    this.sound.playCoin();
    this.coins++;
    // 100 coins gives extra life
    if (this.coins >= 100) {
      this.coins -= 100;
      this.lives = Math.min(this.maxLives, this.lives + 1);
    }
    this.addScore(100, x, y);
    this.createCoinSparkleParticles(x + 10, y + 10);
  }

  addScore(pts, popupX, popupY) {
    this.score += pts;
    this.floatingTexts.push({
      text: `+${pts}`,
      x: popupX,
      y: popupY,
      alpha: 1.0,
      life: 40
    });
  }

  triggerVictory() {
    this.state = 'LEVEL_CLEAR';
    this.flag.hit = true;
    this.sound.playWin();

    // Bonus points for completing level
    this.addScore(1000, this.flag.x, this.flag.topY);

    // Stop player
    this.player.vx = 0;
    this.player.vy = 0;

    this.winSequenceTimer = 0;
  }

  updateLevelClear() {
    this.winSequenceTimer++;

    // 1. Flag slides down pole
    if (this.flag.flagY < this.flag.baseY - 32) {
      this.flag.flagY += 3.0;
    }

    // 2. Slide hero down pole first
    if (this.player.y + this.player.height < this.flag.baseY) {
      this.player.y += 3.0;
    } else {
      // 3. Hero walks into castle
      if (this.player.x < this.castle.x + 32) {
        this.player.x += 2.0;
        this.player.facing = 'right';
        this.player.runTimer++;
        if (this.player.runTimer > 6) {
          this.player.runTimer = 0;
          this.player.runFrame = (this.player.runFrame + 1) % 3;
        }
      } else {
        // Reached inside castle doorway
        this.player.alpha = 0;
      }
    }

    // 4. Show Win Overlay after animation finishes
    if (this.winSequenceTimer > 180) {
      document.getElementById('winScore').innerText = this.score;
      document.getElementById('winCoins').innerText = this.coins;
      document.getElementById('winOverlay').classList.remove('hidden');
    }
  }

  // ==========================================
  // CAMERA & PARALLAX
  // ==========================================
  updateCamera() {
    if (!this.player) return;

    // Smooth camera horizontal tracking with deadzone
    const targetX = this.player.x - this.width * 0.38;
    this.camera.x += (targetX - this.camera.x) * 0.12;

    // Clamp camera within level bounds
    const maxCameraX = this.levelWidth - this.width;
    this.camera.x = Math.max(0, Math.min(maxCameraX, this.camera.x));
  }

  // ==========================================
  // PARTICLE SYSTEM
  // ==========================================
  createDustParticle(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 1.2,
        size: 3 + Math.random() * 3,
        color: '#e9ecef',
        alpha: 0.8,
        life: 18
      });
    }
  }

  createCoinSparkleParticles(x, y) {
    const colors = ['#ffd166', '#ffb703', '#ffffff'];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const speed = 1.8 + Math.random();
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3,
        color: colors[i % colors.length],
        alpha: 1.0,
        life: 25
      });
    }
  }

  createCoinPopParticle(x, y) {
    // Bouncing coin from question block
    this.particles.push({
      x: x,
      y: y,
      vx: 0,
      vy: -5.5,
      gravity: 0.35,
      isCoinPop: true,
      frame: 0,
      alpha: 1.0,
      life: 26
    });
  }

  createStompParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        size: 4,
        color: '#ffbe0b',
        alpha: 1.0,
        life: 20
      });
    }
  }

  createDebrisParticles(x, y) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (i < 2 ? -2 : 2) * (1 + Math.random()),
        vy: -3 - Math.random() * 2,
        gravity: 0.3,
        size: 6,
        color: '#c85a28',
        alpha: 1.0,
        life: 30
      });
    }
  }

  updateParticles() {
    // Update floating score numbers
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 0.8;
      ft.life--;
      ft.alpha = ft.life / 40;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      p.life--;
      p.alpha = Math.max(0, p.life / 25);
      if (p.isCoinPop) {
        p.frame = (p.frame + 1) % 4;
      }
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // ==========================================
  // RENDERING
  // ==========================================
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Sky Gradient Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#5c94fc');   // Bright retro sky blue
    skyGrad.addColorStop(0.7, '#88b5fc');
    skyGrad.addColorStop(1, '#d0e5ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Parallax Background Scenery (Clouds & Hills)
    this.renderParallaxScenery(ctx);

    ctx.save();
    // Translate by Camera
    ctx.translate(-Math.floor(this.camera.x), 0);

    // 3. Render Level Tiles
    this.renderTiles(ctx);

    // 4. Render Finish Flag & Castle
    this.renderFlagAndCastle(ctx);

    // 5. Render Collectibles (Coins)
    this.renderCollectibles(ctx);

    // 6. Render Enemies
    this.renderEnemies(ctx);

    // 7. Render Hero (Nischay)
    this.renderHero(ctx);

    // 8. Render Particles & Floating Texts
    this.renderParticles(ctx);

    ctx.restore();
  }

  renderParallaxScenery(ctx) {
    if (!this.scenery) return;

    // Distant Hills (0.2 parallax factor)
    const hillParallax = this.camera.x * 0.2;
    this.scenery.forEach(item => {
      if (item.type === 'hill') {
        const renderX = item.x - hillParallax;
        if (renderX + 120 > 0 && renderX < this.width) {
          ctx.drawImage(this.sprites.sprites.hill, renderX, item.y);
        }
      }
    });

    // Clouds (0.4 parallax factor + slow floating movement)
    const cloudParallax = this.camera.x * 0.35 - (this.animTick * 0.2);
    this.scenery.forEach(item => {
      if (item.type === 'cloud') {
        const renderX = ((item.x - cloudParallax) % (this.levelWidth + 300) + (this.levelWidth + 300)) % (this.levelWidth + 300) - 100;
        if (renderX + 80 > 0 && renderX < this.width) {
          ctx.drawImage(this.sprites.sprites.cloud, renderX, item.y);
        }
      }
    });

    // Foreground Bushes (1.0 parallax: rendered in tile pass for accurate grounding)
  }

  renderTiles(ctx) {
    const startCol = Math.max(0, Math.floor(this.camera.x / this.tileSize));
    const endCol = Math.min(this.levelWidthInTiles - 1, Math.ceil((this.camera.x + this.width) / this.tileSize));

    // Render bushes in background of tiles
    this.scenery.forEach(item => {
      if (item.type === 'bush') {
        ctx.drawImage(this.sprites.sprites.bush, item.x, item.y);
      }
    });

    for (let ty = 0; ty < this.levelHeightInTiles; ty++) {
      for (let tx = startCol; tx <= endCol; tx++) {
        const tile = this.map[ty][tx];
        if (tile === 0) continue;

        let renderX = tx * this.tileSize;
        let renderY = ty * this.tileSize;

        // Apply bounce offset if bumped
        const bump = this.blockBounces.find(b => b.tx === tx && b.ty === ty);
        if (bump) {
          renderY += bump.offset;
        }

        switch (tile) {
          case 1: // Grass
            ctx.drawImage(this.sprites.sprites.tile_grass, renderX, renderY);
            break;
          case 2: // Dirt
            ctx.drawImage(this.sprites.sprites.tile_dirt, renderX, renderY);
            break;
          case 3: // Question Block
            ctx.drawImage(this.sprites.sprites.tile_question, renderX, renderY);
            break;
          case 4: // Brick
            ctx.drawImage(this.sprites.sprites.tile_brick, renderX, renderY);
            break;
          case 5: // Wood Platform
            ctx.drawImage(this.sprites.sprites.platform_wood, renderX, renderY);
            break;
          case 6: // Pipe Cap Left
            ctx.drawImage(this.sprites.sprites.pipe_cap_left, renderX, renderY);
            break;
          case 7: // Pipe Cap Right
            ctx.drawImage(this.sprites.sprites.pipe_cap_right, renderX, renderY);
            break;
          case 8: // Pipe Body Left
            ctx.drawImage(this.sprites.sprites.pipe_body_left, renderX, renderY);
            break;
          case 9: // Pipe Body Right
            ctx.drawImage(this.sprites.sprites.pipe_body_right, renderX, renderY);
            break;
          case 10: // Hit empty question block
            ctx.drawImage(this.sprites.sprites.tile_empty_box, renderX, renderY);
            break;
        }
      }
    }
  }

  renderFlagAndCastle(ctx) {
    // Castle
    if (this.castle) {
      ctx.drawImage(this.sprites.sprites.castle, this.castle.x, this.castle.y);
    }

    // Flagpole
    if (this.flag) {
      const poleX = this.flag.x;
      const topY = this.flag.topY;
      const baseY = this.flag.baseY;

      // Pole line
      ctx.fillStyle = '#adb5bd';
      ctx.fillRect(poleX + 6, topY + 8, 4, baseY - topY - 8);

      // Gold ball on top
      ctx.drawImage(this.sprites.sprites.flag_orb, poleX, topY);

      // Flag banner
      ctx.drawImage(this.sprites.sprites.flag_banner, poleX - 32, this.flag.flagY);
    }
  }

  renderCollectibles(ctx) {
    const coinFrameIndex = Math.floor(this.animTick / 8) % 4;
    const coinSprite = this.sprites.sprites.coins[coinFrameIndex];

    this.collectibles.forEach(c => {
      if (!c.collected) {
        ctx.drawImage(coinSprite, c.x, c.y);
      }
    });
  }

  renderEnemies(ctx) {
    this.enemies.forEach(e => {
      if (e.state === 'squashed') {
        ctx.drawImage(this.sprites.sprites.enemy_grumper_flat, e.x, e.y + 10);
      } else if (e.state === 'walk') {
        const sprite = e.animFrame === 0 ? this.sprites.sprites.enemy_grumper1 : this.sprites.sprites.enemy_grumper2;
        ctx.drawImage(sprite, e.x, e.y);
      } else if (e.state === 'dead') {
        // Render flipped upside down
        ctx.save();
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
        ctx.scale(1, -1);
        ctx.drawImage(this.sprites.sprites.enemy_grumper1, -e.width / 2, -e.height / 2);
        ctx.restore();
      }
    });
  }

  renderHero(ctx) {
    const p = this.player;
    if (!p || p.dead || p.alpha === 0) return;

    // Invulnerability blink effect
    if (p.invulnerableTimer > 0 && Math.floor(p.invulnerableTimer / 4) % 2 === 0) {
      return; // Skip rendering frame for flicker
    }

    // Determine current sprite frame
    let sprite = this.sprites.sprites.hero_idle;
    if (p.invulnerableTimer > 0) {
      sprite = this.sprites.sprites.hero_hurt;
    } else if (!p.isGrounded) {
      sprite = this.sprites.sprites.hero_jump;
    } else if (Math.abs(p.vx) > 0.4) {
      const runFrames = [
        this.sprites.sprites.hero_run1,
        this.sprites.sprites.hero_run2,
        this.sprites.sprites.hero_run3
      ];
      sprite = runFrames[p.runFrame];
    }

    ctx.save();
    // Center alignment
    const drawX = Math.round(p.x - (this.sprites.heroWidth - p.width) / 2);
    const drawY = Math.round(p.y - (this.sprites.heroHeight - p.height));

    if (p.facing === 'left') {
      // Flip horizontally
      ctx.translate(drawX + this.sprites.heroWidth, drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0);
    } else {
      ctx.drawImage(sprite, drawX, drawY);
    }
    ctx.restore();
  }

  renderParticles(ctx) {
    // Particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      if (p.isCoinPop) {
        const coinSprite = this.sprites.sprites.coins[p.frame];
        ctx.drawImage(coinSprite, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.restore();
    });

    // Floating score numbers
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 13px monospace';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  updateHUD() {
    const scoreEl = document.getElementById('hudScore');
    const coinsEl = document.getElementById('hudCoins');
    const livesEl = document.getElementById('hudLives');

    if (scoreEl) scoreEl.innerText = this.score.toString().padStart(6, '0');
    if (coinsEl) coinsEl.innerText = this.coins.toString().padStart(2, '0');
    if (livesEl) {
      let hearts = '';
      for (let i = 0; i < this.maxLives; i++) {
        hearts += i < this.lives ? '❤️' : '🖤';
      }
      livesEl.innerText = hearts;
    }
  }
}

window.Game = Game;

// Boot game when window is ready
window.addEventListener('DOMContentLoaded', () => {
  window.nischayGame = new Game();
});
