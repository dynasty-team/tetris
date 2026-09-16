import type { ActivePiece, RenderSnapshot, Board, GameStatus, CellValue, TetrominoType } from "../shared/types"
import { loadGame } from "../persistence";

// =========================================================================
// CONSTANTS — ค่าคงที่ที่ใช้ร่วมกันทั้งไฟล์
// =========================================================================

const BOARD_WIDTH = 10;   // ความกว้างของ board ตาม requirement (10 คอลัมน์)
const BOARD_HEIGHT = 20;  // ความสูงของ board ตาม requirement (20 แถว)

const EMPTY_CELL: CellValue = 0; // ค่าที่แปลว่า "ช่องว่าง"


// เช็คว่าตำแหน่ง (x, y) ยังอยู่ในขอบเขตของ board ไหม
function isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
}

// คัดลอก board ทั้งก้อนออกมาใหม่ (deep copy)
// เหตุผล: ป้องกันไม่ให้การวาด piece ทับ ไปแก้ข้อมูล board จริงที่ core-engine ถืออยู่
function cloneBoard(board: Board): Board {
    return board.map(row => [...row]); // copy ทีละแถว กัน reference ชนกัน
}

// เอา activePiece ไปวางทับลงบน board (ที่ copy มาแล้วเท่านั้น) ตามตำแหน่ง position
// วิธีทำ: วน shape ของ piece ทีละช่อง (แถว x คอลัมน์) ถ้าช่องไหนเป็น 1 (มีบล็อก)
//        ให้คำนวณตำแหน่งจริงบน board แล้วใส่ marker ลงไป (ถ้ายังอยู่ในขอบเขต)
function lockPiece(
    board: Board,
    piece: ActivePiece,
    marker: CellValue
): Board {
    for (let row = 0; row < piece.shape.length; row++) {
        const shapeRow = piece.shape[row];
        if (!shapeRow) continue; // กัน error ถ้า TypeScript มองว่าแถวนี้อาจไม่มีค่า

        for (let col = 0; col < shapeRow.length; col++) {
            if (shapeRow[col] === 1) {
                // แปลงตำแหน่งใน shape (row, col) ให้เป็นตำแหน่งจริงบน board
                const boardY = piece.position.y + row;
                const boardX = piece.position.x + col;

                // วางค่าลงไปเฉพาะตำแหน่งที่ยังอยู่ในขอบเขต board เท่านั้น
                const targetRow = board[boardY];
                if (isInBounds(boardX, boardY) && targetRow) {
                    targetRow[boardX] = marker;
                }
            }
        }
    }
    return board;
}

// แปลงค่า cell เดี่ยวๆ (ตัวเลขหรือตัวอักษร) ให้เป็นตัวอักษรที่จะ print ออกจอ
// EMPTY_CELL -> "." (ช่องว่าง), ค่าอื่น -> "#" (มีบล็อก)
function renderCellSymbol(cellValue: CellValue): string {
    if (cellValue === EMPTY_CELL) {
        return ".";
    } else {
        return "#";
    }
}

// สร้างเส้นขอบแนวนอน เช่น "+----------+" ความยาวตาม width ที่กำหนด
// ใช้ทั้งตอนวาดเส้นบนสุดและล่างสุดของ board
function buildBorderLine(width: number): string {
    return "+" + "-".repeat(width) + "+";
}

// วาด board ทั้งกระดานลง console พร้อมเส้นขอบรอบด้าน (บน/ล่าง/ซ้าย/ขวา)
// ขั้นตอน: print เส้นขอบบน -> วนแต่ละแถว แปลง cell เป็นสัญลักษณ์แล้วต่อ "|" ครอบซ้าย-ขวา -> print เส้นขอบล่าง
function renderBoardWithBorder(board: Board): void {
    console.log(buildBorderLine(BOARD_WIDTH));
    for (const row of board) {
        const line = "|" + row.map(cell => renderCellSymbol(cell)).join("") + "|";
        console.log(line);
    }
    console.log(buildBorderLine(BOARD_WIDTH));
}

// แสดงชื่อของ piece ตัวถัดไปที่จะตกลงมา (เช่น "Next: I")
function renderNextPiece(nextPiece: TetrominoType): void {
    console.log(`Next: ${nextPiece}`);
}

function renderControls(): void {
    console.log("Controls:");
    console.log("  A / Left arrow   Move left");
    console.log("  D / Right arrow  Move right");
    console.log("  S / Down arrow   Soft drop");
    console.log("  W / Up arrow     Rotate");
    console.log("  Space            Hard drop");
    console.log("  P                Pause / Resume");
    console.log("  Q                Quit");
}


// =========================================================================
// MAIN FUNCTION — จุดเดียวที่ export ออกไปให้ index.ts เรียกใช้
// =========================================================================

// รับ snapshot สถานะเกม ณ ขณะนั้นมาวาดผลลัพธ์ทั้งหมดลง console ในครั้งเดียว
export function render(snapshot: RenderSnapshot): void {
    // ดึงข้อมูลที่ต้องใช้ออกมาจาก snapshot
    const { board, activePiece, nextPiece, score, level, status } = snapshot;

    // สร้าง board สำหรับแสดงผล = copy board จริง + วาง piece ปัจจุบันทับลงไป
    // (ไม่แก้ board จริงเพราะ piece ที่กำลังตกยังไม่ถือว่า "ล็อก" ติดถาวร)
    const displayBoard = lockPiece(
        cloneBoard(board),
        activePiece,
        activePiece.type
    );

    // ล้างจอเก่าก่อน เพื่อให้ทุกครั้งที่ state เปลี่ยน วาดจอใหม่สะอาด ไม่ scroll รก
    console.clear();

    // วาด board พร้อมเส้นขอบ
    renderBoardWithBorder(displayBoard);
    const savedData = loadGame();
    const highScore = savedData?.highScore ?? 0;
    
    // แสดงข้อมูลเสริม: piece ถัดไป, คะแนน, เลเวล
    renderNextPiece(nextPiece);
    console.log(`High score: ${highScore}`);
    console.log(`Score: ${score}`);
    console.log(`Level: ${level}`);
    renderControls();

    // แสดงข้อความพิเศษตามสถานะเกม (ถ้ามี)
    if (status === "paused") {
        console.log("=== PAUSED ===");
    } else if (status === "gameover") {
        console.log("=== GAME OVER ===");
    }
}
