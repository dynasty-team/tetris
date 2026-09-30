# Code Map

เอกสารนี้อธิบายตำแหน่งของโค้ดส่วนสำคัญในโปรเจกต์ เพื่อช่วยให้สามารถค้นหาและแก้ไขระบบแต่ละส่วนได้ง่ายขึ้น

## Core Engine

| ต้องการแก้ไข | ไฟล์ | หน้าที่ |
|---|---|---|
| ระบบหลักของเกม | `01-Source-code/core-engine/TetrisEngine.ts` | จัดการสถานะและการทำงานหลักของเกม |
| การเคลื่อนที่ของ Tetromino | `01-Source-code/core-engine/movement.ts` | จัดการ Move Left/Right, Soft Drop, Hard Drop และการเคลื่อนที่ |
| การตรวจสอบการชน | `01-Source-code/core-engine/collision.ts` | ตรวจสอบการชนกับขอบ Board และบล็อกอื่น |
| การเคลียร์แถว | `01-Source-code/core-engine/line-clear.ts` | ตรวจสอบและลบแถวที่เต็ม |
| การ Lock Tetromino | `01-Source-code/core-engine/lock-pipeline.ts` | จัดการขั้นตอนการ Lock ชิ้นส่วนลงบน Board |
| รูปร่าง Tetromino | `01-Source-code/core-engine/tetromino-shapes.ts` | กำหนดรูปแบบของ Tetromino ทั้ง 7 แบบ |
| Wall Kick | `01-Source-code/core-engine/wall-kick-data.ts` | กำหนดข้อมูลที่ใช้สำหรับระบบ Wall Kick |
| การสุ่ม Tetromino | `01-Source-code/core-engine/randomizer.ts` | จัดการระบบ 7-Bag Randomizer |

## Game State & Loop

| ต้องการแก้ไข | ไฟล์ | หน้าที่ |
|---|---|---|
| Game Loop | `01-Source-code/game-state-loop/GameStateLoop.ts` | ควบคุมลำดับการทำงานของเกมและเชื่อมระบบต่าง ๆ |
| Level และความเร็ว | `01-Source-code/game-state-loop/level.ts` | จัดการ Level และความเร็วในการตกของ Tetromino |
| การคำนวณคะแนน | `01-Source-code/game-state-loop/score.ts` | จัดการการคำนวณ Score |

## Input & Rendering

| ต้องการแก้ไข | ไฟล์ | หน้าที่ |
|---|---|---|
| Keyboard Control | `01-Source-code/io-rendering/KeyboardInput.ts` | รับคำสั่งจาก Keyboard และแปลงเป็น Game Action |
| หน้าจอเกม | `01-Source-code/io-rendering/ConsoleRenderer.tsx` | แสดง Board, Score, Level, Next Piece และข้อมูลเกมผ่าน Terminal |
| Layout ของหน้าจอ | `01-Source-code/io-rendering/layout.ts` | จัดการขนาดและ Layout สำหรับการแสดงผลใน Terminal |

## Persistence

| ต้องการแก้ไข | ไฟล์ | หน้าที่ |
|---|---|---|
| การบันทึกและโหลด High Score | `01-Source-code/persistence/SaveManager.ts` | อ่านและเขียนข้อมูล High Score |
| รูปแบบข้อมูล Save | `01-Source-code/persistence/schema.ts` | ตรวจสอบโครงสร้างของ Save Data |

## Shared

| ต้องการแก้ไข | ไฟล์ | หน้าที่ |
|---|---|---|
| Type และ Interface กลาง | `01-Source-code/shared/types.ts` | กำหนด Type และ Interface ที่ใช้ร่วมกันในระบบ |
| Board Utilities | `01-Source-code/shared/board-utils.ts` | ฟังก์ชันช่วยเหลือที่เกี่ยวข้องกับ Board |
| Constants | `01-Source-code/shared/constants.ts` | เก็บค่าคงที่ที่ใช้ในเกม |
| Utilities | `01-Source-code/shared/utils.ts` | ฟังก์ชันช่วยเหลือทั่วไป |

## Tests

Test ของแต่ละระบบอยู่ใน `02-Tests/` และแบ่งโครงสร้างตามส่วนของ Source Code เพื่อให้สามารถค้นหา Test ของระบบที่ต้องการแก้ไขได้ง่าย