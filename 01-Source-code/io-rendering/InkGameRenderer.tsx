// 01-Source-code/io-rendering/InkGameRenderer.tsx
//
// In-game UI สำหรับ Tetris ด้วย Ink + React
// จุดสำคัญ: ไม่มี console.clear() และไม่เขียน ANSI ทับจอเอง
// Ink จะคำนวณ diff ของ terminal output แล้วแก้เฉพาะส่วนที่เปลี่ยน
// จึงเหมาะกับ CMD/Windows Terminal มากกว่าการ clear จอทุก frame

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, render, useInput, useStdout } from 'ink';
import type { ActivePiece, Board, GameAction, RenderSnapshot, TetrominoType } from '../shared/types';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../shared/constants';

const UI_WIDTH = 82;
const COMPACT_WIDTH = 70;
const MIN_GAME_WIDTH = 50;
const MIN_GAME_HEIGHT = 22;
const CELL = '██';

const PIECE_COLORS: Record<TetrominoType, string> = {
  I: '#55c7ff',
  O: '#ffd84d',
  T: '#c77dff',
  S: '#55e27a',
  Z: '#ff4d67',
  J: '#5591ff',
  L: '#ff9f43',
};

// สีของ Ghost Piece: ใช้เป็นบล็อกทึบโทนเข้มแบบภาพตัวอย่าง
// เพื่อให้มองเห็นจุดที่จะลงพื้นได้ชัด โดยไม่ไปแย่งสายตาจาก active piece
const GHOST_COLORS: Record<TetrominoType, string> = {
  I: '#245768',
  O: '#6b5a1f',
  T: '#55356b',
  S: '#2e6540',
  Z: '#682c3a',
  J: '#2b4a79',
  L: '#6d4622',
};

