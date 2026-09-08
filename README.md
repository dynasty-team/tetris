# tetris

```
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
```