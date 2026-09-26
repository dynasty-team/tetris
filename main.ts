import { inspect } from 'bun';
import { TetrisEngine } from './01-Source-code/core-engine';
import { GameStateLoop } from './01-Source-code/game-state-loop';
import { render, KeyboardInput } from './01-Source-code/io-rendering'
import { loadGame, saveGame } from './01-Source-code/persistence';

async function main(): Promise<void> {
  const engine = new TetrisEngine()
  const input = new KeyboardInput()
  const gameLoop = new GameStateLoop({
    engine,
    input,
    renderer: render,
    onSave: saveGame,
    onLoad: loadGame
  })
  gameLoop.start()
}

void main();
