import type { ActivePiece, Board, CellValue, RenderSnapshot, TetrominoType } from "../shared/types";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// เช็คว่าตำแหน่ง (x, y) ยังอยู่ในขอบเขตของ board ไหม
function isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
}

// คัดลอก board ออกมาใหม่ทั้งก้อน (Board เป็น array ตรงๆ ไม่มี wrapper)
function cloneBoard(board: Board): Board {
    return board.map(row => [...row]);
}

// เอา activePiece วางทับลงบน board (เฉพาะ copy) ตามตำแหน่ง position
// marker ตอนนี้ต้องเป็นชื่อ piece (TetrominoType) ไม่ใช่เลข 1 แล้ว
function lockPiece(
    board: Board,
    piece: ActivePiece,
    marker: TetrominoType
): Board {
    for (let row = 0; row < piece.shape.length; row++) {
        const shapeRow = piece.shape[row];
        if (!shapeRow) continue;

        for (let col = 0; col < shapeRow.length; col++) {
            if (shapeRow[col] === 1) {
                const boardY = piece.position.y + row;
                const boardX = piece.position.x + col;

                if (isInBounds(boardX, boardY) && board[boardY]) {
                    board[boardY][boardX] = marker;
                }
            }
        }
    }
    return board;
}

// แปลงค่า cell (0 หรือชื่อ piece) เป็นสัญลักษณ์ที่จะ print ออกจอ
function renderCellSymbol(cellValue: CellValue): string {
    if (cellValue === 0) {
        return ".";
    } else {
        return "#"; // ตอนนี้ cellValue คือชื่อ piece เช่น 'T' — จะใช้ทำสีแยกตาม piece ได้ในอนาคต (ตามที่คุยเรื่อง ANSI color ไว้)
    }
}

function buildBorderLine(width: number): string {
    return "+" + "-".repeat(width) + "+";
}

function renderBoardWithBorder(board: Board): void {
    console.log(buildBorderLine(BOARD_WIDTH));
    for (const row of board) {
        const line = "|" + row.map(cell => renderCellSymbol(cell)).join("") + "|";
        console.log(line);
    }
    console.log(buildBorderLine(BOARD_WIDTH));
}

function renderNextPiece(nextPiece: TetrominoType): void {
    console.log(`Next: ${nextPiece}`);
}

export function render(snapshot: RenderSnapshot): void {
    const { board, activePiece, nextPiece, score, level, status } = snapshot;

    const displayBoard = lockPiece(
        cloneBoard(board),
        activePiece,
        activePiece.type // ⭐ ใช้ชื่อ piece จริงแทน marker ตัวเลขคงที่
    );

    console.clear();
    renderBoardWithBorder(displayBoard);
    renderNextPiece(nextPiece);
    console.log(`Score: ${score}`);
    console.log(`Level: ${level}`);

    if (status === "paused") {
        console.log("=== PAUSED ===");
    } else if (status === "gameover") {
        console.log("=== GAME OVER ===");
    }
}



// ⚠️ ชั่วคราว — สำหรับทดสอบเฉยๆ ลบก่อน commit จริง

// สร้าง board เปล่า 10x20 (Board = CellValue[][] ตรงๆ ไม่มี wrapper)
const mockBoard: Board = Array.from({ length: 20 }, () =>
    Array(10).fill(0) as CellValue[]
);
mockBoard[19] = ["T", "T", "T", "T", "T", "T", "T", "T", 0, 0]; // แถวล่างมีบล็อกล็อกแล้ว (ใช้ชื่อ piece แทนเลข 1)

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

render(mockSnapshot);