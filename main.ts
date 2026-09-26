import { runInkHighScore } from './01-Source-code/io-rendering/InkMenuRenderer';
import { runInkGame } from './01-Source-code/io-rendering/runInkGame';
import { runMainMenu } from './01-Source-code/menu/runMainMenu';
import { KeyboardInput } from './01-Source-code/io-rendering/KeyboardInput';
import { loadGame } from './01-Source-code/persistence';

function cleanupTerminal(): void {
  // Final safety net: คืน terminal state ก่อน process จบเสมอ
  try {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  } catch {
    // บาง environment ไม่มี TTY หรือไม่อนุญาตให้เปลี่ยน raw mode
  }

  try {
    process.stdin.pause();
    process.stdin.unref?.();
  } catch {
    // ไม่ให้ cleanup ทำให้โปรแกรมปิดไม่ลง
  }

  try {
    if (!process.stdout.destroyed && !process.stdout.writableEnded) {
      process.stdout.write('\x1b[0m\x1b[?25h');
    }
  } catch {
    // stdout อาจถูกปิดไปแล้ว
  }
}


let terminalShutdownStarted = false;

function installSignalCleanup(): void {
  const shutdown = (exitCode: number): void => {
    if (terminalShutdownStarted) return;
    terminalShutdownStarted = true;
    cleanupTerminal();
    process.exit(exitCode);
  };

  process.once('SIGINT', () => shutdown(130));
  process.once('SIGTERM', () => shutdown(143));
}

async function main(): Promise<void> {
  installSignalCleanup();
  const keyboard = new KeyboardInput();

  try {
    while (true) {
      const menuOption = await runMainMenu(keyboard);

      if (menuOption === 'exit') {
        return;
      }

      if (menuOption === 'highscore') {
        await runInkHighScore(loadGame(), keyboard);
        continue;
      }

      await runInkGame(keyboard);
    }
  } finally {
    keyboard.release();
    cleanupTerminal();
  }
}

void main().catch((error) => {
  cleanupTerminal();
  console.error(error);
  process.exitCode = 1;
});
