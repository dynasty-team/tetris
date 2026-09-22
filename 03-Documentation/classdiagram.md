mermaid
```classDiagram
    direction LR

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

    class TetrisEngine {
        +board : Board
        +activePiece : ActivePiece
        -score : number
        -level : number
        +linesClearedTotal : number
        +nextPiece : TetrominoType
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

    class ActivePiece {
        <<interface>>
        +type : TetrominoType
        +position : Position
        +rotation : RotationState
        +shape : number[][]
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

    class InputSource {
        <<interface>>
        +start(onAction : ActionHandler) : void
        +stop() : void
    }

    class GameStateLoop {
        -engine : CoreEngine
        -renderer : Function
        -input : InputSource
        -running : boolean
        -paused : boolean
        -isGameOverState : boolean
        -timer : Timer

        +start() : void
        +stop() : void
        +pause() : void
        +resume() : void
        +togglePause() : void
        +handleAction(action : GameAction) : void
        +tick() : ActionResult
        +triggerSave() : void
    }

    class KeyboardInput {
        -onAction : ActionHandler
        -started : boolean
        -escapeSequence : string

        +start(onAction : ActionHandler) : void
        +stop() : void
        +release() : void
    }

    class Persistence {
        <<module>>
        +saveGame(data : SaveData) : void
        +loadGame() : SaveData | null
        +validateSaveData(data : unknown) : boolean
    }

    class ConsoleRenderer {
        <<module>>
        +render(snapshot : RenderSnapshot) : void
    }

    CoreEngine <|.. TetrisEngine : implements
    InputSource <|.. KeyboardInput : implements

    GameStateLoop --> CoreEngine : controls
    GameStateLoop --> InputSource : depends on

    TetrisEngine --> SevenBagRandomizer : uses
    TetrisEngine --> ActivePiece : manages
    TetrisEngine --> RenderSnapshot : creates

    GameStateLoop --> Persistence : saves game
    GameStateLoop --> ConsoleRenderer : renders via

    ConsoleRenderer --> RenderSnapshot : renders
    ConsoleRenderer --> Persistence : loads high score

```