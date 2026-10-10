/**
 * Nischay's Adventure - Pixel Art & Sprite Generation Engine
 * Programmatically renders original retro pixel-art sprites onto offscreen canvases.
 */

class SpriteEngine {
  constructor() {
    this.sprites = {};
    this.tileSize = 32;
    this.heroWidth = 28;
    this.heroHeight = 36;
    this.init();
  }

  // Helper to create an offscreen canvas
  createCanvas(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  init() {
    this.createHeroSprites();
    this.createEnemySprites();
    this.createTileSprites();
    this.createCoinSprites();
    this.createDecorationSprites();
    this.createFlagAndCastleSprites();
  }

  // Draw pixel grid helper: array of string rows with a color map
  drawPixelMatrix(ctx, matrix, colorMap, scale = 1, offsetX = 0, offsetY = 0) {
    for (let y = 0; y < matrix.length; y++) {
      const row = matrix[y];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        if (char !== '.' && colorMap[char]) {
          ctx.fillStyle = colorMap[char];
          ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
        }
      }
    }
  }

  // ==========================================
  // 1. HERO SPRITES (Nischay)
  // Original hero: Red cap/band, dark hair, expressive eyes,
  // royal blue adventurer vest over golden-yellow shirt, denim jeans, red-white sneakers.
  // ==========================================
  createHeroSprites() {
    const C = {
      '.': null,
      'k': '#1a1829', // Hair / outline
      'r': '#e63946', // Red cap/headband & shoe trim
      'd': '#a8202b', // Dark red shadow
      's': '#ffd166', // Golden-yellow shirt
      'b': '#1d3557', // Navy adventurer vest
      'l': '#457b9d', // Blue vest highlight
      'p': '#ffe3d1', // Skin / face
      'm': '#f4b896', // Skin shadow
      'w': '#ffffff', // White eyes & sneaker sole
      'e': '#22223b', // Eye pupils
      'j': '#2b4162', // Jeans / denim pants
      'g': '#1a273b', // Jeans shadow
      'h': '#f1faee'  // Sneaker white
    };

    // Frame 1: Idle
    const idleMatrix = [
      "....rrrrrrrr....",
      "...rrrrrrrrrr...",
      "..kkkkkkkkkkkk..",
      "..kppppppppppk..",
      "..kpwep..pwepk..",
      "..kppppppppppk..",
      "..kpppmmmmpppk..",
      "...kpppppppk....",
      "..bbssssssssbb..",
      ".llbbssssssbbll.",
      ".llbbssssssbbll.",
      ".llbbssssssbbll.",
      "..bbssssssssbb..",
      "...jjjj..jjjj...",
      "...jjjj..jjjj...",
      "...gggg..gggg...",
      "..rrrr....rrrr..",
      "..hhhh....hhhh.."
    ];

    // Frame 2: Run 1
    const run1Matrix = [
      "....rrrrrrrr....",
      "...rrrrrrrrrr...",
      "..kkkkkkkkkkkk..",
      "..kppppppppppk..",
      "..kpwep..pwepk..",
      "..kppppppppppk..",
      "..kpppmmmmpppk..",
      "...kpppppppk....",
      "..bbssssssssbb..",
      ".llbbssssssbbll.",
      ".llbbssssssbbll.",
      "...bbssssssbb...",
      "..jjjjjjjjjj....",
      "..jjjj....jjjj..",
      "..gggg......gg..",
      ".rrrr......rrrr.",
      ".hhhh......hhhh."
    ];

    // Frame 3: Run 2
    const run2Matrix = [
      "....rrrrrrrr....",
      "...rrrrrrrrrr...",
      "..kkkkkkkkkkkk..",
      "..kppppppppppk..",
      "..kpwep..pwepk..",
      "..kppppppppppk..",
      "..kpppmmmmpppk..",
      "...kpppppppk....",
      "..bbssssssssbb..",
      ".llbbssssssbbll.",
      ".llbbssssssbbll.",
      "...bbssssssbb...",
      "....jjjjjjjj....",
      "....jjjjjjjj....",
      ".....gggggg.....",
      ".....rrrrrr.....",
      ".....hhhhhh....."
    ];

    // Frame 4: Run 3 (Stride forward)
    const run3Matrix = [
      "....rrrrrrrr....",
      "...rrrrrrrrrr...",
      "..kkkkkkkkkkkk..",
      "..kppppppppppk..",
      "..kpwep..pwepk..",
      "..kppppppppppk..",
      "..kpppmmmmpppk..",
      "...kpppppppk....",
      "..bbssssssssbb..",
      ".llbbssssssbbll.",
      ".llbbssssssbbll.",
      "...bbssssssbb...",
      "....jjjjjjjjjj..",
      "..jjjj....jjjj..",
      "..gg......gggg..",
      ".rrrr......rrrr.",
      ".hhhh......hhhh."
    ];

    // Frame 5: Jump
    const jumpMatrix = [
      "....rrrrrrrr....",
      "...rrrrrrrrrr...",
      "..kkkkkkkkkkkk..",
      "..kppppppppppk..",
      "..kpwep..pwepk..",
      "..kppppppppppk..",
      "...kppwwwwppk...",
      "...kpppppppk....",
      ".lbbssssssssbbl.",
      "llbbssssssssbbll",
      "l.bbssssssssbb.l",
      "...bbssssssbb...",
      "..jjjjjjjjjjjj..",
      ".jjjj......jjjj.",
      ".gggg......gggg.",
      ".rrrr......rrrr.",
      ".hhhh......hhhh."
    ];

    // Frame 6: Hurt
    const hurtMatrix = [
      "....rrrrrrrr....",
      "...rrrrrrrrrr...",
      "..kkkkkkkkkkkk..",
      "..kppppppppppk..",
      "..kpxep..pxepk..",
      "..kppppppppppk..",
      "..kppooooooppk..",
      "...kpppppppk....",
      "..bbssssssssbb..",
      ".llbbssssssbbll.",
      "...bbssssssbb...",
      "....jjjjjjjj....",
      "...jjjj..jjjj...",
      "...gggg..gggg...",
      "..rrrr....rrrr..",
      "..hhhh....hhhh.."
    ];
    const hurtColorMap = { ...C, 'x': '#e63946', 'o': '#d90429' };

    const renderHeroFrame = (matrix, map = C) => {
      const { canvas, ctx } = this.createCanvas(this.heroWidth, this.heroHeight);
      this.drawPixelMatrix(ctx, matrix, map, 2, (this.heroWidth - 16 * 2) / 2, 0);
      return canvas;
    };

    this.sprites.hero_idle = renderHeroFrame(idleMatrix);
    this.sprites.hero_run1 = renderHeroFrame(run1Matrix);
    this.sprites.hero_run2 = renderHeroFrame(run2Matrix);
    this.sprites.hero_run3 = renderHeroFrame(run3Matrix);
    this.sprites.hero_jump = renderHeroFrame(jumpMatrix);
    this.sprites.hero_hurt = renderHeroFrame(hurtMatrix, hurtColorMap);
  }

