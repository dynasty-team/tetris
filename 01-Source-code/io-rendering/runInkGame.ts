// 01-Source-code/io-rendering/runInkGame.ts
//
// ประกอบ GameStateLoop + InkGameRenderer โดยให้ Ink เป็นผู้รับ keyboard input
// จึงไม่เกิดการอ่าน stdin ซ้อนกันระหว่าง Ink กับ KeyboardInput

import { GameStateLoop } from '../game-state-loop';
import { TetrisEngine } from '../core-engine';
import { loadGame, saveGame } from '../persistence';
import { createInkGameRenderer } from './InkGameRenderer';

export async function runInkGame(): Promise<void> {
  const engine = new TetrisEngine();

  // เตรียมชิ้นแรกไว้ก่อน mount UI เพื่อให้เฟรมแรกไม่แสดง placeholder
  engine.spawnNextPiece();
  const initialSnapshot = engine.getRenderSnapshot();

  let gameLoop: GameStateLoop | undefined;

  const renderer = createInkGameRenderer(initialSnapshot, (action) => {
    gameLoop?.handleAction(action);
  });

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

  await renderer.waitForExit();

  if (gameLoop.isRunning()) {
    gameLoop.stop();
  }

  renderer.unmount();
}
