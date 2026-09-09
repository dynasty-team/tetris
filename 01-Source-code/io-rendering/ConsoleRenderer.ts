// ⚠️ TODO: type นี้เป็น DRAFT ที่เขียนเองชั่วคราว เพราะ core-engine ยังไม่ merge (รอ M2)
// ต้องเช็คกับเพื่อนที่ทำ core-engine ว่า field/ชื่อ/ลำดับตรงกับของจริงไหม
// แล้วเปลี่ยนมาเป็น `import type { ActivePiece, RenderSnapshot } from "../core-engine/types"` แทน
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
// ฟังก์ชันนี้ pure function ล้วนๆ ไม่ผูกกับทีมอื่น เสร็จสมบูรณ์แล้ว ✅
function cloneBoard(board: number[][]): number[][] {
    return board.map(row => [...row]);
}

// เอา activePiece วางทับลงบน board (เฉพาะ copy) ตามตำแหน่ง position
// คืนค่า board ใหม่ที่มีทั้งบล็อกที่ล็อกแล้ว + piece ที่กำลังตกอยู่ รวมกันเป็นภาพเดียว
// ⚠️ ต้องเช็คกับเพื่อนว่า piece.shape เป็น 4x4 array ของ 0/1 จริงตามที่ draft ไว้ไหม
function lockPiece(
    board: number[][],
    piece: ActivePiece,
    marker: number
): number[][] {
    for (let row = 0; row < piece.shape.length; row++)
        for (let col = 0; col < piece.shape[row].length; col++)
            if (piece.shape[row][col] === 1) {
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
    return board;
}

// แปลงค่า cell เดี่ยวๆ (ตัวเลข) เป็นสัญลักษณ์ที่จะ print ออกจอ
// ⚠️ EMPTY_CELL = 0 เป็นค่าที่เดาไว้ ต้องยืนยันกับเพื่อนว่า board เก็บ empty cell เป็น 0 จริงไหม
function renderCellSymbol(cellValue: number): string {
    const EMPTY_CELL = 0;
    if (cellValue === EMPTY_CELL) {
        return ".";
    } else {
        return "#";
    }
}

// ฟังก์ชันหลัก: รวมทุกอย่างข้างบน แล้ว print ผลลัพธ์ทั้งหมดออก console
// เสร็จสมบูรณ์ตาม requirement หลักแล้ว ✅ (ยังไม่มีเส้นขอบ/nextPiece — เป็น polish รอบหน้า)
export function render(snapshot: RenderSnapshot) {
    const { board, activePiece, score, level, status } = snapshot;

    const OCCUPIED_MARKER = 1;
    const displayBoard = lockPiece(
        cloneBoard(board),
        activePiece,
        OCCUPIED_MARKER
    );

    console.clear();

    for (const row of displayBoard) {
        const line = row.map(cell => renderCellSymbol(cell)).join("");
        console.log(line);
    }

    console.log(`Score: ${score}`);
    console.log(`Level: ${level}`);

    if (status === "gameover") {
        console.log("=== GAME OVER ===");
    }
  } 
}