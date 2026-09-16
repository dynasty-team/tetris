mermaid
```
classDiagram
    direction LR

    %% =====================
    %% Shared Types
    %% =====================

    class Board {
        <<type>>
        CellValue[][]
    }

    class Position {
        <<interface>>
        +x : number
        +y : number
    }

    class ActivePiece {
        <<interface>>
        +type : TetrominoType
        +position : Position
        +rotation : RotationState
        +shape : number[][]
    }

    class ActionResult {
        <<interface>>
        +success : boolean
        +linesCleared : number[]
        +gameOver : boolean
    }

    class RenderSnapshot {
        <<interface>>
        +board : Board
        +activePiece : ActivePiece
        +nextPiece : TetrominoType
        +score : number
        +level : number
        +linesClearedTotal : number
        +status : GameStatus
        +isLocking : boolean
    }

    class SaveData {
        <<interface>>
        +version : number
        +highScore : number
        +level : number
        +linesCleared : number
        +timestamp : string
    }

    class CoreEngine {
        <<interface>>
        +moveLeft() : ActionResult
        +moveRight() : ActionResult
        +softDrop() : ActionResult
        +rotate() : ActionResult
        +hardDrop() : ActionResult
        +tick() : ActionResult
        +spawnNextPiece() : ActionResult
        +getRenderSnapshot() : RenderSnapshot
        +getScore() : number
        +getLevel() : number
        +isGameOver() : boolean
        +addScore(points : number) : void
        +setLevel(level : number) : void
        +getLinesClearedTotal() : number
    }

    %% =====================
    %% Core Engine
    %% =====================

    class MovementState {
        <<interface>>
        +board : Board
        +activePiece : ActivePiece?
        +isLocking : boolean
        +lockResets : number
        +gameOver : boolean
        +nextPiece : TetrominoType?
        +linesClearedTotal : number
    }

    class MovementResult {
        <<interface>>
        +state : MovementState
    }

    class LineClearResult {
        <<interface>>
        +newBoard : Board
        +linesCleared : number
        +clearedLines : number[]
    }

    class TetrisEngine {
        +board : Board
        +activePiece : ActivePiece?
        -score : number
        -level : number
        +linesClearedTotal : number
        +nextPiece : TetrominoType?
        +gameOver : boolean
        +isLocking : boolean
        +lockResets : number
        -randomizer : SevenBagRandomizer

        +moveLeft() : ActionResult
        +moveRight() : ActionResult
        +softDrop() : ActionResult
        +rotate() : ActionResult
        +hardDrop() : ActionResult
        +tick() : ActionResult
        +lockPiece() : ActionResult
        +spawnNextPiece() : ActionResult
        +getRenderSnapshot() : RenderSnapshot
        +getScore() : number
        +getLevel() : number
        +addScore(points : number) : void
        +setLevel(level : number) : void
        +getLinesClearedTotal() : number
        +isGameOver() : boolean
    }

    class SevenBagRandomizer {
        -bag : TetrominoType[]
        -shuffleFn : Function
        +remainingInBag : number

        +next() : TetrominoType
        +peek() : TetrominoType
        +peekQueue(count : number) : TetrominoType[]
        +reset() : void
    }

    class Movement {
        <<module>>
        +moveLeft(state) : MovementResult
        +moveRight(state) : MovementResult
        +softDrop(state) : MovementResult
        +rotate(state) : MovementResult
        +hardDrop(state) : MovementResult
        +tick(state) : MovementResult
        +performLock(state) : ActionResult
        +isPieceOnGround(board, piece) : boolean
        +lockPieceToBoard(board, piece) : Board
    }

    class Collision {
        <<module>>
        +checkCollision(board, piece) : boolean
    }

    class LineClear {
        <<module>>
        +checkAndClearLines(board) : LineClearResult
    }

    class LockPipeline {
        <<module>>
        +lockActivePieceToBoardStep(state)
        +clearFullLinesStep(state)
        +spawnNextPieceStep(state)
        +applyLock(state)
    }

    class TetrominoShapes {
        <<module>>
        +getShape(type, rotation) : number[][]
        +rotatePiece(piece) : ActivePiece
    }

    class WallKickData {
        <<module>>
        +getWallKickOffsets(type, rotation) : Offset[]
    }

    %% =====================
    %% Game State Loop
    %% =====================

    class GameStateLoopOptions {
        <<interface>>
        +engine : CoreEngine
        +renderer : Function
        +input : KeyboardInput
        +onSave : Function
        +saveFilePath : string
    }

    class GameStateLoop {
        -engine : CoreEngine
        -renderer : Function
        -input : KeyboardInput
        -onSave : Function
        -running : boolean
        -paused : boolean
        -isGameOverState : boolean
        -saveTriggered : boolean

        +start() : void
        +stop() : void
        +pause() : void
        +resume() : void
        +togglePause() : void
        +isRunning() : boolean
        +isPaused() : boolean
        +getEngine() : CoreEngine
        +handleAction(action : GameAction) : void
        +tick() : ActionResult
        +triggerSave() : void
    }

    class ScoreLevel {
        <<module>>
        +calculateScore(linesCleared, level) : number
        +getScoreFromActionResult(result, level) : number
        +calculateLevel(totalLinesCleared) : number
        +getSpeedForLevel(level) : number
    }

    %% =====================
    %% Input / Rendering
    %% =====================

    class KeyboardInputOptions {
        <<interface>>
        +input : InputStream
        +terminal : TerminalRawMode
    }

    class TerminalRawMode {
        <<interface>>
        +isTTY : boolean
        +setRawMode(mode : boolean) : void
    }

    class InputReader {
        <<interface>>
        +read() : Promise
        +cancel() : Promise
    }

    class InputStream {
        <<interface>>
        +stream()
    }

    class KeyboardInput {
        -input : InputStream
        -terminal : TerminalRawMode
        -onAction : ActionHandler
        -reader : InputReader
        -escapeSequence : string
        -started : boolean

        +start(onAction : ActionHandler) : void
        +release() : void
        +stop() : void
    }

    class ConsoleRenderer {
        <<module>>
        +render(snapshot : RenderSnapshot) : void
    }

    %% =====================
    %% Persistence
    %% =====================

    class SaveManager {
        -filePath : string

        +save(data : SaveData) : void
        +load() : SaveData?
        +saveGame(data, filePath) : void
        +loadGame(filePath) : SaveData?
    }

    class Persistence {
        <<module>>
        +saveGame(data : SaveData) : void
        +loadGame() : SaveData?
        +validateSaveData(data : unknown) : boolean
    }

    %% =====================
    %% Shared Utility Modules
    %% =====================

    class BoardUtils {
        <<module>>
        +createEmptyBoard() : Board
        +getCell(board, x, y) : CellValue
        +setCell(board, x, y, value) : Board
        +isInBounds(x, y) : boolean
    }

    class SharedUtils {
        <<module>>
        +pipe(functions) : Function
        +shuffle(items) : Array
    }

    class SharedConstants {
        <<module>>
        +LOCK_DELAY_MS : 500
        +MAX_LOCK_RESETS : 15
        +DAS_MS : 170
        +ARR_MS : 50
        +BAG_SIZE : 7
        +BOARD_WIDTH : 10
        +BOARD_HEIGHT : 20
    }

    %% =====================
    %% Relationships
    %% =====================

    CoreEngine <|.. TetrisEngine : implements
    MovementState <|.. TetrisEngine : implements
    ActionResult <|-- MovementResult : extends

    ActivePiece --> Position : has
    TetrisEngine --> Board : stores
    TetrisEngine --> ActivePiece : manages
    TetrisEngine --> SevenBagRandomizer : uses
    TetrisEngine --> RenderSnapshot : creates

    RenderSnapshot --> Board : contains
    RenderSnapshot --> ActivePiece : contains

    TetrisEngine ..> Movement : delegates
    TetrisEngine ..> Collision : uses
    TetrisEngine ..> TetrominoShapes : uses

    Movement --> MovementState : updates
    Movement ..> Collision : checks
    Movement ..> WallKickData : uses
    Movement ..> TetrominoShapes : rotates
    Movement ..> LockPipeline : locks

    LockPipeline ..> LineClear : clears
    LockPipeline ..> SharedUtils : pipe

    SevenBagRandomizer ..> SharedUtils : shuffle

    GameStateLoop ..> GameStateLoopOptions : configured by
    GameStateLoop --> CoreEngine : controls
    KeyboardInput --> GameStateLoop : sends actions
    GameStateLoop ..> ScoreLevel : calculates score and level
    GameStateLoop --> ConsoleRenderer : uses
    GameStateLoop --> Persistence : saves game

    ConsoleRenderer --> RenderSnapshot : renders
    ConsoleRenderer ..> Persistence : loads high score

    KeyboardInput ..> KeyboardInputOptions : configured by
    KeyboardInput --> InputStream : reads
    KeyboardInput --> InputReader : uses
    KeyboardInput --> TerminalRawMode : raw mode

    SaveManager --> SaveData : saves and loads
    SaveManager ..> Persistence : delegates

    BoardUtils --> Board : manages
    Movement ..> SharedConstants : lock settings
    BoardUtils ..> SharedConstants : board size

```