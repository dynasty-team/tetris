// 01-Source-code/io-rendering/runInkGame.ts
//
// ประกอบ GameStateLoop + InkGameRenderer โดยให้ KeyboardInput เป็นผู้รับ keyboard input

import { GameStateLoop } from '../game-state-loop';
import { TetrisEngine } from '../core-engine';
import { loadGame, saveGame } from '../persistence';
import { createInkGameRenderer } from './InkGameRenderer';
import { KeyboardInput } from './KeyboardInput';

export async function runInkGame(): Promise<void> {
  const engine = new TetrisEngine();

  // เตรียมชิ้นแรกไว้ก่อน mount UI เพื่อให้เฟรมแรกไม่แสดง placeholder
  engine.spawnNextPiece();
  const initialSnapshot = engine.getRenderSnapshot();

  let gameLoop: GameStateLoop | undefined;
  const keyboard = new KeyboardInput();

  const renderer = createInkGameRenderer(initialSnapshot);
  keyboard.start((action) => {
    const status = gameLoop?.getEngine().getRenderSnapshot().status;
    if (action === 'CONFIRM' || (action === 'HARD_DROP' && status === 'gameover')) {
      if (status === 'gameover') renderer.exit();
      return;
    }
    if (action === 'UP' || action === 'DOWN') return;
    gameLoop?.handleAction(action);
  }, 'game');

  gameLoop = new GameStateLoop({
    engine,
    renderer: (snapshot) => renderer.render(snapshot),
    onSave: saveGame,
    onLoad: loadGame,
    onEnd: (reason) => {
      // Quit จบ flow ทันที ส่วน Game Over ให้ UI ค้างไว้รอ Enter/Space/Esc
      if (reason === 'quit') {
        renderer.exit();
      }
    },
  });

  gameLoop.start();

  try {
    await renderer.waitForExit();

    if (gameLoop.isRunning()) {
      gameLoop.stop();
    }
  } finally {
    keyboard.stop();
    renderer.unmount();
  }
}
