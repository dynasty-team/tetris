<<<<<<< HEAD
import type { ActivePiece, Board, CellValue, RenderSnapshot, TetrominoType } from "../shared/types";
import { BOARD_WIDTH, BOARD_HEIGHT } from '../shared/constants'

import { isInBounds } from "../shared/board-utils";


function cloneBoard(board: Board): Board {
    return board.map(row => [...row]);
=======
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
>>>>>>> origin/main
}

function lockPiece(
    board: Board,
    piece: ActivePiece,
<<<<<<< HEAD
    marker: TetrominoType
=======
    marker: CellValue
>>>>>>> origin/main
): Board {
    for (let row = 0; row < piece.shape.length; row++) {
        const shapeRow = piece.shape[row];
        if (!shapeRow) continue;

        for (let col = 0; col < shapeRow.length; col++) {
            if (shapeRow[col] === 1) {
                const boardY = piece.position.y + row;
                const boardX = piece.position.x + col;

<<<<<<< HEAD
                if (isInBounds(boardX, boardY) && board[boardY]) {
                    board[boardY][boardX] = marker;
=======
                // วางค่าลงไปเฉพาะตำแหน่งที่ยังอยู่ในขอบเขต board เท่านั้น
                const targetRow = board[boardY];
                if (isInBounds(boardX, boardY) && targetRow) {
                    targetRow[boardX] = marker;
>>>>>>> origin/main
                }
            }
        }
    }
    return board;
}

<<<<<<< HEAD

=======
// แปลงค่า cell เดี่ยวๆ (ตัวเลขหรือตัวอักษร) ให้เป็นตัวอักษรที่จะ print ออกจอ
// EMPTY_CELL -> "." (ช่องว่าง), ค่าอื่น -> "#" (มีบล็อก)
>>>>>>> origin/main
function renderCellSymbol(cellValue: CellValue): string {
    if (cellValue === 0) {
        return ".";
    } else {
        return "#"; 
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

<<<<<<< HEAD
=======
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
>>>>>>> origin/main
export function render(snapshot: RenderSnapshot): void {
    const { board, activePiece, nextPiece, score, level, status } = snapshot;

    const displayBoard = lockPiece(
        cloneBoard(board),
        activePiece,
<<<<<<< HEAD
        activePiece.type 
=======
        activePiece.type
>>>>>>> origin/main
    );

    console.clear();
    renderBoardWithBorder(displayBoard);
<<<<<<< HEAD
=======
    const savedData = loadGame();
    const highScore = savedData?.highScore ?? 0;
    
    // แสดงข้อมูลเสริม: piece ถัดไป, คะแนน, เลเวล
>>>>>>> origin/main
    renderNextPiece(nextPiece);
    console.log(`High score: ${highScore}`);
    console.log(`Score: ${score}`);
    console.log(`Level: ${level}`);
    renderControls();

    if (status === "paused") {
        console.log("=== PAUSED ===");
    } else if (status === "gameover") {
        console.log("=== GAME OVER ===");
    }
}
<<<<<<< HEAD

=======
>>>>>>> origin/main
