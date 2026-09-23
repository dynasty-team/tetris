import React, { useState, useEffect } from 'react';
import { render, Box, Text, useStdout } from 'ink';

export interface RenderSnapshot {
  board: number[][];
  activePiece: {
    type: string;
    position: { x: number; y: number };
    rotation: number;
    shape: number[][];
  };
  nextPiece: string;
  score: number;
  level: number;
  highScore: number;
  linesClearedTotal: number;
  status: 'idle' | 'playing' | 'paused' | 'gameover';
  isLocking: boolean;
}


const BLOCK_MAP: Record<number, { symbol: string; color: string }> = {
  0: { symbol: ' .', color: 'gray' },
  1: { symbol: '██', color: 'cyan' },
  2: { symbol: '██', color: 'magenta' },
  3: { symbol: '██', color: 'yellow' },
  4: { symbol: '██', color: 'blue' },
  99: { symbol: '▓▓', color: 'magenta' },
};

export const SpaceTetrisUI = ({ snapshot }: { snapshot: RenderSnapshot }) => {
  const { stdout } = useStdout();
  const [terminalSize, setTerminalSize] = useState({
    columns: stdout.columns || 80,
    rows: stdout.rows || 30,
  });

  // คอยตรวจจับเมื่อผู้ใช้ปรับขนาดหน้าจอ Terminal
  useEffect(() => {
    const onResize = () => {
      setTerminalSize({
        columns: stdout.columns || 80,
        rows: stdout.rows || 30,
      });
    };
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  // Merge Active Piece เข้าสู่ Board
  const displayBoard = snapshot.board.map((row) => [...row]);
  const { shape, position } = snapshot.activePiece;

  shape.forEach((r, dy) => {
    r.forEach((cell, dx) => {
      if (cell !== 0) {
        const boardY = position.y + dy;
        const boardX = position.x + dx;
        const boardRow = displayBoard[boardY];
        if (boardRow && boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
          boardRow[boardX] = 99;
        }
      }
    });
  });

  // คำนวณความสูงของ UI เพื่อจัดกึ่งกลางแนวนอนและแนวตั้ง
  const uiHeight = 28;
  const topPadding = Math.max(0, Math.floor((terminalSize.rows - uiHeight) / 2));

  return (
    <Box
      width={terminalSize.columns}
      height={terminalSize.rows}
      flexDirection="column"
      alignItems="center"
      paddingTop={topPadding}
    >
      <Box flexDirection="column" width={78}>
        {/* Header */}
        <Box
          borderStyle="double"
          borderColor="cyan"
          justifyContent="space-between"
          paddingX={2}
        >
          <Text color="cyan" bold>
            ✦ COSMIC TETRIS ✦
          </Text>
          <Text color="white">
            STATUS:{' '}
            <Text color={snapshot.status === 'playing' ? 'green' : 'magenta'} bold>
              ● {snapshot.status.toUpperCase()}
            </Text>
          </Text>
          <Text color="yellow" bold>
            HIGH SCORE: {snapshot.highScore.toLocaleString()}
          </Text>
        </Box>

        {/* Main Content (Center Space) */}
        <Box flexDirection="row" justifyContent="center" marginTop={1} gap={2}>
          {/* Left Side: Controls & Mission */}
          <Box flexDirection="column" width={22}>
            <Box
              borderStyle="single"
              borderColor="blue"
              flexDirection="column"
              paddingX={1}
            >
              <Text color="cyan" bold>[ CONTROLS ]</Text>
              <Text color="gray">← / → : Move</Text>
              <Text color="gray">↑     : Rotate</Text>
              <Text color="gray">↓     : Soft Drop</Text>
              <Text color="white">SPACE : Hard</Text>
              <Text color="magenta">P     : Pause</Text>
            </Box>

            <Box
              borderStyle="single"
              borderColor="blue"
              flexDirection="column"
              paddingX={1}
              marginTop={1}
            >
              <Text color="cyan" bold>[ MISSION ]</Text>
              <Text color="white">
                Level: <Text color="yellow">{snapshot.level}</Text>
              </Text>
              <Text color="white">
                Lines: <Text color="cyan">{snapshot.linesClearedTotal}</Text>
              </Text>
            </Box>
          </Box>

          {/* Center: Tetris Game Matrix */}
          <Box
            borderStyle="round"
            borderColor={snapshot.isLocking ? 'magenta' : 'cyan'}
            flexDirection="column"
            paddingX={1}
          >
            {displayBoard.map((row, y) => (
              <Box key={y} flexDirection="row">
                {row.map((cell, x) => {
                  const config = BLOCK_MAP[cell] ?? BLOCK_MAP[0]!;
                  return (
                    <Text key={x} color={config.color}>
                      {config.symbol}
                    </Text>
                  );
                })}
              </Box>
            ))}
          </Box>

          {/* Right Side: Scoreboard & Next Piece */}
          <Box flexDirection="column" width={22}>
            <Box
              borderStyle="single"
              borderColor="blue"
              flexDirection="column"
              paddingX={1}
            >
              <Text color="cyan" bold>[ SCORE ]</Text>
              <Text color="yellow" bold>
                {snapshot.score.toLocaleString().padStart(8, '0')}
              </Text>
            </Box>

            <Box
              borderStyle="single"
              borderColor="blue"
              flexDirection="column"
              alignItems="center"
              marginTop={1}
              padding={1}
            >
              <Text color="cyan" bold>[ NEXT ]</Text>
              <Box marginTop={1}>
                <Text color="magenta" bold>
                  ┌───────┐{"\n"}
                  │  [{snapshot.nextPiece}]  │{"\n"}
                  └───────┘
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          borderStyle="single"
          borderColor="gray"
          justifyContent="space-between"
          paddingX={1}
          marginTop={1}
        >
          <Text color="blue">. * . ✦ SYSTEM NOMINAL . * .</Text>
          <Text color="gray">Ink Engine | Bun + TS</Text>
        </Box>
      </Box>
    </Box>
  );
};

