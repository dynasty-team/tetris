## Architecture

```text

tetris/
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
│   │   ├── ConsoleRenderer.ts
│   │   ├── KeyboardInput.ts
│   │   └── index.ts
│   │
│   ├── persistence/
│   │   ├── SaveManager.ts
│   │   ├── index.ts
│   │   └── schema.ts
│   │
│   └── shared/
│       ├── board-utils.ts
│       ├── constants.ts
│       ├── types.ts
│       └── utils.ts
│
├── 02-Tests/
│   ├── core-engine/
│   ├── game-state-loop/
│   ├── io-rendering/
│   ├── persistence/
│   ├── shared/
│   └── sample.test.ts
│
├── 03-Documentation/
│   ├── classdiagram.md
│   └── decision-log.md
│
├── 04-Demo/
│   ├── .gitkeep
│   └── tetris-demo.mp4
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

#### Persistence Layer (Save System)
- `save-data.json` / `save-data.example.json`: จัดเก็บข้อมูลสถิติคะแนนสูงสุดตลอดกาล (High Score Record) ตาม `SaveData` schema
- เก็บเฉพาะ `highScore` และ `version`; ไม่เก็บสถานะรอบเกมและไม่รองรับการ resume จากไฟล์นี้

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