  // ==========================================
  // 2. ENEMY SPRITES
  // Grumper: Cute grumpy chestnut-like forest critter
  // Spiky: Armored turtle-slug patrol bug
  // ==========================================
  createEnemySprites() {
    const G = {
      '.': null,
      'b': '#582f0e', // Dark outline
      'c': '#a66a38', // Chestnut skin
      'l': '#ddb892', // Highlight
      'w': '#ffffff', // Big eye whites
      'e': '#1f2421', // Pupil
      'f': '#d4a373', // Feet
      'r': '#d00000'  // Grumpy brow/mouth
    };

    const grumper1 = [
      ".....bbbbbb.....",
      "...bbcccccccbb...",
      "..bcccllllccccb..",
      ".bccccwewwwecccb.",
      ".bccccwewwwecccb.",
      ".bccrrreeerrcccb.",
      ".bccccrcccrccccb.",
      "..bccccccccccccb.",
      "...bbbbbbbbbbbb..",
      "....ffff..ffff...",
      "...fffff..fffff.."
    ];

    const grumper2 = [
      ".....bbbbbb.....",
      "...bbcccccccbb...",
      "..bcccllllccccb..",
      ".bccccwewwwecccb.",
      ".bccccwewwwecccb.",
      ".bccrrreeerrcccb.",
      ".bccccrcccrccccb.",
      "..bccccccccccccb.",
      "...bbbbbbbbbbbb..",
      "..fffff....ffff..",
      ".ffffff....fffff."
    ];

    const grumperFlat = [
      "................",
      "................",
      "................",
      ".....bbbbbb.....",
      "...bbcccccccbb...",
      ".bccccwewwwecccb.",
      ".bccrrreeerrcccb.",
      "bbbbbbbbbbbbbbbb",
      "ffffffffffffffff"
    ];

    const renderEnemyFrame = (matrix, colorMap, w = 32, h = 28) => {
      const { canvas, ctx } = this.createCanvas(w, h);
      this.drawPixelMatrix(ctx, matrix, colorMap, 2, (w - 16 * 2) / 2, h - matrix.length * 2);
      return canvas;
    };

    this.sprites.enemy_grumper1 = renderEnemyFrame(grumper1, G);
    this.sprites.enemy_grumper2 = renderEnemyFrame(grumper2, G);
    this.sprites.enemy_grumper_flat = renderEnemyFrame(grumperFlat, G);
  }

