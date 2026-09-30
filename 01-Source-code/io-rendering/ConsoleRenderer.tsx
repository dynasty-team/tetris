import React from "react";
import { Box, Text, useWindowSize, render as inkRender } from "ink";
import { isInBounds } from "../shared/board-utils";
import { getShape } from "../core-engine/tetromino-shapes";
import { lockPieceToBoard } from "../core-engine/movement";

import type {
    ActivePiece,
    RenderSnapshot,
    Board,
    CellValue,
    TetrominoType
} from "../shared/types";

import {
    BOARD_WIDTH,
    BOARD_HEIGHT
} from "../shared/constants";

import {
    MIN_TERMINAL_WIDTH,
    MIN_TERMINAL_HEIGHT,
    isTerminalTooSmall
} from "./layout";


const EMPTY_CELL: CellValue = 0;


const PIECE_COLORS: Record<TetrominoType, string> = {
    I: "cyan",
    O: "yellow",
    T: "magenta",
    S: "green",
    Z: "red",
    J: "blue",
    L: "#ff9f43",
};



// =============================
// Board Logic
// =============================



// Copy Board เพื่อไม่แก้ Board จริง
function cloneBoard(board: Board): Board {
    return board.map(row => [...row]);
}



// =============================
// TUI Components
// =============================

// แสดง 1 Cell
function Cell({
    value
}: {
    value: CellValue
}): React.ReactElement {

    if (value === EMPTY_CELL) {
        return (
            <Text color="#30384a">
                {"┼──"}
            </Text>
        );
    }

    const type = value as TetrominoType;

    return (
        <Text color={PIECE_COLORS[type]} bold>
            {"███"}
        </Text>
    );
}

// =============================
// Board
// =============================

function BoardView({
    board
}: {
    board: Board
}): React.ReactElement {

    return (
        <Box
            flexDirection="column"
            borderStyle="double"
            borderColor="cyan"
            paddingX={1}
        >

            {board.map((row, y) => (

                <Box
                    key={y}
                    flexDirection="row"
                >

                    {row.map((cell, x) => (

                        <Cell
                            key={x}
                            value={cell}
                        />

                    ))}

                </Box>

            ))}

        </Box>
    );
}



function NextPiece({
    type
}: {
    type: TetrominoType
}): React.ReactElement {

    const shape = getShape(type, 0);
    const color = PIECE_COLORS[type];

    return (
        <Box flexDirection="column">

            {shape.map((row, y) => (

                <Box key={y} flexDirection="row">

                    {row.map((cell, x) => (

                        <Text
                            key={x}
                            color={color}
                            bold
                        >
                            {cell === 1 ? "██" : "  "}
                        </Text>

                    ))}

                </Box>

            ))}

        </Box>
    );
}

// =============================
// Information Panel
// =============================

function InfoPanel({
    snapshot
}: {
    snapshot: RenderSnapshot
}): React.ReactElement {

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="yellow"
            paddingX={1}
            width={30}
        >
            <Text bold color="yellow">
                SCORE
            </Text>

            <Text>
                Score: {snapshot.score}
            </Text>

            <Text>
                High Score: {snapshot.highScore}
            </Text>

            <Text>
                Level: {snapshot.level}
            </Text>

            <Text>
                Lines: {snapshot.linesClearedTotal}
            </Text>

            <Box
                marginTop={1}
                flexDirection="column"
            >
                <Text bold color="magenta">
                    NEXT
                </Text>

                <Box marginTop={1}>
                    <NextPiece type={snapshot.nextPiece} />
                </Box>
            </Box>

        </Box>
    );
}

// =============================
// Controls
// =============================

function Controls(): React.ReactElement {

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="blue"
            paddingX={1}
            width={32}
        >

            <Text bold color="blue">
                CONTROLS
            </Text>

            <Text>A / ←   Move Left</Text>
            <Text>D / →   Move Right</Text>
            <Text>S / ↓   Soft Drop</Text>
            <Text>W / ↑   Rotate</Text>
            <Text>SPACE   Hard Drop</Text>

            <Text color="yellow">
                P       Pause
            </Text>

            <Text color="red">
                Q       Quit
            </Text>

        </Box>
    );
}


// =============================
// Game Status
// =============================

function Status({
    status
}: {
    status: RenderSnapshot["status"]
}): React.ReactElement {

    if (status === "paused") {

        return (
            <Text color="yellow" bold>
                === PAUSED ===
            </Text>
        );
    }


    if (status === "gameover") {

        return (
            <Box flexDirection="column" alignItems="center">
                <Text color="red" bold>
                    === GAME OVER ===
                </Text>
                <Text color="yellow">
                    Press Q to exit
                </Text>
            </Box>
        );
    }


    return (
        <Text color="green">
            ● PLAYING
        </Text>
    );
}


