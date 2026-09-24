import { GameStateLoop } from '../game-state-loop';
import { TetrisEngine } from '../core-engine';
import { loadGame, saveGame } from '../persistence';
import { createInkGameRenderer } from './InkGameRenderer';

export async function runInkGame(): Promise<void> {
  const engine = new TetrisEngine();

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