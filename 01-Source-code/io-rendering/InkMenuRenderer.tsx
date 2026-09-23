// 01-Source-code/io-rendering/InkMenuRenderer.tsx
//
// UI layer สำหรับ Main Menu / High Score โดยใช้ Ink + React
// โครงสร้างเดิมยังคงอยู่: MenuState เก็บ state, main.ts คุม flow,
// ส่วนไฟล์นี้รับผิดชอบเฉพาะการวาด UI และ keyboard interaction ของหน้าเมนู

import React, { useState } from 'react';
import { Box, Text, render, useInput } from 'ink';
import type { MenuOptionId } from '../menu/MenuState';
import { MenuState } from '../menu/MenuState';
import type { SaveData } from '../shared/types';

const PANEL_WIDTH = 58;

const TITLE_COLORS = [
  '#ff4d67',
  '#ffd84d',
  '#55e27a',
  '#55a7ff',
  '#c77dff',
  '#ff72cf',
];

function TetrisTitle(): React.ReactElement {
  return (
    <Box flexDirection="column" alignItems="center">
      <Box>
        <Text color="cyan" bold>{'◆ '.repeat(3)}</Text>
      <Box > 
        {'TETRIS'.split('').map((char, index) => (
          <Text key={`${char}-${index}`} color={TITLE_COLORS[index]} bold > 
            {char}
          </Text>
        ))}
      </Box>
        <Text color="cyan" bold>{' ◆'.repeat(3)}</Text>
      </Box>
      <Text color="#7f8caa" dimColor>T E R M I N A L   G A M E</Text>
    </Box>
  );
}

function MiniBlocks(): React.ReactElement {
  return (
    <Box marginTop={1} alignItems="center" justifyContent="center">
      <Text color="#55a7ff" bold>■■ </Text>
      <Text color="#55e27a" bold>■■■ </Text>
      <Text color="#ffd84d" bold>■■ </Text>
      <Text color="#c77dff" bold>■■■ </Text>
      <Text color="#ff4d67" bold>■</Text>
    </Box>
  );
}

function MenuOptionRow({
  label,
  selected,
  hint,
}: {
  label: string;
  selected: boolean;
  hint: string;
}): React.ReactElement {
  return (
    <Box
      width={PANEL_WIDTH - 6}
      minHeight={3}
      paddingX={2}
      alignItems="center"
      justifyContent="space-between"
      borderStyle="round"
      borderColor={selected ? '#00e5ff' : '#3c465d'}
      backgroundColor={selected ? '#12314a' : undefined}
    >
      <Box>
        <Text color={selected ? '#00e5ff' : '#69758c'} bold>
          {selected ? '▶' : ' '}
        </Text>
        <Text> </Text>
        <Text color={selected ? 'white' : '#c0c7d6'} bold={selected}>
          {label}
        </Text>
      </Box>
      <Text color={selected ? '#75d7ff' : '#69758c'} dimColor={!selected}>
        {hint}
      </Text>
    </Box>
  );
}

function MenuFooter(): React.ReactElement {
  return (
    <Box flexDirection="column" alignItems="center" marginTop={1}>
      <Text color="#7f8caa">↑ / ↓  Pgup / Pgdwn   •   ENTER  confirm</Text>
      <Text color="#626d83" dimColor>W / S also   •   Q  quit</Text>
    </Box>
  );
}

export function MainMenuApp({
  state,
  onSelect,
}: {
  state: MenuState;
  onSelect: (id: MenuOptionId) => void;
}): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(state.getSelectedIndex());

  useInput((input, key) => {
    if (key.upArrow || input.toLowerCase() === 'w') {
      state.moveUp();
      setSelectedIndex(state.getSelectedIndex());
      return;
    }

    if (key.downArrow || input.toLowerCase() === 's') {
      state.moveDown();
      setSelectedIndex(state.getSelectedIndex());
      return;
    }

    if (key.return || input === ' ') {
      onSelect(state.getSelectedOption().id);
      return;
    }

    if (input.toLowerCase() === 'q' || key.escape) {
      onSelect('exit');
    }
  });

  const options = state.options;
  const selectedId = options[selectedIndex]?.id;

  return (
    <Box flexDirection="column" alignItems="center" paddingY={1}>
      <Box
        width={PANEL_WIDTH}
        flexDirection="column"
        alignItems="center"
        borderStyle="double"
        borderColor="#00e5ff"
        paddingY={1}
        paddingX={2}
      >
        <TetrisTitle />
        <MiniBlocks />

        <Box marginTop={2} marginBottom={1} width={PANEL_WIDTH - 6}>
          <Text color="#556078">
            {'─'.repeat(PANEL_WIDTH - 8)}
          </Text>
        </Box>

        <Box flexDirection="column" alignItems="center" gap={1}>
          <MenuOptionRow
            label="START GAME"
            hint="ENTER"
            selected={selectedId === 'start'}
          />
          <MenuOptionRow
            label="HIGH SCORE"
            hint="VIEW"
            selected={selectedId === 'highscore'}
          />
          <MenuOptionRow
            label="EXIT"
            hint="QUIT"
            selected={selectedId === 'exit'}
          />
        </Box>

        <Box marginTop={2}>
          <Text color="#55e27a">● SYSTEM READY</Text>
          <Text color="#626d83">  •  SINGLE PLAYER</Text>
        </Box>
      </Box>

      <MenuFooter />
    </Box>
  );
}

