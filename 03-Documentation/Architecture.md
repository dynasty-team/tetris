## Architecture

```text

tetris/
├── .github/
│   ├── CODEOWNERS
│   └── workflows/
│       └── test.yml
│
├── 01-Source-code/
│   ├── core-engine/
│   │   ├── TetrisEngine.ts
│   │   ├── collision.ts
│   │   ├── index.ts
│   │   ├── line-clear.ts
│   │   ├── lock-pipeline.ts
│   │   ├── movement.ts
│   │   ├── randomizer.ts
│   │   ├── tetromino-shapes.ts
│   │   └── wall-kick-data.ts
│   │
│   ├── game-state-loop/
│   │   ├── GameStateLoop.ts
│   │   ├── index.ts
│   │   ├── level.ts
│   │   └── score.ts
│   │
│   ├── io-rendering/
│   │   ├── ConsoleRenderer.tsx
│   │   ├── KeyboardInput.ts
│   │   ├── index.ts
│   │   └── layout.ts
│   │
│   ├── persistence/
│   │   ├── SaveManager.ts
│   │   ├── index.ts
│   │   └── schema.ts
│   │
│   └── shared/
│       ├── board-utils.ts
│       ├── constants.ts
│       ├── mock-engine.ts
│       ├── types.ts
│       └── utils.ts
│
├── 02-Tests/
│   ├── core-engine/
│   ├── game-state-loop/
│   ├── io-rendering/
│   ├── persistence/
│   └── shared/
│
├── 03-Documentation/
│   ├── img/
│   │   └── 325189358.jpg
│   ├── Architecture.md
│   ├── classdiagram.md
│   ├── CodeMap.md
│   ├── decision-log.md
│   ├── GameRules.md
│   ├── KnownLimitations.md
│   └── Requirements.md
│
├── 04-Demo/
│   ├── FileGIF-Demo/
│   │   ├── 1.gif
│   │   ├── 2.gif
│   │   ├── 3.gif
│   │   └── 4.gif
│   └── demo.md
│
├── main.ts
├── package.json
├── tsconfig.json
├── bun.lock
├── bunfig.toml
├── save-data.example.json
└── README.md
```

### System Flow

```text
KeyboardInput
(implements InputSource)
      |
      v
GameStateLoop
      |
      v
TetrisEngine
      |
      ├── Movement
      ├── Collision
      ├── Rotation / Wall Kick
      ├── Line Clear
      ├── Lock Pipeline
      └── Randomizer (7-Bag)
      |
      v
RenderSnapshot
      |
      v
ConsoleRenderer
      |
      v
Terminal

GameStateLoop
      |
      ├── Load High Score ตอนเริ่มเกม
      |
      └── Save High Score ตอน Quit / Game Over
              |
              v
          Persistence
              |
              v
        save-data.json
```

#### Persistence Layer (Save System)
- `save-data.json` / `save-data.example.json`: จัดเก็บข้อมูลสถิติคะแนนสูงสุด (High Score Record) ตาม `SaveData` schema
- เก็บเฉพาะ `highScore` และ `version`; ไม่ได้เก็บสถานะของเกมเพื่อกลับมาเล่นต่อ

### OOP & FP Implementation

| หัวข้อ | ไฟล์ | ใช้ทำอะไร |
|---|---|---|
| OOP: Interface | `shared/types.ts` | กำหนด `CoreEngine` และ `InputSource` เป็นการกำหนดรูปแบบการทำงานร่วมกันของแต่ละส่วน |
| OOP: Class implements Interface | `core-engine/TetrisEngine.ts` | ใช้คลาส `TetrisEngine` เป็นตัวทำงานหลักของเกม |
| FP: Pure Function | `core-engine/line-clear.ts` | ใช้ตรวจและลบแถวที่เต็ม โดยไม่แก้ข้อมูลเดิมโดยตรง |
| FP: Higher-order Function | `shared/utils.ts` | ใช้ฟังก์ชันที่รับฟังก์ชันอื่นเข้ามาทำงานร่วมกัน |
| FP-related: Dependency Injection | `core-engine/randomizer.ts` | ส่งฟังก์ชันสุ่มเข้ามาจากภายนอก เพื่อให้เปลี่ยนวิธีสุ่มและทดสอบได้ง่ายขึ้น |


### Testing

โปรเจกต์มี Unit Test สำหรับตรวจสอบการทำงานหลักของเกม เช่น

- `collision.test.ts` — ทดสอบ Collision Detection
- `movement.test.ts` — ทดสอบ Movement และ Rotation
- `line-clear.test.ts` — ทดสอบการเคลียร์แถว
- `randomizer.test.ts` — ทดสอบระบบ 7-Bag Randomizer
- `wall-kick.test.ts` — ทดสอบ Wall Kick
- `spawn.test.ts` — ทดสอบการ Spawn Tetromino
- `save-load.test.ts` — ทดสอบการบันทึกและอ่านข้อมูล High Score
