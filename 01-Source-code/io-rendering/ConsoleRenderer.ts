// TYPES — DRAFT ที่เขียนเองชั่วคราว เพราะ core-engine ยังไม่ merge (รอ M2)
// รอ core-engine ว่า field/ชื่อ/ลำดับตรงกับของจริงไหม
// แล้วค่อยเปลี่ยนมาเป็น `import type { ActivePiece, RenderSnapshot, Board, GameStatus } from "../core-engine/types"` แทน

// ชนิดของ Tetromino ทั้ง 7 แบบตาม requirement
type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

// ค่าที่เก็บในแต่ละ cell ของ board (ตอนนี้สมมติเป็นตัวเลข 0/1)
type CellValue = number;

// ตำแหน่ง x,y บน board
type Position = { x: number; y: number };

// ข้อมูลของ piece ที่กำลังตกอยู่ปัจจุบัน
type ActivePiece = {
    type: TetrominoType;
    position: Position;
    rotation: number; // สถานะการหมุน (RotationState) — ปรับ type ให้ตรงถ้าเพื่อนใช้ enum
    shape: number[][]; // ตาราง 0/1 บอกรูปทรงของ piece (เช่น 4x4)
};

// กระดานเกม — ห่อด้วย object ที่มี cells อยู่ข้างใน (ตามที่เห็นใน class diagram ของทีม)
type Board = {
    cells: CellValue[][];
};

// สถานะของเกม ณ ขณะนั้น (มี 3 ค่า: กำลังเล่น/พัก/จบเกม)
type GameStatus = "playing" | "paused" | "gameover";

// ข้อมูลทั้งหมดที่ ConsoleRenderer ต้องใช้ในการวาดจอ 1 ครั้ง
type RenderSnapshot = {
    board: Board;
    activePiece: ActivePiece;
    nextPiece: TetrominoType;
    score: number;
    level: number;
    linesClearedTotal: number;
    status: GameStatus;
    isLocking: boolean;
};


// =========================================================================
// CONSTANTS — ค่าคงที่ที่ใช้ร่วมกันทั้งไฟล์
// รอ import จากไฟล์ constants.ts  
// =========================================================================

const BOARD_WIDTH = 10;   // ความกว้างของ board ตาม requirement (10 คอลัมน์)
const BOARD_HEIGHT = 20;  // ความสูงของ board ตาม requirement (20 แถว)

const EMPTY_CELL = 0;         // ค่าที่แปลว่า "ช่องว่าง"
const OCCUPIED_MARKER = 1;    // ค่าที่ใช้ทำเครื่องหมายว่า "มีบล็อกอยู่" ตอนวาง piece ลง board


// เช็คว่าตำแหน่ง (x, y) ยังอยู่ในขอบเขตของ board ไหม
// ใช้แทนที่ BoardUtils.isInBounds() ของทีม (ยังไม่มีไฟล์จริงให้ import ตอนนี้)
function isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
}

// คัดลอก board ทั้งก้อนออกมาใหม่ (deep copy เฉพาะ cells)
// เหตุผล: ป้องกันไม่ให้การวาด piece ทับ ไปแก้ข้อมูล board จริงที่ core-engine ถืออยู่
function cloneBoard(board: Board): Board {
    return {
        cells: board.cells.map(row => [...row]), // copy ทีละแถว กัน reference ชนกัน
    };
}

// เอา activePiece ไปวางทับลงบน board (ที่ copy มาแล้วเท่านั้น) ตามตำแหน่ง position
// วิธีทำ: วน shape ของ piece ทีละช่อง (แถว x คอลัมน์) ถ้าช่องไหนเป็น 1 (มีบล็อก)
//        ให้คำนวณตำแหน่งจริงบน board แล้วใส่ marker ลงไป (ถ้ายังอยู่ในขอบเขต)
function lockPiece(
    board: Board,
    piece: ActivePiece,
    marker: number
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
                if (isInBounds(boardX, boardY) && board.cells[boardY]) {
                    board.cells[boardY][boardX] = marker;
                }
            }
        }
    }
    return board;
}

// แปลงค่า cell เดี่ยวๆ (ตัวเลข) ให้เป็นตัวอักษรที่จะ print ออกจอ
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
    for (const row of board.cells) {
        const line = "|" + row.map(cell => renderCellSymbol(cell)).join("") + "|";
        console.log(line);
    }
    console.log(buildBorderLine(BOARD_WIDTH));
}

// แสดงชื่อของ piece ตัวถัดไปที่จะตกลงมา (เช่น "Next: I")
function renderNextPiece(nextPiece: TetrominoType): void {
    console.log(`Next: ${nextPiece}`);
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
        OCCUPIED_MARKER
    );

    // ล้างจอเก่าก่อน เพื่อให้ทุกครั้งที่ state เปลี่ยน วาดจอใหม่สะอาด ไม่ scroll รก
    console.clear();

    // วาด board พร้อมเส้นขอบ
    renderBoardWithBorder(displayBoard);

    // แสดงข้อมูลเสริม: piece ถัดไป, คะแนน, เลเวล
    renderNextPiece(nextPiece);
    console.log(`Score: ${score}`);
    console.log(`Level: ${level}`);

    // แสดงข้อความพิเศษตามสถานะเกม (ถ้ามี)
    if (status === "paused") {
        console.log("=== PAUSED ===");
    } else if (status === "gameover") {
        console.log("=== GAME OVER ===");
    }
}

// ⚠️ ชั่วคราว — สำหรับทดสอบเฉยๆ ลบก่อน commit จริง

// สร้าง board เปล่าๆ 10x20 (ทุกช่องเป็น EMPTY = 0) ห่อด้วย { cells } ตาม type ใหม่
const emptyCells: number[][] = Array.from({ length: 20 }, () =>
    Array(10).fill(0)
);
emptyCells[19] = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0]; // ทดสอบแถวที่มีบล็อกล็อกแล้วบางส่วน

const mockBoard: Board = {
    cells: emptyCells,
};

const mockSnapshot: RenderSnapshot = {
    board: mockBoard,
    activePiece: {
        type: "T",
        position: { x: 4, y: 0 },
        rotation: 0,
        shape: [
            [0, 1, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
    },
    nextPiece: "I",
    score: 1250,
    level: 3,
    linesClearedTotal: 20,
    status: "playing",
    isLocking: false,
};

render(mockSnapshot)
const pausedSnapshot: RenderSnapshot = { ...mockSnapshot, status: "paused" };
render(pausedSnapshot);