# Demo Instructions — Tetris (1 Player)

คู่มือนี้ใช้สำหรับเตรียมและดำเนินการ Demo/Presentation ของโปรเจกต์ Tetris
ให้ครอบคลุมฟีเจอร์ทั้งหมดตามที่กำหนดไว้ใน requirement โดยไม่ให้เกิด runtime error สด

## Table of Contents

- [Demo Instructions — Tetris (1 Player)](#demo-instructions--tetris-1-player)
  - [Table of Contents](#table-of-contents)
  - [1. Setup ก่อน Demo](#1-setup-ก่อน-demo)
  - [2. ลำดับการ Demo (Script)](#2-ลำดับการ-demo-script)
  - [3. ปุ่มควบคุมที่ใช้](#3-ปุ่มควบคุมที่ใช้)
  - [4. Sample Save Data](#4-sample-save-data)
  - [5. ภาพ/วิดีโอประกอบการ Demo](#5-ภาพวิดีโอประกอบการ-demo)
  - [6. Known Issues ที่ควรเลี่ยงตอน Demo สด](#6-known-issues-ที่ควรเลี่ยงตอน-demo-สด)
  - [7. Backup Plan](#7-backup-plan)

---

## 1. Setup ก่อน Demo

```bash
bun install
bun run start
```

> 👉 **[ต้องใส่ข้อมูล]** ถ้ามีขั้นตอนเพิ่มเติมก่อนรัน (เช่น terminal ที่แนะนำให้ใช้, ขนาดหน้าจอ/font ที่ทำให้ TUI แสดงผลสวยที่สุด) ใส่ตรงนี้เพิ่ม

## 2. ลำดับการ Demo (Script)

ลำดับที่แนะนำ เพื่อให้โชว์ครบทุก requirement หลักภายในเวลาสั้นที่สุด:

1. เปิดเกม → โชว์หน้า Board เปล่า (10×20) และ Tetromino ชิ้นแรก spawn
2. Move Left / Move Right — โชว์ collision detection ที่ขอบกระดาน
3. Rotate — โชว์การหมุนและ wall kick (ถ้ามี)
4. Soft Drop — โชว์ตกเร็วขึ้นแบบควบคุมได้
5. Hard Drop — โชว์ตกทันที
6. เคลียร์ 1 แถว → โชว์ Score เพิ่ม
7. เคลียร์ 4 แถว (Tetris) → โชว์ Score เพิ่มแบบพิเศษ + ผลคูณตาม Level
8. เล่นต่อจน Level เพิ่ม → โชว์ความเร็วที่เพิ่มขึ้นตาม Level
9. Quit (Q) → โชว์ว่าออกจากเกมได้สะอาด ไม่ error
10. เปิดเกมใหม่ → โหลด save data เดิม โชว์ High Score ที่บันทึกไว้
11. เล่นต่อจน Game Over → โชว์เงื่อนไข Game Over (spawn ไม่ได้)

> 👉 **[ต้องใส่ข้อมูล]** ถ้าทีมต้องการเรียงลำดับหรือปรับ timing ต่างจากนี้ (เช่น ตัดบางขั้นตอนเพราะเวลานำเสนอจำกัด) แก้ไข/เว้นว่างส่วนนี้ไว้ให้คนพรีเซนต์กรอกลำดับจริงที่จะใช้

## 3. ปุ่มควบคุมที่ใช้

| ปุ่ม | การทำงาน |
|---|---|
| A / ← | Move Left |
| D / → | Move Right |
| S / ↓ | Soft Drop |
| W / ↑ | Rotate |
| Space | Hard Drop |
| P | Pause |
| Q | Quit |

## 4. Sample Save Data

ใช้ไฟล์ `save-data.example.json` ที่ root ของโปรเจกต์เป็นตัวอย่างสำหรับโชว์ระบบ Persistence
(รายละเอียด schema ดูใน `01-Source-code/persistence/schema.ts`)

> 👉 **[ต้องใส่ข้อมูล]** ถ้าต้องการเตรียมไฟล์ save เฉพาะสำหรับ demo (เช่น high score ที่ดูน่าประทับใจ) ให้แนบ path ของไฟล์นั้นตรงนี้

## 5. ภาพ/วิดีโอประกอบการ Demo

> 👉 **[ต้องใส่ GIF/ภาพ/วิดีโอ]** — เว้นว่างไว้ให้ใส่ภายหลัง:

- GIF: หน้าจอเกมตอนเล่นปกติ (move/rotate/drop)
  <!-- ใส่ GIF ตรงนี้ -->

- GIF: ตอนเคลียร์ 4 แถว (Tetris)
  <!-- ใส่ GIF ตรงนี้ -->

- GIF/Screenshot: หน้าจอ Game Over
  <!-- ใส่ GIF ตรงนี้ -->

- Screenshot: ตัวอย่าง `save-data.json` หลังเกมจบ
  <!-- ใส่ภาพตรงนี้ -->

## 6. Known Issues ที่ควรเลี่ยงตอน Demo สด

> 👉 **[ต้องใส่ข้อมูล]** — ให้แต่ละทีมย่อยแจ้ง bug/edge case ที่รู้อยู่แล้วว่ายัง trigger ได้ เพื่อกันคนพรีเซนต์กดพลาดไปโดนสด ๆ:

-
-

## 7. Backup Plan

> 👉 **[ต้องใส่ข้อมูล]** — วิดีโอ/GIF สำรอง เผื่อ live demo มีปัญหาหน้างาน (เครื่อง, terminal, ไฟล์ save):

- ลิงก์วิดีโอสำรอง: