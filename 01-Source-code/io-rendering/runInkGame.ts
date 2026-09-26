// 01-Source-code/io-rendering/runInkGame.ts
//
// ประกอบ GameStateLoop + InkGameRenderer โดยให้ KeyboardInput เป็นผู้รับ keyboard input

import { GameStateLoop } from '../game-state-loop';
import { TetrisEngine } from '../core-engine';
import { loadGame, saveGame } from '../persistence';
import { createInkGameRenderer } from './InkGameRenderer';
import { KeyboardInput } from './KeyboardInput';

export async function runInkGame(keyboard: KeyboardInput = new KeyboardInput()): Promise<void> {
  const engine = new TetrisEngine();
  engine.spawnNextPiece();
  const initialSnapshot = engine.getRenderSnapshot();

  let gameLoop: GameStateLoop | undefined;
  let gameOverVisible = false;
  let exiting = false;
  const renderer = createInkGameRenderer(initialSnapshot);

  const exitToMenu = (): void => {
    if (exiting) return;
    exiting = true;
    // ตัด listener ก่อนปล่อย Ink เพื่อไม่ให้คีย์ชุดเดียวกันวิ่งข้ามหน้า
    keyboard.stop();
    renderer.exit();
  };

  keyboard.start((action) => {
    // Game Over เป็นหน้าจอ UI แยกจาก game loop แล้ว แต่ KeyboardInput ต้องยังรับคีย์อยู่
    if (gameOverVisible) {
      if (action === 'QUIT' || action === 'CONFIRM' || action === 'HARD_DROP') {
        exitToMenu();
      }
      return;
    }

    if (action === 'UP' || action === 'DOWN' || action === 'CONFIRM') return;
    gameLoop?.handleAction(action);
  }, 'game');

  gameLoop = new GameStateLoop({
    engine,
    input: keyboard,
    renderer: (snapshot) => renderer.render(snapshot),
    onSave: saveGame,
    onLoad: loadGame,
    onEnd: (reason) => {
      if (reason === 'gameover') {
        gameOverVisible = true;
        return;
      }

      if (reason === 'quit') {
        exitToMenu();
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
    // หยุด listener ของหน้าเกม แต่ไม่คืน terminal ระหว่าง Game -> Menu
    keyboard.stop();
    renderer.unmount();
  }
}
