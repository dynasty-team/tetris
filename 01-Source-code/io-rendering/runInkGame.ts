// 01-Source-code/io-rendering/runInkGame.ts
//
// ประกอบ GameStateLoop + KeyboardInput + InkGameRenderer
// โดยให้ KeyboardInput เป็นผู้รับ stdin เพียงตัวเดียว

import { GameStateLoop } from '../game-state-loop';
import { TetrisEngine } from '../core-engine';
import { loadGame, saveGame } from '../persistence';
import { createInkGameRenderer } from './InkGameRenderer';
import { KeyboardInput } from './KeyboardInput';
import type { GameAction } from '../shared/types';

export async function runInkGame(): Promise<void> {
  const engine = new TetrisEngine();

  // เตรียมชิ้นแรกไว้ก่อน mount UI เพื่อให้เฟรมแรกไม่แสดง placeholder
  engine.spawnNextPiece();
  const initialSnapshot = engine.getRenderSnapshot();

  let gameLoop: GameStateLoop | undefined;

  const keyboard = new KeyboardInput();
  const renderer = createInkGameRenderer(initialSnapshot);
  const input = {
    start(onAction: (action: GameAction) => void): void {
      keyboard.start((action) => {
        if (gameLoop && !gameLoop.isRunning()) {
          renderer.exit();
          return;
        }

        onAction(action);
      });
    },
    stop(): void {
      keyboard.stop();
    },
  };

  gameLoop = new GameStateLoop({
    engine,
    input,
    renderer: (snapshot) => renderer.render(snapshot),
    onSave: saveGame,
    onLoad: loadGame,
    onEnd: (reason) => {
      // Quit จบ flow ทันที ส่วน Game Over ให้ UI ค้างไว้รอ action ถัดไป
      if (reason === 'quit') {
        renderer.exit();
      }
    },
  });

  gameLoop.start();

  await renderer.waitForExit();

  keyboard.stop();
  if (gameLoop.isRunning()) {
    gameLoop.stop();
  }

  renderer.unmount();
}
