// 01-Source-code/io-rendering/InkMenuRenderer.tsx
//
// UI layer สำหรับ Main Menu / High Score โดยใช้ Ink + React
// โครงสร้างเดิมยังคงอยู่: MenuState เก็บ state, main.ts คุม flow,
// ส่วนไฟล์นี้รับผิดชอบเฉพาะการวาด UI และ keyboard interaction ของหน้าเมนู

import React, { useEffect, useState } from 'react';
import { Box, Text, render, useStdout } from 'ink';
import type { MenuOptionId } from '../menu/MenuState';
import { MenuState } from '../menu/MenuState';
import type { SaveData } from '../shared/types';
import type { KeyboardAction, KeyboardActionHandler } from './KeyboardInput';
import { KeyboardInput } from './KeyboardInput';

const PANEL_WIDTH = 58;
const MIN_MENU_WIDTH = 58;
const MIN_MENU_HEIGHT = 20;

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
      <Text color="#7f8caa">↑ / ↓  Pgup / Pgdwn   •   ENTER / SPACE confirm</Text>
      <Text color="#626d83" dimColor>W / S also   •   Q  quit</Text>
    </Box>
  );
}

function SmallScreenNotice({
  width,
  height,
}: {
  width: number;
  height: number;
}): React.ReactElement {
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" paddingY={2}>
      <Box
        width={Math.min(Math.max(width - 2, 30), 58)}
        borderStyle="double"
        borderColor="#ffd84d"
        paddingX={2}
        paddingY={1}
        flexDirection="column"
        alignItems="center"
      >
        <Text color="#ffd84d" bold>⚠ SCREEN TOO SMALL</Text>
        <Text color="#c0c7d6">Please resize the terminal window.</Text>
        <Text color="#55e27a" bold>Use a larger screen for Tetris.</Text>
        <Box marginTop={1} flexDirection="column" alignItems="center">
          <Text color="#7f8caa">Recommended: at least {MIN_MENU_WIDTH} columns</Text>
          <Text color="#7f8caa">and {MIN_MENU_HEIGHT} rows</Text>
          <Text color="#626d83">Current: {width} × {height}</Text>
        </Box>
      </Box>
    </Box>
  );
}

export function MainMenuApp({
  state,
  onSelect,
  registerInput,
}: {
  state: MenuState;
  onSelect: (id: MenuOptionId) => void;
  registerInput: (handler: KeyboardActionHandler) => void;
}): React.ReactElement {
  const { stdout } = useStdout();
  const [selectedIndex, setSelectedIndex] = useState(state.getSelectedIndex());
  const [, forceResize] = useState(0);

  useEffect(() => {
    const onResize = () => forceResize((value) => value + 1);
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  useEffect(() => {
    const handleInput = (action: KeyboardAction): void => {
      if (action === 'UP') {
        state.moveUp();
        setSelectedIndex(state.getSelectedIndex());
        return;
      }

      if (action === 'DOWN') {
        state.moveDown();
        setSelectedIndex(state.getSelectedIndex());
        return;
      }

      if (action === 'CONFIRM') {
        onSelect(state.getSelectedOption().id);
        return;
      }

      if (action === 'QUIT') onSelect('exit');
    };

    registerInput(handleInput);
    return () => registerInput(() => {});
  }, [onSelect, registerInput, state]);

  const options = state.options;
  const selectedId = options[selectedIndex]?.id;
  const columns = stdout.columns || 80;
  const rows = stdout.rows || 30;

  if (columns < MIN_MENU_WIDTH || rows < MIN_MENU_HEIGHT) {
    return <SmallScreenNotice width={columns} height={rows} />;
  }

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
            {'─'.repeat(PANEL_WIDTH - 6)}
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
  registerInput,
}: {
  data: SaveData | null;
  onBack: () => void;
  registerInput: (handler: KeyboardActionHandler) => void;
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

  const columns = stdout.columns || 80;
  const rows = stdout.rows || 30;

  useEffect(() => {
    const handleInput = (action: KeyboardAction): void => {
      if (action === 'QUIT' || action === 'CONFIRM') onBack();
    };

    registerInput(handleInput);
    return () => registerInput(() => {});
  }, [onBack, registerInput]);

  if (columns < MIN_MENU_WIDTH || rows < MIN_MENU_HEIGHT) {
    return <SmallScreenNotice width={columns} height={rows} />;
  }

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
  let inputHandler: KeyboardActionHandler = () => {};
  const keyboard = new KeyboardInput();

  instance = render(
    <MainMenuApp
      state={state}
      registerInput={(handler) => {
        inputHandler = handler;
      }}
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
  keyboard.start((action) => inputHandler(action), 'menu');

  try {
    await instance.waitUntilExit();
  } finally {
    keyboard.stop();
  }
  return result;
}

export async function runInkHighScore(data: SaveData | null): Promise<void> {
  let instance: ReturnType<typeof render> | undefined;
  let inputHandler: KeyboardActionHandler = () => {};
  const keyboard = new KeyboardInput();

  instance = render(
    <HighScoreApp
      data={data}
      registerInput={(handler) => {
        inputHandler = handler;
      }}
      onBack={() => instance?.unmount()}
    />,
    {
      alternateScreen: true,
      exitOnCtrlC: true,
    },
  );
  keyboard.start((action) => inputHandler(action), 'menu');

  try {
    await instance.waitUntilExit();
  } finally {
    keyboard.stop();
  }
}
