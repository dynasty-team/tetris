# tetris

```
## Game Overview
Tetris เป็นเกมแนว Puzzle แบบผู้เล่นคนเดียว โดยผู้เล่นจะต้องควบคุม Tetromino ที่ตกลงมาจากด้านบน และจัดเรียงให้เต็มแถวบน Board 
ขนาด 10 × 20 ช่อง ภายในเกมมี Tetromino ทั้งหมด 7 รูปแบบ ได้แก่ I, O, T, S, Z, J และ L ผู้เล่นสามารถขยับ หมุนเปลี่ยนทิศทาง และเร่งการตกของชิ้นส่วน เพื่อจัดวางให้เหมาะสม เมื่อสามารถเติมแถวได้ครบ แถวนั้นจะถูกลบออกและผู้เล่นจะได้รับคะแนน
เกมมีระบบ Score, Level และความเร็วในการตกที่เพิ่มขึ้นตาม Level โดยเกมจะจบเมื่อไม่สามารถสร้าง Tetromino ชิ้นใหม่ลงบน Board ได้
โปรเจกต์นี้พัฒนาเป็น Console Game โดยแบ่งส่วนการทำงานออกเป็น Game Logic, Input, Rendering และ Save System เพื่อให้แต่ละส่วนสามารถพัฒนาและทดสอบได้ง่ายขึ้น

## Requirement หลักของเกม

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
  - Q : Quit

- ระบบเกมต้องมี:
  - Score
  - Level
  - Increasing Speed

- Game Over เมื่อ Tetromino ใหม่ไม่สามารถ Spawn ได้
## Game Rules
- วิธีการคำนวณคะแนน
จะดูจากแถว และ level การได้คะแนน

    ถ้าเคลียร์ 1 แถวจะได้ 100
    ถ้าเคลียร์ 2 แถวจะได้ 250 (x2.5)
    ถ้าเคลียร์ 3 แถวจะได้ 450 (x4.5)
    ถ้าเคลียร์ 4 แถวจะได้ 800 (x8)

แถวที่ 4 ได้คะแนนเยอะพิเศษ เลย (x8)

- วิธีคำนวณกับเลเวล

    level 1 (x1)
    level 2 (x2)
    level 5 (x5)

ตัวอย่างเลเวล ex. ผู้เล่น level 5
ถ้าเคลียร์ 1 แถวจะได้ 100 x 5 = 500
ถ้าเคลียร์ 2 แถวจะได้ 250 (x2.5) x 5 = 1250
ถ้าเคลียร์ 3 แถวจะได้ 450 (x4.5) x 5 = 2250
ถ้าเคลียร์ 4 แถวจะได้ 800 (x8) x 5 = 4000

Game over
เกมจะจบลงเมื่อ Tetromino ชิ้นใหม่ไม่สามารถ Spawn ในตำแหน่งเริ่มต้นได้ เนื่องจากพื้นที่ด้านบนของ Board ถูกใช้ไปแล้ว
## โครงสร้างโปรเจกต์

tetris/
├── 01-Source-code/
│   ├── shared/                      # [docs-architecture ประสาน, core-engine เขียน] contract กลางที่ทุกทีม import ใช้
│   │   ├── types.ts                 # Board, CellValue, ActivePiece, TetrominoType, GameAction,
│   │   │                            # RenderSnapshot, SaveData, interface CoreEngine ฯลฯ
│   │   ├── board-utils.ts           # createEmptyBoard(), getCell() — pure function ล้วน
│   │   └── utils.ts                 # pipe(), compose() — higher-order function ทั่วไป
│   │
│   ├── core-engine/                 # [core-engine — 3 คน]
│   │   ├── TetrisEngine.ts          # class TetrisEngine implements CoreEngine (state หลัก)
│   │   ├── tetromino-shapes.ts      # ข้อมูล 7 shape x 4 rotation (pure data)
│   │   ├── collision.ts             # checkCollision()
│   │   ├── movement.ts              # moveLeft/moveRight/softDrop/hardDrop/rotatePiece
│   │   ├── line-clear.ts            # checkAndClearLines()
│   │   ├── randomizer.ts            # 7-bag randomizer
|   |   ├── lock-pipeline.ts         # แปลง function ให้รองรับ pipe()
|   |   ├── wall-kick-data.ts        # ตาราง kick offset
│   │   └── index.ts                 # export รวมของโมดูล
│   │
│   ├── game-state-loop/             # [game-state-loop — 2 คน]
│   │   ├── GameStateLoop.ts         # class คุม tick loop, dispatch action, pause
│   │   ├── score.ts                 # calculateScore()
│   │   ├── level.ts                 # calculateLevel(), getSpeedForLevel()
│   │   └── index.ts
│   │
│   ├── io-rendering/                # [io-rendering — 2 คน]
│   │   ├── ConsoleRenderer.ts       # render(snapshot)
│   │   ├── KeyboardInput.ts         # raw mode + DAS/ARR
│   │   └── index.ts
│   │
│   ├── persistence/                 # [persistence — 1 คน]
│   │   ├── schema.ts                # interface SaveData + validate()
│   │   ├── SaveManager.ts           # saveGame(), loadGame()
│   │   └── index.ts
│   │
│   └── main.ts                      # entry point ประกอบทุกโมดูลเข้าด้วยกัน (docs-architecture ดูแล)
│
├── 02-Tests/                        # [testing-qa ดูแล config รวม, เจ้าของฟีเจอร์เขียนเทสของตัวเอง]
│   ├── core-engine/
│   │   ├── collision.test.ts
│   │   ├── movement.test.ts
│   │   ├── line-clear.test.ts
│   │   └── randomizer.test.ts
│   ├── game-state-loop/
│   │   ├── score.test.ts
│   │   └── level.test.ts
│   ├── persistence/
│   │   └── save-load.test.ts
│   └── integration/
│       └── full-game-flow.test.ts   # Q2: spawn→move→rotate→drop→clear→score→game over
│
├── 03-Documentation/                # [docs-architecture — 1 คน]
│   ├── README.md                    # (เนื้อหาเดียวกับ root README.md หรือ symlink)
│   ├── class-diagram.md             # หรือ .png/.drawio
│   └── decision-log.md
│
├── 04-Demo/                         # [testing-qa ดูแล]
│   └── demo-instructions.md
│
├── save-data.json                   # ตัวอย่างไฟล์ save จริง (จาก P1)
├── package.json
├── tsconfig.json                    # ต้องเปิด noUncheckedIndexedAccess: true
├── bunfig.toml
└── README.md                        # ต้องมีครบ 7 หัวข้อตาม tetris.md (D2)

- Architecture

Keyboard Input
      |
      |
      |
      ˅
Game State Loop
      |
      |
      |
      ˅
Tetris Engine 
      │ 
      ├── Movement 
      ├── Collision 
      ├── Rotation 
      ├── Line Clear 
      └── Randomizer
      |
      |
      ˅
Game State / Snapshot
      |
      |
      ˅
Console Renderer

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
bun run dev

## How to test

bun test

## Known Limitations

- เกมสามารถเล่นได้ผ่าน Console / Terminal เท่านั้น
- รองรับเฉพาะ Single Player
- ยังไม่มี Online Leaderboard
- การแสดงผลและ Keyboard Input อาจแตกต่างกันตาม Terminal ที่ใช้งาน


```