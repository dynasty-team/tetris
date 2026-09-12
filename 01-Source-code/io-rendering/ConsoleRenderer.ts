//  DRAFT ที่เขียนเองชั่วคราว เพราะ core-engine ยังไม่ merge (รอ M2)
// รอเช็คกับเพื่อนที่ทำ core-engine ว่า field/ชื่อ/ลำดับตรงกับของจริงไหม
// แล้วค่อยเปลี่ยนมาเป็น `import type { ActivePiece, RenderSnapshot } from "../core-engine/types"` แทน
type ActivePiece = {
    type: string;
    position: { x: number; y: number };
    rotation: number;
    shape: number[][];
};

type RenderSnapshot = {
    board: number[][];
    activePiece: ActivePiece;
    nextPiece: string;
    score: number;
    level: number;
    linesClearedTotal: number;
    status: 'playing' | 'gameover';
    isLocking: boolean;
};

// คัดลอก board ออกมาใหม่ทั้งก้อน เพื่อไม่ให้กระทบ board จริงตอนเอา piece มาวางทับ
function cloneBoard(board: number[][]): number[][] {
    return board.map(row => [...row]);
}

// เอา activePiece วางทับลงบน board (เฉพาะ copy) ตามตำแหน่ง position
function lockPiece(
    board: number[][],
    piece: ActivePiece,
    marker: number
): number[][] {
    for (let row = 0; row < piece.shape.length; row++) {
        const shapeRow = piece.shape[row];
        if (!shapeRow) continue;

        for (let col = 0; col < shapeRow.length; col++) {
            if (shapeRow[col] === 1) {
                const boardY = piece.position.y + row;
                const boardX = piece.position.x + col;
                const boardWidth = board[0]?.length ?? 0;

                const inBoard =
                    boardY >= 0 &&
                    boardY < board.length &&
                    boardX >= 0 &&
                    boardX < boardWidth;

                if (inBoard && board[boardY]) {
                    board[boardY][boardX] = marker;
                }
            }
        }
    }
    return board;
}

// แปลงค่า cell เดี่ยวๆ (ตัวเลข) เป็นสัญลักษณ์ที่จะ print ออกจอ
function renderCellSymbol(cellValue: number): string {
    const EMPTY_CELL = 0;
    if (cellValue === EMPTY_CELL) {
        return ".";
    } else {
        return "#";
    }
}

//  สร้างเส้นขอบบน/ล่าง เช่น +----------+
function buildBorderLine(width: number): string {
    return "+" + "-".repeat(width) + "+";
}

// วาด board พร้อมเส้นขอบซ้าย-ขวา-บน-ล่าง
function renderBoardWithBorder(displayBoard: number[][]): void {
    const width = displayBoard[0]?.length ?? 0;
    console.log(buildBorderLine(width));
    for (const row of displayBoard) {
        const line = "|" + row.map(cell => renderCellSymbol(cell)).join("") + "|";
        console.log(line);
    }
    console.log(buildBorderLine(width));
}

// แสดงชื่อ piece ถัดไปที่จะตกลงมา
function renderNextPiece(nextPiece: string): void {
    console.log(`Next: ${nextPiece}`);
}

// ฟังก์ชันหลัก: รวมทุกอย่างข้างบน แล้ว print ผลลัพธ์ทั้งหมดออก console
export function render(snapshot: RenderSnapshot) {
    const { board, activePiece, nextPiece, score, level, status } = snapshot; // 

    const OCCUPIED_MARKER = 1;
    const displayBoard = lockPiece(
        cloneBoard(board),
        activePiece,
        OCCUPIED_MARKER
    );

    console.clear();

    renderBoardWithBorder(displayBoard); 

    renderNextPiece(nextPiece);          
    console.log(`Score: ${score}`);
    console.log(`Level: ${level}`);

    if (status === "gameover") {
        console.log("=== GAME OVER ===");
    }
}

