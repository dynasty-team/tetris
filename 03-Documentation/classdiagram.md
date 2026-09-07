## Diagram

```mermaid
classDiagram
    %% ================= Board =================
    class IBoard {
        <<interface>>
        +isValidPosition(shape, position)
boolean
        +lockPiece(shape, position)
void
        +clearFullLines()
number
        +getGrid()
CellState[][]
    }

    class Board {
        -width: number
        -height: number
        -grid: CellState[][]
        +isValidPosition(shape, position)
boolean
        +lockPiece(shape, position)
void
        +clearFullLines()
number
        +getGrid()
CellState[][]
    }

    class CellState {
        <<enumeration>>
        Empty
        Occupied
    }

    %% ================= Tetromino =================
    class ITetromino {
        <<interface>>
        +getShape()
Shape
        +getPosition()
Position
        +rotate()
ITetromino
        +moveBy(dx, dy)
ITetromino
    }

    class Tetromino {
        -type: TetrominoType
        -shape: Shape
        -position: Position
        -rotationState: number
        +getShape()
Shape
        +getPosition()
Position
        +rotate()
ITetromino
        +moveBy(dx, dy)
ITetromino
    }

    class TetrominoType {
        <<enumeration>>
        I
        O
        T
        S
        Z
        J
        L
    }

    %% ================= Input / Controls =================
    class PlayerAction {
        <<enumeration>>
        MoveLeft
        MoveRight
        SoftDrop
        Rotate
        HardDrop
        Quit
    }

    class IInputHandler {
        <<interface>>
        +onAction(callback)
void
    }

    class KeyboardInputHandler {
        +onAction(callback)
void
    }

    %% ================= Score / Level =================
    class ScoreManager {
        -score: number
        -level: number
        -linesCleared: number
        +addClearedLines(count)
void
        +getScore()
number
        +getLevel()
number
        +getDropInterval()
number
    }

    %% ================= Game (Core Controller) =================
    class Game {
        -board: IBoard
        -currentPiece: ITetromino
        -scoreManager: ScoreManager
        -isGameOver: boolean
        +start()
void
        +handleAction(action)
void
        +tick()
void
        +spawnNextPiece()
void
        +getState()
GameState
    }

    class GameState {
        +board: CellState[][]
        +currentPiece: ITetromino
        +score: number
        +level: number
        +isGameOver: boolean
    }

    %% ================= Renderer =================
    class IRenderer {
        <<interface>>
        +render(state: GameState)
void
    }

    class ConsoleRenderer {
        +render(state: GameState)
void
    }

    %% ================= Persistence =================
    class IPersistence {
        <<interface>>
        +save(data)
void
        +load()
PersistedData
    }

    class JsonStorage {
        -filePath: string
        +save(data)
void
        +load()
PersistedData
    }

    %% ================= Relationships =================
    Board ..|> ITetromino : s23
    KeyboardInputHandler ..|> IRenderer : s24
    JsonStorage ..|> IPersistence

    Board --> CellState
    Tetromino --> TetrominoType
    KeyboardInputHandler --> PlayerAction

    Game --> IBoard : uses
    Game --> ITetromino : uses
    Game --> ScoreManager : uses
    Game --> IPersistence : save/load
    Game --> IRenderer : render state
    Game ..> GameState : produces
    IInputHandler --> PlayerAction : emits
    ```