  // ==========================================
  // 3. TILE SPRITES (32x32)
  // Grass, Dirt, Brick, Question Blocks, Pipes
  // ==========================================
  createTileSprites() {
    const T = this.tileSize;

    // Grass Top Tile
    {
      const { canvas, ctx } = this.createCanvas(T, T);
      // Dirt base
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(0, 0, T, T);
      // Dirt texture specks
      ctx.fillStyle = '#6E431F';
      ctx.fillRect(4, 14, 4, 4);
      ctx.fillRect(18, 18, 4, 4);
      ctx.fillRect(10, 24, 4, 4);
      ctx.fillRect(24, 26, 4, 4);
      ctx.fillStyle = '#A77341';
      ctx.fillRect(14, 12, 4, 4);
      ctx.fillRect(6, 22, 4, 4);
      // Grass layer top
      ctx.fillStyle = '#38b000';
      ctx.fillRect(0, 0, T, 8);
      ctx.fillStyle = '#70e000';
      ctx.fillRect(0, 0, T, 3);
      // Grass blades hanging down
      ctx.fillStyle = '#38b000';
      ctx.fillRect(2, 8, 4, 4);
      ctx.fillRect(10, 8, 4, 6);
      ctx.fillRect(18, 8, 4, 3);
      ctx.fillRect(24, 8, 6, 5);
      // Dark under-grass shadow
      ctx.fillStyle = '#007200';
      ctx.fillRect(0, 3, T, 2);
      this.sprites.tile_grass = canvas;
    }

    // Dirt Base Tile
    {
      const { canvas, ctx } = this.createCanvas(T, T);
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(0, 0, T, T);
      ctx.fillStyle = '#6E431F';
      ctx.fillRect(4, 4, 4, 4);
      ctx.fillRect(20, 8, 4, 4);
      ctx.fillRect(12, 16, 4, 4);
      ctx.fillRect(24, 22, 4, 4);
      ctx.fillRect(6, 24, 4, 4);
      ctx.fillStyle = '#A77341';
      ctx.fillRect(12, 4, 4, 4);
      ctx.fillRect(4, 14, 4, 4);
      ctx.fillRect(20, 18, 4, 4);
      ctx.fillRect(14, 26, 4, 4);
      this.sprites.tile_dirt = canvas;
    }

    // Classic Terracotta Brick
    {
      const { canvas, ctx } = this.createCanvas(T, T);
      ctx.fillStyle = '#4a2810'; // Mortar outline
      ctx.fillRect(0, 0, T, T);

      // Brick 1 & 2 (top row)
      ctx.fillStyle = '#c85a28';
      ctx.fillRect(2, 2, 12, 12);
      ctx.fillRect(18, 2, 12, 12);
      // Brick 3 & 4 (bottom row)
      ctx.fillRect(2, 18, 12, 12);
      ctx.fillRect(18, 18, 12, 12);

      // Brick highlights
      ctx.fillStyle = '#e88048';
      ctx.fillRect(2, 2, 12, 2);
      ctx.fillRect(2, 2, 2, 12);
      ctx.fillRect(18, 2, 12, 2);
      ctx.fillRect(18, 2, 2, 12);

      ctx.fillRect(2, 18, 12, 2);
      ctx.fillRect(2, 18, 2, 12);
      ctx.fillRect(18, 18, 12, 2);
      ctx.fillRect(18, 18, 2, 12);

      // Brick shadows
      ctx.fillStyle = '#943810';
      ctx.fillRect(2, 12, 12, 2);
      ctx.fillRect(12, 2, 2, 12);
      ctx.fillRect(18, 12, 12, 2);
      ctx.fillRect(28, 2, 2, 12);

      ctx.fillRect(2, 28, 12, 2);
      ctx.fillRect(12, 18, 2, 12);
      ctx.fillRect(18, 28, 12, 2);
      ctx.fillRect(28, 18, 2, 12);

      this.sprites.tile_brick = canvas;
    }

    // Question Mark Block (Golden)
    {
      const { canvas, ctx } = this.createCanvas(T, T);
      ctx.fillStyle = '#c77d00'; // Outer shadow border
      ctx.fillRect(0, 0, T, T);

      ctx.fillStyle = '#ffb703'; // Bright gold body
      ctx.fillRect(2, 2, T - 4, T - 4);

      // Bevel highlight
      ctx.fillStyle = '#ffe49e';
      ctx.fillRect(2, 2, T - 4, 3);
      ctx.fillRect(2, 2, 3, T - 4);

      // Bevel shadow
      ctx.fillStyle = '#d48b00';
      ctx.fillRect(2, T - 5, T - 4, 3);
      ctx.fillRect(T - 5, 2, 3, T - 4);

      // Corner rivets
      ctx.fillStyle = '#8a5300';
      ctx.fillRect(4, 4, 2, 2);
      ctx.fillRect(T - 6, 4, 2, 2);
      ctx.fillRect(4, T - 6, 2, 2);
      ctx.fillRect(T - 6, T - 6, 2, 2);

      // Pixel '?' Question mark
      const qMatrix = [
        "..####..",
        ".##..##.",
        "....##..",
        "...##...",
        "...##...",
        "........",
        "...##...",
        "...##..."
      ];
      ctx.fillStyle = '#ffffff';
      for (let y = 0; y < qMatrix.length; y++) {
        for (let x = 0; x < qMatrix[y].length; x++) {
          if (qMatrix[y][x] === '#') {
            ctx.fillRect(8 + x * 2, 8 + y * 2, 2, 2);
          }
        }
      }
      this.sprites.tile_question = canvas;
    }

    // Empty / Hit Metallic Block
    {
      const { canvas, ctx } = this.createCanvas(T, T);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(0, 0, T, T);
      ctx.fillStyle = '#8d99ae';
      ctx.fillRect(2, 2, T - 4, T - 4);

      // Bevel
      ctx.fillStyle = '#b5c0d0';
      ctx.fillRect(2, 2, T - 4, 3);
      ctx.fillRect(2, 2, 3, T - 4);
      ctx.fillStyle = '#555f71';
      ctx.fillRect(2, T - 5, T - 4, 3);
      ctx.fillRect(T - 5, 2, 3, T - 4);

      // Dark rivets
      ctx.fillStyle = '#2b2d42';
      ctx.fillRect(4, 4, 3, 3);
      ctx.fillRect(T - 7, 4, 3, 3);
      ctx.fillRect(4, T - 7, 3, 3);
      ctx.fillRect(T - 7, T - 7, 3, 3);
      this.sprites.tile_empty_box = canvas;
    }

    // Pipe Cap (Left & Right 32x32 each = 64x32 total cap)
    {
      const { canvas: capL, ctx: ctxL } = this.createCanvas(T, T);
      ctxL.fillStyle = '#0a4214'; // Outline
      ctxL.fillRect(0, 0, T, T);
      ctxL.fillStyle = '#2dc653'; // Green base
      ctxL.fillRect(2, 2, T - 2, T - 4);
      ctxL.fillStyle = '#95d5b2'; // Highlight stripe
      ctxL.fillRect(6, 4, 6, T - 8);
      ctxL.fillStyle = '#52b788'; // Midtone
      ctxL.fillRect(16, 4, 8, T - 8);
      this.sprites.pipe_cap_left = capL;

      const { canvas: capR, ctx: ctxR } = this.createCanvas(T, T);
      ctxR.fillStyle = '#0a4214';
      ctxR.fillRect(0, 0, T, T);
      ctxR.fillStyle = '#2dc653';
      ctxR.fillRect(0, 2, T - 2, T - 4);
      ctxR.fillStyle = '#1b4332'; // Deep shadow on right side
      ctxR.fillRect(T - 10, 4, 8, T - 8);
      this.sprites.pipe_cap_right = capR;
    }

    // Pipe Body (Left & Right 32x32 each)
    {
      const { canvas: bodyL, ctx: ctxBL } = this.createCanvas(T, T);
      ctxBL.fillStyle = '#0a4214';
      ctxBL.fillRect(4, 0, T - 4, T);
      ctxBL.fillStyle = '#2dc653';
      ctxBL.fillRect(6, 0, T - 6, T);
      ctxBL.fillStyle = '#95d5b2'; // Highlight stripe
      ctxBL.fillRect(10, 0, 6, T);
      this.sprites.pipe_body_left = bodyL;

      const { canvas: bodyR, ctx: ctxBR } = this.createCanvas(T, T);
      ctxBR.fillStyle = '#0a4214';
      ctxBR.fillRect(0, 0, T - 4, T);
      ctxBR.fillStyle = '#2dc653';
      ctxBR.fillRect(0, 0, T - 6, T);
      ctxBR.fillStyle = '#1b4332'; // Shadow
      ctxBR.fillRect(T - 12, 0, 6, T);
      this.sprites.pipe_body_right = bodyR;
    }

    // Wood Platform (Floating wooden bridge)
    {
      const { canvas, ctx } = this.createCanvas(T, 16);
      ctx.fillStyle = '#582f0e';
      ctx.fillRect(0, 0, T, 16);
      ctx.fillStyle = '#7f4f24';
      ctx.fillRect(2, 2, T - 4, 12);
      ctx.fillStyle = '#936639';
      ctx.fillRect(2, 2, T - 4, 3);
      ctx.fillStyle = '#3f2208';
      ctx.fillRect(8, 2, 2, 12);
      ctx.fillRect(22, 2, 2, 12);
      this.sprites.platform_wood = canvas;
    }
  }

