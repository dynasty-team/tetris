# tetris


## Game Overview
Tetris เป็นเกมแนว Puzzle แบบผู้เล่นคนเดียว โดยผู้เล่นจะต้องควบคุม Tetromino ที่ตกลงมาจากด้านบน และจัดเรียงให้เต็มแถวบน Board 
ขนาด 10 × 20 ช่อง ภายในเกมมี Tetromino ทั้งหมด 7 รูปแบบ ได้แก่ I, O, T, S, Z, J และ L ผู้เล่นสามารถขยับ หมุนเปลี่ยนทิศทาง และเร่งการตกของชิ้นส่วน เพื่อจัดวางให้เหมาะสม เมื่อสามารถเติมแถวได้ครบ แถวนั้นจะถูกลบออกและผู้เล่นจะได้รับคะแนน
เกมมีระบบ Score, Level และความเร็วในการตกที่เพิ่มขึ้นตาม Level โดยเกมจะจบเมื่อไม่สามารถสร้าง Tetromino ชิ้นใหม่ลงบน Board ได้
โปรเจกต์นี้พัฒนาเป็น Console Game โดยแบ่งส่วนการทำงานออกเป็น Game Logic, Input, Rendering และ Save System เพื่อให้แต่ละส่วนสามารถพัฒนาและทดสอบได้ง่ายขึ้น

## Requirements 

- Board ขนาด 10 × 20 รองรับ Empty Cell และ Occupied Cell

- รองรับ Tetromino ทั้ง 7 รูปแบบ:
  I, O, T, S, Z, J, L

- แต่ละ Piece ต้องรองรับ:
  - Position
  - Rotation
  - Movement
  - Collision Detection

- รองรับ Keyboard Control:
  - A / ← : Move Left
  - D / → : Move Right
  - S / ↓ : Soft Drop
  - W / ↑ : Rotate
  - Space : Hard Drop
<<<<<<< Updated upstream
  - P : Pause
=======
  - P : Pause / Resume
>>>>>>> Stashed changes
  - Q : Quit
  
- ระบบเกมต้องมี:
  - Score
  - Level
  - Increasing Speed
  - wall kick 
  - ใช้ระบบ 7-bag Randomizer


- Game Over เมื่อ Tetromino ใหม่ไม่สามารถ Spawn ได้
## Game Rules

- วิธีการคำนวณคะแนน

  เคลียร์ 1 แถว = 100 คะแนน  
  เคลียร์ 2 แถว = 250 คะแนน  
  เคลียร์ 3 แถว = 450 คะแนน  
  เคลียร์ 4 แถว = 800 คะแนน  

แถวที่ 4 ได้คะแนนเยอะพิเศษ

- คะแนนที่ได้จะคูณตาม Level ปัจจุบัน

  Level 1 = ×1  
  Level 2 = ×2  
  Level 5 = ×5  

ตัวอย่าง หากผู้เล่นอยู่ Level 5

- เคลียร์ 1 แถว = 100 × 5 = 500 คะแนน
- เคลียร์ 2 แถว = 250 × 5 = 1,250 คะแนน
- เคลียร์ 3 แถว = 450 × 5 = 2,250 คะแนน
- เคลียร์ 4 แถว = 800 × 5 = 4,000 คะแนน


Game over
เกมจะจบลงเมื่อ Tetromino ชิ้นใหม่ไม่สามารถ Spawn ในตำแหน่งเริ่มต้นได้ เนื่องจากพื้นที่ด้านบนของ Board ถูกใช้ไปแล้ว
## Architecture

### Project Structure

tetris/
├── 01-Source-code/
│   ├── shared/
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   ├── board-utils.ts
│   │   ├── mock-engine.ts
│   │   └── utils.ts
│   │
│   ├── core-engine/
│   │   ├── TetrisEngine.ts
│   │   ├── tetromino-shapes.ts
│   │   ├── collision.ts
│   │   ├── movement.ts
│   │   ├── line-clear.ts
│   │   ├── randomizer.ts
│   │   ├── lock-pipeline.ts
│   │   ├── wall-kick-data.ts
│   │   └── index.ts
│   │
│   ├── game-state-loop/
│   │   ├── GameStateLoop.ts
│   │   ├── score.ts
│   │   ├── level.ts
│   │   └── index.ts
│   │
│   ├── io-rendering/
│   │   ├── ConsoleRenderer.ts
│   │   └── KeyboardInput.ts
│   │
│   └── persistence/
│       ├── schema.ts
│       ├── SaveManager.ts
│       └── index.ts
│
├── 02-Tests/
│   ├── core-engine/
│   │   ├── collision.test.ts
│   │   ├── line-clear.test.ts
│   │   ├── movement.test.ts
│   │   ├── randomizer.test.ts
│   │   ├── score-level.test.ts
│   │   ├── spawn.test.ts
│   │   ├── tetromino-shapes.test.ts
│   │   └── wall-kick.test.ts
│   │
│   ├── persistence/
│   │   └── save-load.test.ts
│   │
│   ├── shared/
│   │   ├── board-utils.test.ts
│   │   └── utils.test.ts
│   │
│   └── sample.test.ts
│
├── 03-Documentation/
├── 04-Demo/
├── index.ts
├── package.json
├── tsconfig.json
└── README.md


### System Flow

Keyboard Input
      |
      v
Game State Loop
      |
      v
Tetris Engine
      |
      ├── Movement
      ├── Collision
      ├── Rotation / Wall Kick
      ├── Line Clear
      ├── Lock Pipeline
      └── Randomizer (7-Bag)
      |
      v
Render Snapshot
      |
      v
Console Renderer
      |
      v
Terminal

Game State Loop
      |
      v
Persistence
      |
      v
save-data.json

## How to Run

1. Install bun

-Windows (PowerShell)

powershell -c "irm bun.sh/install.ps1 | iex"

-macOS / Linux

curl -fsSL https://bun.sh/install | bash

-check bun version 

bun --version

2. Install Packages 
bun install

3. Run
bun run start

## How to Test

bun test

## Known Limitations

- เกมสามารถเล่นได้ผ่าน Console / Terminal เท่านั้น
- รองรับเฉพาะ Single Player
- ยังไม่มี Online Leaderboard
- การแสดงผลและ Keyboard Input อาจแตกต่างกันตาม Terminal ที่ใช้งาน