function StatRow({
  label,
  value,
  valueColor = 'white',
}: {
  label: string;
  value: string;
  valueColor?: string;
}): React.ReactElement {
  return (
    <Box
      width={PANEL_WIDTH - 8}
      paddingX={2}
      minHeight={3}
      alignItems="center"
      justifyContent="space-between"
      borderStyle="single"
      borderColor="#30384a"
    >
      <Text color="#8b96ab">{label}</Text>
      <Text color={valueColor} bold>{value}</Text>
    </Box>
  );
}

export function HighScoreApp({
  data,
  onBack,
}: {
  data: SaveData | null;
  onBack: () => void;
}): React.ReactElement {
  useInput((input, key) => {
    const normalized = input.toLowerCase();

    // รองรับ Esc / B ตาม flow เดิม และ Enter/Space เพื่อให้กลับได้ง่าย
    if (key.escape || normalized === 'b' || key.return || input === ' ') {
      onBack();
    }
  });

  return (
    <Box flexDirection="column" alignItems="center" paddingY={2}>
      <Box
        width={PANEL_WIDTH}
        flexDirection="column"
        alignItems="center"
        borderStyle="double"
        borderColor="#ffd84d"
        paddingY={1}
        paddingX={2}
      >
        <Text color="#ffd84d" bold>★  H I G H   S C O R E  ★</Text>
        <Text color="#6f7890" dimColor>PERSONAL BEST RECORD</Text>

        <Box marginTop={2} width={PANEL_WIDTH - 8} justifyContent="center">
          <Text color="#626d83">PLAYER RECORD</Text>
        </Box>

        <Box
          marginTop={1}
          width={PANEL_WIDTH - 8}
          paddingX={2}
          minHeight={2}
          alignItems="center"
          justifyContent="center"
          borderStyle="round"
          borderColor={data ? '#ffd84d' : '#3c465d'}
          backgroundColor={data ? '#382f12' : undefined}
        >
          <Text color={data ? '#fff1a8' : '#778198'} bold>
            {data ? data.highScore.toLocaleString() : '0'}
          </Text>
        </Box>

        {data ? (
          <Box flexDirection="column" alignItems="center" marginTop={2} gap={1}>
            <StatRow label="LEVEL" value={String(data.level)} valueColor="#c77dff" />
            <StatRow label="LINES" value={data.linesCleared.toLocaleString()} valueColor="#55e27a" />
            <StatRow
              label="DATE"
              value={new Date(data.timestamp).toLocaleString('th-TH')}
              valueColor="#55a7ff"
            />
          </Box>
        ) : (
          <Box
            marginTop={2}
            paddingX={3}
            paddingY={1}
            borderStyle="round"
            borderColor="#3c465d"
          >
            <Text color="#9ba5b7">No statistics yet • Try playing one game!</Text>
          </Box>
        )}

        <Box marginTop={2}>
          <Text color="#ff4d67">● RECORD LOCKED</Text>
          <Text color="#626d83">  •  SAVED LOCALLY</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color="#7f8caa">ESC / B</Text>
        <Text color="#626d83">  BACK HOME  •  ENTER/SPACE </Text>
      </Box>
    </Box>
  );
}

export async function runInkMainMenu(state: MenuState): Promise<MenuOptionId> {
  let result: MenuOptionId = 'exit';
  let instance: ReturnType<typeof render> | undefined;

  instance = render(
    <MainMenuApp
      state={state}
      onSelect={(id) => {
        result = id;
        instance?.unmount();
      }}
    />,
    {
      alternateScreen: true,
      exitOnCtrlC: true,
    },
  );

  await instance.waitUntilExit();
  return result;
}

export async function runInkHighScore(data: SaveData | null): Promise<void> {
  let instance: ReturnType<typeof render> | undefined;

  instance = render(
    <HighScoreApp onBack={() => instance?.unmount()} data={data} />,
    {
      alternateScreen: true,
      exitOnCtrlC: true,
    },
  );

  await instance.waitUntilExit();
}
