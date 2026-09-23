import type { ActivePiece, RenderSnapshot, Board, GameStatus, CellValue, TetrominoType } from "../shared/types.ts"
import { SpaceTetrisUI } from "./index.tsx";
import { render } from 'ink';

// รับ snapshot สถานะเกม ณ ขณะนั้นมาวาดผลลัพธ์ทั้งหมดลง console ในครั้งเดียว
export function renderXX(snapshot: RenderSnapshot): void {
    // ดึงข้อมูลที่ต้องใช้ออกมาจาก snapshot
    const { board, activePiece, nextPiece, score, level, highScore, status } = snapshot;

    render(
        <SpaceTetrisUI
            snapshot={{
                ...snapshot,
                board: snapshot.board.map(row =>
                    row.map(cell => typeof cell === "number" ? cell : 1)
                ),
            }}
        />
    );
}
