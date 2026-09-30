## Game Overview
Tetris เป็นเกมแนว Puzzle เรียงชิ้นส่วนบล็อกรูปทรงต่างๆ (Tetromino)แบบผู้เล่นคนเดียว 
ขนาด 10 × 20 ช่อง ภายในเกมมี ชิ้นส่วนบล็อกรูปทรง(Tetromino) ทั้งหมด 7 รูป ex. I, O, T, S, Z, J และ L 
ผู้เล่นสามารถขยับ เลื่อนซ้าย/ขวา หมุนเปลี่ยนทิศทางและเร่งการตกของชิ้นส่วนบล็อกให้ตกลงเพื่อให้เข้ากับช่องว่าง  
เมื่อสามารถเติมแถวได้ครบ แถวนั้นจะถูกลบออกและผู้เล่นจะได้รับคะแนน
เกมมีระบบ Score, Level และความเร็วในการตกที่เพิ่มขึ้นตาม Level โดยเกมจะจบเมื่อไม่สามารถสร้าง Tetromino ชิ้นใหม่ลงบน Board ได้
โปรเจกต์นี้พัฒนาเป็น Console Game โดยแบ่งส่วนการทำงานออกเป็น Game Logic, Input, Rendering และ Save System เพื่อให้แต่ละส่วนสามารถพัฒนาและทดสอบได้ง่ายขึ้น
## Features

- Board ขนาด 10 × 20
- รองรับ Tetromino ทั้ง 7 รูปแบบ: I, O, T, S, Z, J และ L
- Movement และ Rotation พร้อมระบบ Collision Detection (การตรวจสอบการชน) และ Wall Kick  (ระบบช่วยตอนหมุน Tetromino ตอนติดขอบหรือบล็อก)
- Soft Drop และ Hard Drop
- ระบบ Line Clearing
- ระบบ Score และ Level
- ความเร็วในการตกเพิ่มขึ้นตาม Level
- ระบบ 7-Bag Randomizer
- ระบบ Lock Delay
- Pause / Resume
- Game Over เมื่อไม่สามารถ Spawn Tetromino ชิ้นใหม่ได้
- High Score และระบบ Save / Load High Score
- แสดงผลเกมผ่าน Console / Terminal 

## Document

- [Document](./03-Documentation/)
- [Requirements](./03-Documentation/Requirements.md)
- [Game Rules](./03-Documentation/GameRules.md)
- [Architecture](./03-Documentation/Architecture.md)
- [Known Limitations](./03-Documentation/KnownLimitations.md)
- [ClassDiagram](./03-Documentation/classdiagram.md)
- [decision-log](./03-Documentation/decision-log.md)
- [CodeMap](./03-Documentation/CodeMap.md)
- [Demo](./04-Demo/demo.md)



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