// =============================
// Main TUI
// =============================

function GameUI({
    snapshot
}: {
    snapshot: RenderSnapshot
}): React.ReactElement {

   const displayBoard = lockPieceToBoard(
    cloneBoard(snapshot.board),
    snapshot.activePiece
);


    return (

        <Box
            flexDirection="column"
            alignItems="center"
        >

            {/* Header */}

            <Box
                borderStyle="double"
                borderColor="cyan"
                paddingX={3}
            >

                <Text
                    color="cyan"
                    bold
                >
                    ✦ TETRIS ✦
                </Text>

            </Box>


            {/* Game Area */}

            <Box
                marginTop={1}
                flexDirection="row"
                gap={1}
            >

                {/* Controls */}

                <Controls />


                {/* Board */}

                <BoardView
                    board={displayBoard}
                />


                {/* Score / Next */}

                <InfoPanel
                    snapshot={snapshot}
                />

            </Box>


            {/* Status */}

            <Box marginTop={1}>

                <Status
                    status={snapshot.status}
                />

            </Box>

        </Box>
    );
}


// =============================
// Minimum Terminal Size Guard
// =============================

// แสดงเมื่อเทอร์มินัลเล็กเกินกว่าจะวาด Tetris UI ได้ครบโดยไม่ overflow/ทับกัน
// ตัว warning เองก็ responsive: บีบตามขนาดจริง (columns/rows) และให้ Text wrap แทนการ cut off
function TooSmallWarning({
    columns,
    rows
}: {
    columns: number;
    rows: number
}): React.ReactElement {

    return (
        <Box
            width={columns}
            height={rows}
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            paddingX={1}
        >

            <Text color="red" bold wrap="wrap">
                Terminal window is too small.
            </Text>

            <Text color="yellow" wrap="wrap">
                Please resize your terminal to a larger size to play Tetris.
            </Text>

            <Box marginTop={1}>
                <Text dimColor wrap="wrap">
                    {`Needs at least ${MIN_TERMINAL_WIDTH}x${MIN_TERMINAL_HEIGHT} (current: ${columns}x${rows})`}
                </Text>
            </Box>

        </Box>
    );
}


// =============================
// Root Component
// =============================

// จุดเดียวที่ตัดสินใจว่าจะวาดเกมจริง (GameUI) หรือจอเตือนขนาดเทอร์มินัล (TooSmallWarning)
// ใช้ Ink's useWindowSize() ซึ่งจะ re-render อัตโนมัติทุกครั้งที่เทอร์มินัลถูก resize
// ทำให้ resize ระหว่างเล่นเกมทำงานได้โดยไม่ต้องรอ renderer(snapshot) ถูกเรียกใหม่จากภายนอก
function App({
    snapshot
}: {
    snapshot: RenderSnapshot
}): React.ReactElement {

    const { columns, rows } = useWindowSize();

    if (isTerminalTooSmall(columns, rows)) {
        return (
            <TooSmallWarning
                columns={columns}
                rows={rows}
            />
        );
    }

    return (
        <Box
            width={columns}
            height={rows}
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
        >
            <GameUI snapshot={snapshot} />
        </Box>
    );
}


// =============================
// Renderer
// =============================

// เก็บ Ink Instance เอาไว้
// เพื่อไม่ให้ GameLoop สร้าง TUI ใหม่ทุก Frame
let inkInstance: ReturnType<typeof inkRender> | null = null;


// GameLoop สามารถเรียก render(snapshot) ซ้ำได้
export function render(snapshot: RenderSnapshot): void {

    // ครั้งแรกเท่านั้น -> สร้าง Ink UI
    if (inkInstance === null) {

        inkInstance = inkRender(
            <App snapshot={snapshot} />,
            { alternateScreen: true }
        );

        return;
    }


    // ครั้งต่อ ๆ ไป
    // Update UI ตัวเดิมแทนการสร้างใหม่
    inkInstance.rerender(
        <App snapshot={snapshot} />
    );
}


// =============================
// Cleanup
// =============================

// ใช้ตอนออกจากเกม
// เพื่อถอด Ink UI ออกจาก Terminal
export function unmountRenderer(): void {

    if (inkInstance !== null) {
        inkInstance.clear();
        inkInstance.unmount();
        inkInstance = null;
    }
}