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

- Game Over เมื่อพื้นที่ด้านบนเต็มจนชิ้นส่วนบล็อก(Tetromino)ชิ้นใหม่ไม่สามารถ Spawn ลงมาได้ 