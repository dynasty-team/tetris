# tetris


## Game Overview
Tetris เป็นเกมแนว Puzzle เรียงชิ้นส่วนบล็อกรูปทรงต่างๆ (Tetromino)แบบผู้เล่นคนเดียว 
ขนาด 10 × 20 ช่อง ภายในเกมมี ชิ้นส่วนบล็อกรูปทรง(Tetromino) ทั้งหมด 7 รูป ex. I, O, T, S, Z, J และ L 
ผู้เล่นสามารถขยับ เลื่อนซ้าย/ขวา หมุนเปลี่ยนทิศทางและเร่งการตกของชิ้นส่วนบล็อกให้ตกลงเพื่อให้เข้ากับช่องว่าง  
เมื่อสามารถเติมแถวได้ครบ แถวนั้นจะถูกลบออกและผู้เล่นจะได้รับคะแนน
เกมมีระบบ Score, Level และความเร็วในการตกที่เพิ่มขึ้นตาม Level โดยเกมจะจบเมื่อไม่สามารถสร้าง Tetromino ชิ้นใหม่ลงบน Board ได้
โปรเจกต์นี้พัฒนาเป็น Console Game โดยแบ่งส่วนการทำงานออกเป็น Game Logic, Input, Rendering และ Save System เพื่อให้แต่ละส่วนสามารถพัฒนาและทดสอบได้ง่ายขึ้น

## Requirements 

- Board ขนาด 10 × 20 รองรับ ช่องว่าง ยังไม่มีชิ้นส่วนบล็อก(Empty Cell) และ ช่องที่มีชิ้นส่วนบล็อกอยู่แล้ว(Occupied Cell)

- รองรับ ชิ้นส่วนบล็อก(Tetromino) ทั้ง 7 รูปแบบ
  I, O, T, S, Z, J, L

- แต่ละ Piece ต้องรองรับ
  - Position
  - Rotation
  - Movement
  - Collision Detection

- รองรับ Keyboard Control
  - A / ← : Move Left
  - D / → : Move Right
  - S / ↓ : Soft Drop
  - W / ↑ : Rotate
  - Space : Hard Drop
  - P : Pause
  - Q : Quit
  
- ระบบเกมต้องมี
  - Score
  - Level
  - Increasing Speed
  - wall kick 
  - ใช้ระบบ 7-bag Randomizer


- Game Over เมื่อ ชิ้นส่วนบล็อก(Tetromino) ชิ้นใหม่ไม่สามารถ Spawn ได้
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
เกมจะจบลงเมื่อ ชิ้นส่วนบล็อก(Tetromino) สูงขึ้นจนชนขอบด้านบนและไม่มีที่ว่างให้ชิ้นส่วนบล็อกใหม่ spawn ลงมาถือว่าเกม over ทันที  
## Architecture

### Project Structure

```text

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
│       ├── classdiagram.md
|       └── decision-log.md
|
├── 04-Demo/
├── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

### System Flow

```text
KeyboardInput
(implements InputSource)
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
```
### OOP & FP Implementation

| หัวข้อ | ไฟล์ | ใช้ทำอะไร |
|---|---|---|
| OOP: Interface | `shared/types.ts` | กำหนด `CoreEngine` และ `InputSource` เป็น contract กลางระหว่างแต่ละส่วนของระบบ |
| OOP: Class implements Interface | `core-engine/TetrisEngine.ts` | ใช้คลาส `TetrisEngine` เป็นตัวทำงานหลักของเกม |
| FP: Pure Function | `core-engine/line-clear.ts` | ใช้ตรวจและลบแถวที่เต็ม โดยไม่แก้ข้อมูลเดิมโดยตรง |
| FP: Higher-order Function | `shared/utils.ts` | ใช้ฟังก์ชันที่รับฟังก์ชันอื่นเข้ามาทำงานร่วมกัน |
| FP: Dependency Injection | `core-engine/randomizer.ts` | ส่งฟังก์ชันสำหรับสุ่มเข้ามาจากภายนอก เพื่อให้เปลี่ยนและทดสอบได้ง่าย |
### Testing

โปรเจกต์มี Unit Test สำหรับตรวจสอบการทำงานหลักของเกม เช่น

- `collision.test.ts` — ทดสอบ Collision Detection
- `movement.test.ts` — ทดสอบ Movement และ Rotation
- `line-clear.test.ts` — ทดสอบการเคลียร์แถว
- `randomizer.test.ts` — ทดสอบระบบ 7-Bag Randomizer
- `wall-kick.test.ts` — ทดสอบ Wall Kick
- `spawn.test.ts` — ทดสอบการ Spawn Tetromino
- `save-load.test.ts` — ทดสอบระบบ Save / Load

## How to Run

1. Install Bun

Windows (PowerShell)

```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

macOS / Linux

```bash
curl -fsSL https://bun.sh/install | bash
```

Check Bun version

```bash
bun --version
```

2. Install Packages

```bash
bun install
```

3. Run

```bash
bun run start
```

## How to Test

```bash
bun test
```
## Known Limitations

- เกมสามารถเล่นได้ผ่าน Console / Terminal เท่านั้น
- รองรับเฉพาะ Single Player
- ยังไม่มี Online Leaderboard
- การแสดงผลและ Keyboard Input อาจจะแตกต่างกันตาม Terminal ที่ใช้งาน
- การเซฟเกมเก็บแค่สถิติ high score ไม่ได้เก็บสถานะ กระดาน ผู้เล่นไม่สามารถเล่นต่อจากเกมที่ค้างไว้ได้ 
- ยังไม่มี hold piece และ ghost piece แสดงตำแหน่งที่จะตก