  // ==========================================
  // 4. COIN SPRITES (Spinning animation)
  // 4 rotation frames: wide, mid, narrow, edge
  // ==========================================
  createCoinSprites() {
    const W = 20;
    const H = 20;
    const frames = [
      { w: 16, h: 20 },
      { w: 12, h: 20 },
      { w: 6,  h: 20 },
      { w: 12, h: 20 }
    ];

    this.sprites.coins = [];

    frames.forEach((f, idx) => {
      const { canvas, ctx } = this.createCanvas(W, H);
      const x = (W - f.w) / 2;
      const y = (H - f.h) / 2;

      // Dark border
      ctx.fillStyle = '#b7791f';
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, f.w / 2, f.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gold fill
      ctx.fillStyle = '#f6e05e';
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, (f.w / 2) - 1.5, (f.h / 2) - 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gleam / shine
      if (f.w > 8) {
        ctx.fillStyle = '#fffdf0';
        ctx.fillRect(W / 2 - 2, y + 3, 2, f.h - 6);
      }

      this.sprites.coins.push(canvas);
    });
  }

  // ==========================================
  // 5. DECORATIONS (Bushes, Clouds, Hills)
  // ==========================================
  createDecorationSprites() {
    // Cloud (small: 64x36, large: 96x42)
    {
      const { canvas, ctx } = this.createCanvas(72, 36);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(20, 24, 12, 0, Math.PI * 2);
      ctx.arc(36, 16, 16, 0, Math.PI * 2);
      ctx.arc(52, 24, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(16, 20, 40, 16);
      // Soft bottom shadow
      ctx.fillStyle = 'rgba(210, 230, 255, 0.6)';
      ctx.fillRect(16, 32, 40, 4);
      this.sprites.cloud = canvas;
    }

    // Bush
    {
      const { canvas, ctx } = this.createCanvas(64, 32);
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.arc(18, 20, 12, 0, Math.PI * 2);
      ctx.arc(32, 14, 14, 0, Math.PI * 2);
      ctx.arc(46, 20, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(12, 18, 40, 14);

      // Highlight leaves
      ctx.fillStyle = '#52b788';
      ctx.beginPath();
      ctx.arc(18, 17, 7, 0, Math.PI * 2);
      ctx.arc(32, 11, 9, 0, Math.PI * 2);
      ctx.arc(46, 17, 7, 0, Math.PI * 2);
      ctx.fill();
      this.sprites.bush = canvas;
    }

    // Distant Hill (96x64)
    {
      const { canvas, ctx } = this.createCanvas(120, 64);
      ctx.fillStyle = '#40916c';
      ctx.beginPath();
      ctx.arc(60, 64, 58, Math.PI, 0, false);
      ctx.fill();
      ctx.fillStyle = '#74c69d';
      ctx.beginPath();
      ctx.arc(52, 64, 46, Math.PI, 0, false);
      ctx.fill();
      this.sprites.hill = canvas;
    }
  }

  // ==========================================
  // 6. FINISH FLAG & CASTLE
  // ==========================================
  createFlagAndCastleSprites() {
    // Flag pole top orb & banner
    {
      const { canvas, ctx } = this.createCanvas(40, 32);
      // Banner
      ctx.fillStyle = '#e63946'; // Hero red flag
      ctx.beginPath();
      ctx.moveTo(4, 2);
      ctx.lineTo(36, 12);
      ctx.lineTo(4, 24);
      ctx.closePath();
      ctx.fill();

      // Star / emblem in the center of flag
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(10, 10, 6, 6);
      this.sprites.flag_banner = canvas;
    }

    // Flag pole ball
    {
      const { canvas, ctx } = this.createCanvas(16, 16);
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(6, 4, 3, 3);
      this.sprites.flag_orb = canvas;
    }

    // Mini Castle / Gate at level finish (96x96)
    {
      const { canvas, ctx } = this.createCanvas(96, 96);
      // Base walls
      ctx.fillStyle = '#6c757d';
      ctx.fillRect(8, 24, 80, 72);
      // Battlements
      ctx.fillStyle = '#495057';
      ctx.fillRect(8, 12, 16, 12);
      ctx.fillRect(40, 12, 16, 12);
      ctx.fillRect(72, 12, 16, 12);

      // Wall texture bricks
      ctx.fillStyle = '#343a40';
      ctx.fillRect(16, 36, 12, 4);
      ctx.fillRect(64, 36, 12, 4);
      ctx.fillRect(36, 52, 16, 4);
      ctx.fillRect(16, 70, 14, 4);
      ctx.fillRect(66, 70, 14, 4);

      // Gate Arch (Doorway)
      ctx.fillStyle = '#212529';
      ctx.beginPath();
      ctx.arc(48, 64, 16, Math.PI, 0, false);
      ctx.rect(32, 64, 32, 32);
      ctx.fill();

      // Victory banner above door
      ctx.fillStyle = '#e63946';
      ctx.fillRect(34, 40, 28, 8);
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(44, 42, 8, 4);

      this.sprites.castle = canvas;
    }
  }
}

window.SpriteEngine = SpriteEngine;
