import type { ActivePiece, Board, CellValue, RenderSnapshot, TetrominoType } from "../shared/types";
import { BOARD_WIDTH, BOARD_HEIGHT } from '../shared/constants'

import { isInBounds } from "../shared/board-utils";


function cloneBoard(board: Board): Board {
    return board.map(row => [...row]);
}

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

export function render(snapshot: RenderSnapshot): void {
    const { board, activePiece, nextPiece, score, level, status } = snapshot;

    const displayBoard = lockPiece(
        cloneBoard(board),
        activePiece,
        activePiece.type 
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