const PIECE_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  T: [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  S: [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  Z: [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  L: [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
};

function pieceCellAt(piece: ActivePiece, x: number, y: number): boolean {
  const localX = x - piece.position.x;
  const localY = y - piece.position.y;

  if (localX < 0 || localY < 0) return false;
  return piece.shape[localY]?.[localX] === 1;
}

/**
 * ตรวจสอบตำแหน่งของ active piece โดยอาศัยเฉพาะ RenderSnapshot
 * จึงไม่ต้องเรียก CoreEngine จาก renderer
 */
function collidesAt(board: Board, piece: ActivePiece, y: number): boolean {
  for (let row = 0; row < piece.shape.length; row += 1) {
    const shapeRow = piece.shape[row];
    if (!shapeRow) continue;

    for (let col = 0; col < shapeRow.length; col += 1) {
      if (shapeRow[col] !== 1) continue;

      const targetX = piece.position.x + col;
      const targetY = y + row;

      if (targetX < 0 || targetX >= BOARD_WIDTH || targetY >= BOARD_HEIGHT) {
        return true;
      }

      if (targetY >= 0 && board[targetY]?.[targetX] !== 0) {
        return true;
      }
    }
  }

  return false;
}

/** คืนตำแหน่ง Y ที่ active piece จะตกถึงพื้น/บล็อกก้อนล่าสุด */
function getGhostPiece(snapshot: RenderSnapshot): ActivePiece {
  const piece = snapshot.activePiece;
  let ghostY = piece.position.y;

  while (!collidesAt(snapshot.board, piece, ghostY + 1)) {
    ghostY += 1;
  }

  return {
    ...piece,
    position: {
      ...piece.position,
      y: ghostY,
    },
  };
}

function BoardView({ snapshot }: { snapshot: RenderSnapshot }): React.ReactElement {
  const ghostPiece = useMemo(() => {
    if (snapshot.status === 'gameover') return null;
    return getGhostPiece(snapshot);
  }, [snapshot]);

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={snapshot.isLocking ? '#ff72cf' : '#00e5ff'}
      paddingX={1}
      paddingY={0}
    >
      {snapshot.board.map((row, y) => (
        <Box key={y} flexDirection="row">
          {row.map((cell, x) => {
            const isGhost = ghostPiece ? pieceCellAt(ghostPiece, x, y) : false;
            const isActive = pieceCellAt(snapshot.activePiece, x, y);

            // Draw order: board -> ghost -> active piece
            // ดังนั้น active piece จะทับ ghost เมื่อชิ้นส่วนแตะพื้นพอดี
            if (isActive) {
              return (
                <Text key={x} color={PIECE_COLORS[snapshot.activePiece.type]} bold>
                  {CELL}
                </Text>
              );
            }

            if (isGhost && cell === 0) {
              return (
                <Text key={x} color={GHOST_COLORS[ghostPiece!.type]} bold>
                  {CELL}
                </Text>
              );
            }

            if (cell === 0) {
              return (
                <Text key={x} color="#263044">
                  {'··'}
                </Text>
              );
            }

            const type = cell as TetrominoType;
            return (
              <Text key={x} color={PIECE_COLORS[type]} bold>
                {CELL}
              </Text>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

function NextPiece({ type }: { type: TetrominoType }): React.ReactElement {
  const shape = PIECE_SHAPES[type];
  const color = PIECE_COLORS[type];

  return (
    <Box flexDirection="column" alignItems="center">
      {shape.map((row, y) => (
        <Box key={y} flexDirection="row">
          {row.map((cell, x) => (
            <Text key={x} color={cell ? color : '#263044'} bold={cell === 1}>
              {cell ? CELL : '  '}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}

function Panel({
  title,
  borderColor,
  children,
}: {
  title: string;
  borderColor: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Box
      width={23}
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
      paddingY={1}
    >
      <Text color={borderColor} bold>
        {`[ ${title} ]`}
      </Text>
      {children}
    </Box>
  );
}

function GameHeader({ snapshot }: { snapshot: RenderSnapshot }): React.ReactElement {
  const statusColor =
    snapshot.status === 'playing'
      ? '#55e27a'
      : snapshot.status === 'paused'
        ? '#ffd84d'
        : '#ff4d67';

  const statusText =
    snapshot.status === 'playing'
      ? 'PLAYING'
      : snapshot.status === 'paused'
        ? 'PAUSED'
        : 'GAME OVER';

  return (
    <Box
      width={UI_WIDTH}
      borderStyle="double"
      borderColor="#00e5ff"
      paddingX={2}
      justifyContent="space-between"
    >
      <Text color="#00e5ff" bold>
        ✦ TETRIS ✦
      </Text>
      <Text color="#7f8caa">SINGLE PLAYER</Text>
      <Text color={statusColor} bold>
        ● {statusText}
      </Text>
    </Box>
  );
}

function ControlsPanel(): React.ReactElement {
  return (
    <Panel title="CONTROLS" borderColor="#5591ff">
      <Text color="#c0c7d6">← / A   Move Left</Text>
      <Text color="#c0c7d6">→ / D   Move Right</Text>
      <Text color="#c0c7d6">↑ / W   Rotate</Text>
      <Text color="#c0c7d6">↓ / S   Soft Drop</Text>
      <Text color="#c0c7d6">SPACE   Hard Drop</Text>
      <Text color="#ffd84d">P       Pause</Text>
      <Text color="#ff4d67">Q / ESC Quit</Text>
    </Panel>
  );
}

function ScorePanel({ snapshot }: { snapshot: RenderSnapshot }): React.ReactElement {
  return (
    <Panel title="SCORE" borderColor="#ffd84d">
      <Box marginTop={1} flexDirection="column">
        <Text color="#7f8caa">SCORE</Text>
        <Text color="#fff1a8" bold>
          {snapshot.score.toLocaleString().padStart(8, '0')}
        </Text>

        <Box marginTop={1} flexDirection="column">
          <Text color="#7f8caa">HIGH SCORE</Text>
          <Text color="#ffd84d" bold>
            {snapshot.highScore.toLocaleString()}
          </Text>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text color="#7f8caa">LEVEL</Text>
          <Text color="#c77dff" bold>
            {snapshot.level}
          </Text>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text color="#7f8caa">LINES</Text>
          <Text color="#55e27a" bold>
            {snapshot.linesClearedTotal}
          </Text>
        </Box>
      </Box>
    </Panel>
  );
}

function NextPanel({ type }: { type: TetrominoType }): React.ReactElement {
  return (
    <Panel title="NEXT" borderColor="#c77dff">
      <Box marginTop={1} alignItems="center" justifyContent="center">
        <NextPiece type={type} />
      </Box>
      <Box marginTop={1} justifyContent="center">
        <Text color={PIECE_COLORS[type]} bold>
          {type} PIECE
        </Text>
      </Box>
    </Panel>
  );
}

function CenterMessage({ status }: { status: RenderSnapshot['status'] }): React.ReactElement | null {
  if (status === 'playing') return null;

  return (
    <Box
      position="absolute"
      marginTop={9}
      width={22}
      alignItems="center"
      justifyContent="center"
    >
      <Box borderStyle="double" borderColor={status === 'paused' ? '#ffd84d' : '#ff4d67'} paddingX={2}>
        <Text color={status === 'paused' ? '#ffd84d' : '#ff4d67'} bold>
          {status === 'paused' ? '|| PAUSED ||' : 'GAME OVER'}
        </Text>
      </Box>
    </Box>
  );
}

function RightColumn({ snapshot }: { snapshot: RenderSnapshot }): React.ReactElement {
  return (
    <Box width={23} flexDirection="column">
      <ScorePanel snapshot={snapshot} />
      <Box marginTop={1}>
        <NextPanel type={snapshot.nextPiece} />
      </Box>
    </Box>
  );
}

function Footer({ status }: { status: RenderSnapshot['status'] }): React.ReactElement {
  return (
    <Box
      width={UI_WIDTH}
      marginTop={1}
      borderStyle="single"
      borderColor="#30384a"
      paddingX={1}
      justifyContent="center"
    >
      {status === 'gameover' ? (
        <>
          <Text color="#ff4d67" bold>ENTER / SPACE  BACK TO MENU | Q / ESC  EXIT</Text>
        </>
      ) : (
        <>
          <Text color="#55e27a">● SYSTEM NOMINAL</Text>
        </>
      )}
    </Box>
  );
}

function ResponsiveNotice({
  width,
  height,
}: {
  width: number;
  height: number;
}): React.ReactElement {
  const noticeWidth = Math.max(width, 1);
  const panelWidth = Math.max(Math.min(width - 2, 58), 1);

  return (
    <Box
      width={noticeWidth}
      height={Math.max(height, 1)}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        width={panelWidth}
        borderStyle="double"
        borderColor="#ffd84d"
        paddingX={2}
        paddingY={1}
        flexDirection="column"
        alignItems="center"
      >
        <Text color="#ffd84d" bold>⚠ SCREEN TOO SMALL</Text>
        <Text color="#c0c7d6">Please resize the terminal window.</Text>
        <Text color="#55e27a" bold>Use a larger screen to play Tetris.</Text>
        <Box marginTop={1} flexDirection="column" alignItems="center">
          <Text color="#7f8caa">Recommended: at least {MIN_GAME_WIDTH} columns</Text>
          <Text color="#7f8caa">and {MIN_GAME_HEIGHT} rows</Text>
          <Text color="#626d83">Current: {width} × {height}</Text>
        </Box>
      </Box>
    </Box>
  );
}

function GameApp({
  snapshot,
  onAction,
  onExit,
}: {
  snapshot: RenderSnapshot;
  onAction: (action: GameAction) => void;
  onExit: () => void;
}): React.ReactElement {
  const { stdout } = useStdout();
  const [, forceResize] = useState(0);

  useEffect(() => {
    const onResize = () => forceResize((value) => value + 1);
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  useInput((input, key) => {
    const normalized = input.toLowerCase();

    if (snapshot.status === 'gameover') {
      if (key.return || input === ' ' || key.escape || normalized === 'q') {
        onExit();
      }
      return;
    }

    if (normalized === 'a' || key.leftArrow) {
      onAction('MOVE_LEFT');
      return;
    }

    if (normalized === 'd' || key.rightArrow) {
      onAction('MOVE_RIGHT');
      return;
    }

    if (normalized === 's' || key.downArrow) {
      onAction('SOFT_DROP');
      return;
    }

    if (normalized === 'w' || key.upArrow) {
      onAction('ROTATE');
      return;
    }

    if (input === ' ') {
      onAction('HARD_DROP');
      return;
    }

    if (normalized === 'p') {
      onAction('PAUSE');
      return;
    }

    if (normalized === 'q' || key.escape) {
      onAction('QUIT');
    }
  });

  const columns = stdout.columns || 100;
  const rows = stdout.rows || 30;
  const tooSmall = columns < MIN_GAME_WIDTH || rows < MIN_GAME_HEIGHT;
  const compact = columns < UI_WIDTH || rows < MIN_GAME_HEIGHT + 5;
  const contentWidth = compact ? Math.min(COMPACT_WIDTH, columns) : UI_WIDTH;

  if (tooSmall) {
    return <ResponsiveNotice width={columns} height={rows} />;
  }

  return (
    <Box flexDirection="column" alignItems="center">
      {!compact ? (
        <Box width={contentWidth}>
          <GameHeader snapshot={snapshot} />
        </Box>
      ) : null}

      <Box
        width={contentWidth}
        marginTop={1}
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        gap={1}
      >
        {!compact ? <ControlsPanel /> : null}

        <Box position="relative">
          <BoardView snapshot={snapshot} />
          <CenterMessage status={snapshot.status} />
        </Box>

        {compact ? <ScorePanel snapshot={snapshot} /> : null}

        {!compact ? (
          <RightColumn snapshot={snapshot} />
        ) : null}
      </Box>

      {!compact ? (
        <Box width={contentWidth}>
          <Footer status={snapshot.status} />
        </Box>
      ) : null}
    </Box>
  );
}

export interface InkGameRendererHandle {
  render(snapshot: RenderSnapshot): void;
  waitForExit(): Promise<void>;
  exit(): void;
  unmount(): void;
}

export function createInkGameRenderer(
  initialSnapshot: RenderSnapshot,
  onAction: (action: GameAction) => void,
): InkGameRendererHandle {
  let updateSnapshot: ((snapshot: RenderSnapshot) => void) | undefined;
  let resolveExit: (() => void) | undefined;

  const exitPromise = new Promise<void>((resolve) => {
    resolveExit = resolve;
  });

  const instance = render(
    <GameBridge
      initialSnapshot={initialSnapshot}
      register={(setter) => {
        updateSnapshot = setter;
      }}
      onAction={onAction}
      onExit={() => resolveExit?.()}
    />,
    {
      alternateScreen: true,
      exitOnCtrlC: true,
    },
  );

  return {
    render(snapshot) {
      updateSnapshot?.(snapshot);
    },
    waitForExit() {
      return exitPromise;
    },
    exit() {
      resolveExit?.();
    },
    unmount() {
      instance.unmount();
    },
  };
}

function GameBridge({
  initialSnapshot,
  register,
  onAction,
  onExit,
}: {
  initialSnapshot: RenderSnapshot;
  register: (setter: (snapshot: RenderSnapshot) => void) => void;
  onAction: (action: GameAction) => void;
  onExit: () => void;
}): React.ReactElement {
  const [snapshot, setSnapshot] = useState(initialSnapshot);

  useEffect(() => {
    register(setSnapshot);
  }, [register]);

  return (
    <GameApp
      snapshot={snapshot}
      onAction={onAction}
      onExit={onExit}
    />
  );
}
