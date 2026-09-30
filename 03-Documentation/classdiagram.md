Mermaid
```
classDiagram
    direction LR

    class CoreEngine {
        <<interface>>
        +moveLeft(): ActionResult
        +moveRight(): ActionResult
        +softDrop(): ActionResult
        +rotate(): ActionResult
        +hardDrop(): ActionResult
        +tick(): ActionResult
        +spawnNextPiece(): ActionResult
        +getActivePiece(): ActivePiece | null
        +setLockCallback(callback): void
        +pauseLockTimer(): boolean
        +resumeLockTimer(): void
        +getRenderSnapshot(): RenderSnapshot
        +getScore(): number
        +getLevel(): number
        +getHighScore(): number
        +setHighScore(highScore: number): void
        +addScore(points: number): void
        +setLevel(level: number): void
        +getLinesClearedTotal(): number
        +isGameOver(): boolean
    }

    class TetrisEngine {
        -state: MovementState
        -randomizer: SevenBagRandomizer
        +moveLeft(): ActionResult
        +moveRight(): ActionResult
        +softDrop(): ActionResult
        +rotate(): ActionResult
        +hardDrop(): ActionResult
        +tick(): ActionResult
        +spawnNextPiece(): ActionResult
        +getActivePiece(): ActivePiece | null
        +getRenderSnapshot(): RenderSnapshot
        +getScore(): number
        +getLevel(): number
        +getHighScore(): number
        +setHighScore(highScore: number): void
        +addScore(points: number): void
        +setLevel(level: number): void
        +getLinesClearedTotal(): number
        +isGameOver(): boolean
        +setLockCallback(callback): void
        +pauseLockTimer(): boolean
        +resumeLockTimer(): void
    }

    class SevenBagRandomizer {
        -bag: TetrominoType[]
        -shuffleFn: Function
        +next(): TetrominoType
    }

    class ActivePiece {
        <<interface>>
        +type: TetrominoType
        +position: Position
        +rotation: RotationState
        +shape: number[][]
    }

    class RenderSnapshot {
        <<interface>>
        +board: Board
        +activePiece: ActivePiece
        +nextPiece: TetrominoType
        +score: number
        +level: number
        +highScore: number
        +linesClearedTotal: number
        +status: GameStatus
        +isLocking: boolean
    }

    class InputSource {
        <<interface>>
        +start(onAction: ActionHandler): void
        +stop(): void
    }

    class KeyboardInput {
        -input: InputStream
        -started: boolean
        +start(onAction: ActionHandler): void
        +stop(): void
    }

    class GameStateLoop {
        -engine: CoreEngine
        -renderer: Function
        -input: InputSource
        -running: boolean
        -paused: boolean
        +start(): Promise~void~
        +stop(): void
        +pause(): void
        +resume(): void
        +togglePause(): void
        +isRunning(): boolean
        +isPaused(): boolean
        +getEngine(): CoreEngine
        +handleAction(action: GameAction): void
        +tick(): ActionResult
        +triggerSave(): Promise~void~
        +loadGame(): Promise~SaveData | null~
    }

    class Persistence {
        <<module>>
        +saveGame(data: SaveData): Promise~void~
        +loadGame(): Promise~SaveData | null~
        +validateSaveData(data: unknown): boolean
    }

    class ConsoleRenderer {
        <<React + Ink module>>
        +render(snapshot: RenderSnapshot): void
        +unmountRenderer(): void
    }

    class App {
        <<React component>>
        +snapshot: RenderSnapshot
    }

    class GameUI {
        <<React component>>
        +snapshot: RenderSnapshot
    }

    CoreEngine <|.. TetrisEngine : implements
    InputSource <|.. KeyboardInput : implements

    GameStateLoop --> CoreEngine : controls
    GameStateLoop --> InputSource : input
    GameStateLoop --> Persistence : save/load
    GameStateLoop --> ConsoleRenderer : render

    TetrisEngine --> SevenBagRandomizer : uses
    TetrisEngine --> ActivePiece : manages
    TetrisEngine --> RenderSnapshot : creates

    ConsoleRenderer --> App : renders
    App --> GameUI : displays
    GameUI --> RenderSnapshot : reads
```
