import { useState, useCallback } from "react";
import config from './config';
import CheckersBoard from "./components/CheckersBoard";
import Controls from "./components/Controls";
import "./App.css";

/*
 * The app stores pieces as the same one-character symbols that the solver API
 * understands: lowercase pieces are men, uppercase pieces are kings, and the
 * letter itself identifies the owner. These small helpers keep that encoding
 * readable everywhere else in the file.
 */
const PLAYER_LABELS = {
  b: "Black",
  w: "White",
};

const SOLVER_DEPTH = 12;

const opponentOf = (color) => (color === "w" ? "b" : "w");

const getPieceColor = (piece) => {
  if (!piece) {
    return null;
  }

  return piece.toLowerCase();
};

const isKingPiece = (piece) => piece === "B" || piece === "W";

const isInsideBoard = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

const cloneBoard = (sourceBoard) => sourceBoard.map((row) => [...row]);

/*
 * Boards are represented as an 8 by 8 matrix. The UI uses row and column
 * indexes because that is convenient for canvas drawing, while the public
 * notation shown to humans is derived later from those coordinates.
 */
const createEmptyBoard = () => {
  return Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
};

/*
 * A new board starts from the standard checkers opening position. Only dark
 * squares are playable, so the initialization loop skips light squares and
 * fills the first three and last three playable rows.
 */
const createInitialBoard = () => {
  const board = createEmptyBoard();

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const isDarkSquare = (row + col) % 2 === 1;
      if (!isDarkSquare) {
        continue;
      }

      if (row < 3) {
        board[row][col] = "b";
      } else if (row > 4) {
        board[row][col] = "w";
      }
    }
  }

  return board;
};

/*
 * User-facing messages use compact board notation such as c3-d4. This helper
 * translates internal matrix coordinates into that notation whenever a move is
 * displayed in the message area.
 */
const coordsToNotation = ([row, col]) => {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = 8 - row;
  return `${file}${rank}`;
};

/*
 * The solver receives a text board rather than the React matrix. Empty dark
 * squares are '.', light squares are '_', and occupied squares keep the piece
 * symbol already stored in state.
 */
const serializeBoard = (sourceBoard) => {
  return sourceBoard
    .map((row, rowIdx) => {
      return row
        .map((cell, colIdx) => {
          const isDarkSquare = (rowIdx + colIdx) % 2 === 1;
          return cell || (isDarkSquare ? "." : "_");
        })
        .join("");
    })
    .join("\n");
};

/*
 * Solver moves and locally generated moves share the same shape. Formatting
 * stays in one place so solve results, human moves, and opponent replies are
 * presented consistently.
 */
const formatMove = (move) => {
  if (!move) {
    return "";
  }

  const separator = move.isCapture ? ":" : "-";
  let notation = coordsToNotation(move.start);
  for (const step of move.seq) {
    notation += separator + coordsToNotation(step);
  }
  return notation;
};

/*
 * Promotion is applied after a move finishes. White moves toward row 0 and
 * black moves toward row 7, so reaching that far edge turns a man into a king.
 */
const promotePiece = (piece, row) => {
  if (piece === "w" && row === 0) {
    return "W";
  }

  if (piece === "b" && row === 7) {
    return "B";
  }

  return piece;
};

/*
 * Captures are represented by a start square and one or more landing squares.
 * To update the board, we scan the diagonal between the previous square and the
 * landing square and remove the first opposing piece found there.
 */
const findCapturedSquare = (sourceBoard, from, to, movingColor) => {
  const rowStep = Math.sign(to[0] - from[0]);
  const colStep = Math.sign(to[1] - from[1]);
  let row = from[0] + rowStep;
  let col = from[1] + colStep;

  while (row !== to[0] && col !== to[1]) {
    const piece = sourceBoard[row][col];
    if (piece && getPieceColor(piece) !== movingColor) {
      return [row, col];
    }

    row += rowStep;
    col += colStep;
  }

  return null;
};

/*
 * Applying a move is deliberately pure from React's point of view: clone the
 * board, remove the moving piece from its origin, remove each captured piece as
 * the move path advances, then place the promoted-or-original piece at the end.
 */
const applyMoveToBoard = (sourceBoard, move) => {
  if (!move || !move.start || !Array.isArray(move.seq) || move.seq.length === 0) {
    return sourceBoard;
  }

  const newBoard = cloneBoard(sourceBoard);
  let [fromRow, fromCol] = move.start;
  let piece = newBoard[fromRow]?.[fromCol];

  if (!piece) {
    return sourceBoard;
  }

  const movingColor = getPieceColor(piece);
  newBoard[fromRow][fromCol] = null;

  for (const [toRow, toCol] of move.seq) {
    if (Math.abs(toRow - fromRow) > 1) {
      const capturedSquare = findCapturedSquare(
        newBoard,
        [fromRow, fromCol],
        [toRow, toCol],
        movingColor
      );

      if (capturedSquare) {
        newBoard[capturedSquare[0]][capturedSquare[1]] = null;
      }
    }

    fromRow = toRow;
    fromCol = toCol;
  }

  newBoard[fromRow][fromCol] = promotePiece(piece, fromRow);
  return newBoard;
};

/*
 * Local move generation produces the same object shape as the API. That lets
 * the click handler treat human moves and solver moves with the same formatter
 * and board applier.
 */
const buildMove = (start, seq, isCapture) => ({
  start,
  seq,
  isCapture,
});

/*
 * The solver returns row coordinates from the opposite side of the board.
 * Normalize them once at the API boundary so the rest of the app can keep using
 * UI-oriented matrix coordinates.
 */
const convertSolverMove = (move) => {
  if (!move || !Array.isArray(move.start) || !Array.isArray(move.seq)) {
    return move;
  }

  return {
    ...move,
    start: [7 - move.start[0], move.start[1]],
    seq: move.seq.map(([row, col]) => [7 - row, col]),
  };
};

/*
 * Non-capturing moves are simple diagonal slides. Men move only forward, while
 * kings can fly along any clear diagonal until another piece blocks the ray.
 */
const getSimpleMovesForPiece = (sourceBoard, row, col) => {
  const piece = sourceBoard[row][col];
  if (!piece) {
    return [];
  }

  const color = getPieceColor(piece);
  const directions = isKingPiece(piece)
    ? [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ]
    : color === "w"
      ? [
          [-1, -1],
          [-1, 1],
        ]
      : [
          [1, -1],
          [1, 1],
        ];

  const moves = [];

  for (const [rowDelta, colDelta] of directions) {
    let toRow = row + rowDelta;
    let toCol = col + colDelta;

    while (isInsideBoard(toRow, toCol) && !sourceBoard[toRow][toCol]) {
      moves.push(buildMove([row, col], [[toRow, toCol]], false));

      if (!isKingPiece(piece)) {
        break;
      }

      toRow += rowDelta;
      toCol += colDelta;
    }
  }

  return moves;
};

/*
 * Captures can branch, especially when a piece can continue jumping after the
 * first capture. This recursive generator explores each possible capture path
 * by making a temporary board for the partial move and asking what captures
 * remain from the new landing square.
 */
const getCaptureMovesForPiece = (sourceBoard, row, col, start = [row, col], seq = []) => {
  const piece = sourceBoard[row][col];
  if (!piece) {
    return [];
  }

  const color = getPieceColor(piece);
  const directions = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  const moves = [];

  for (const [rowDelta, colDelta] of directions) {
    if (isKingPiece(piece)) {
      let scanRow = row + rowDelta;
      let scanCol = col + colDelta;
      let capturedSquare = null;

      while (isInsideBoard(scanRow, scanCol)) {
        const scannedPiece = sourceBoard[scanRow][scanCol];

        if (scannedPiece) {
          if (getPieceColor(scannedPiece) === color || capturedSquare) {
            break;
          }

          capturedSquare = [scanRow, scanCol];
        } else if (capturedSquare) {
          const nextBoard = cloneBoard(sourceBoard);
          nextBoard[row][col] = null;
          nextBoard[capturedSquare[0]][capturedSquare[1]] = null;
          nextBoard[scanRow][scanCol] = piece;

          const nextSeq = [...seq, [scanRow, scanCol]];
          const continuations = getCaptureMovesForPiece(
            nextBoard,
            scanRow,
            scanCol,
            start,
            nextSeq
          );

          if (continuations.length > 0) {
            moves.push(...continuations);
          } else {
            moves.push(buildMove(start, nextSeq, true));
          }
        }

        scanRow += rowDelta;
        scanCol += colDelta;
      }
    } else {
      const capturedRow = row + rowDelta;
      const capturedCol = col + colDelta;
      const landingRow = row + rowDelta * 2;
      const landingCol = col + colDelta * 2;

      if (
        !isInsideBoard(landingRow, landingCol) ||
        sourceBoard[landingRow][landingCol]
      ) {
        continue;
      }

      const capturedPiece = sourceBoard[capturedRow][capturedCol];
      if (!capturedPiece || getPieceColor(capturedPiece) === color) {
        continue;
      }

      const nextBoard = cloneBoard(sourceBoard);
      nextBoard[row][col] = null;
      nextBoard[capturedRow][capturedCol] = null;
      nextBoard[landingRow][landingCol] = piece;

      const nextSeq = [...seq, [landingRow, landingCol]];
      const continuations = getCaptureMovesForPiece(
        nextBoard,
        landingRow,
        landingCol,
        start,
        nextSeq
      );

      if (continuations.length > 0) {
        moves.push(...continuations);
      } else {
        moves.push(buildMove(start, nextSeq, true));
      }
    }
  }

  return moves;
};

/*
 * Russian checkers requires a capture when one exists. The app therefore
 * gathers captures and quiet moves separately, returning quiet moves only when
 * the current player has no capture anywhere on the board.
 */
const getLegalMoves = (sourceBoard, color) => {
  const captureMoves = [];
  const simpleMoves = [];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if (getPieceColor(sourceBoard[row][col]) !== color) {
        continue;
      }

      captureMoves.push(...getCaptureMovesForPiece(sourceBoard, row, col));
      simpleMoves.push(...getSimpleMovesForPiece(sourceBoard, row, col));
    }
  }

  return captureMoves.length > 0 ? captureMoves : simpleMoves;
};

/*
 * The board highlights final destination squares. When the player clicks a
 * highlighted cell, this predicate connects that click back to the full move
 * object, including any intermediate captures in a multi-capture sequence.
 */
const moveEndsAt = (move, row, col) => {
  const [endRow, endCol] = move.seq[move.seq.length - 1];
  return endRow === row && endCol === col;
};

function App() {
  /*
   * React state separates the lasting position from short-lived interaction
   * state. The selected square and possible moves exist only while the user is
   * choosing a game-mode move.
   */
  const [board, setBoard] = useState(createInitialBoard);
  const [appMode, setAppMode] = useState("game");
  const [selectedColor, setSelectedColor] = useState("w"); // 'b' for black, 'w' for white
  const [selectedType, setSelectedType] = useState("single"); // 'single' or 'king'
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  /*
   * The solver boundary is a small adapter: serialize the board, post it to the
   * configured backend, validate the HTTP layer, and return only the move part
   * of the response to the rest of the app.
   */
  const requestBestMove = useCallback(async (sourceBoard, side) => {
    const req = {
      board: serializeBoard(sourceBoard),
      side,
      depth: SOLVER_DEPTH,
    };
    console.log("Board:", req);

    const response = await fetch(`${config.apiBaseUrl}/solve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    console.log("Response:", result);
    return convertSolverMove(JSON.parse(result).move);
  }, []);

  /*
   * A board click means different things in each mode. Edit mode toggles pieces
   * directly. Game mode first selects one of the current player's pieces, then
   * turns a click on a highlighted destination into a complete human move plus
   * an automatic solver move for the opponent.
   */
  const handleSquareClick = useCallback(
    async (row, col) => {
      if (isLoading) {
        return;
      }

      if (appMode === "game") {
        const piece = board[row][col];
        const isOwnPiece = getPieceColor(piece) === selectedColor;

        if (isOwnPiece) {
          const legalMoves = getLegalMoves(board, selectedColor).filter(
            (move) => move.start[0] === row && move.start[1] === col
          );

          setSelectedSquare([row, col]);
          setPossibleMoves(legalMoves);
          setMessage(
            legalMoves.length > 0
              ? `${PLAYER_LABELS[selectedColor]} selected`
              : `${PLAYER_LABELS[selectedColor]} has no move from ${coordsToNotation([row, col])}`
          );
          return;
        }

        const selectedMove = possibleMoves.find((move) => moveEndsAt(move, row, col));
        if (!selectedMove) {
          return;
        }

        const opponentColor = opponentOf(selectedColor);
        const humanBoard = applyMoveToBoard(board, selectedMove);

        setBoard(humanBoard);
        setSelectedSquare(null);
        setPossibleMoves([]);
        setIsLoading(true);
        setMessage(`${PLAYER_LABELS[selectedColor]}: ${formatMove(selectedMove)}`);

        try {
          const opponentMove = await requestBestMove(humanBoard, opponentColor);
          if (!opponentMove) {
            setMessage(
              `${PLAYER_LABELS[selectedColor]}: ${formatMove(selectedMove)}. ${PLAYER_LABELS[opponentColor]} has no move.`
            );
            return;
          }

          const opponentBoard = applyMoveToBoard(humanBoard, opponentMove);
          setBoard(opponentBoard);
          setMessage(
            `${PLAYER_LABELS[selectedColor]}: ${formatMove(selectedMove)}. ${PLAYER_LABELS[opponentColor]}: ${formatMove(opponentMove)}`
          );
        } catch (error) {
          console.error("Error sending position:", error);
          setMessage(`Error: ${error.message}`);
        } finally {
          setIsLoading(false);
        }

        return;
      }

      setBoard((prevBoard) => {
        const newBoard = prevBoard.map((r) => [...r]);

        if (newBoard[row][col] !== null) {
          newBoard[row][col] = null;
        } else {
          const piece =
            selectedType === "king"
              ? selectedColor.toUpperCase()
              : selectedColor;
          newBoard[row][col] = piece;
        }

        return newBoard;
      });
      setSelectedSquare(null);
      setPossibleMoves([]);
    },
    [
      appMode,
      board,
      isLoading,
      possibleMoves,
      requestBestMove,
      selectedColor,
      selectedType,
    ]
  );

  /*
   * Resetting the board also clears all transient UI state. This prevents an
   * old highlighted square or stale message from describing a position that no
   * longer exists.
   */
  const handleClear = useCallback(() => {
    setBoard(createInitialBoard());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMessage("");
  }, []);

  /*
   * In edit mode, Solve keeps the original editor workflow: ask the backend for
   * the best move and show it without changing the board. In game mode, the
   * same button lets the computer make the current player's move on the board.
   */
  const handleSolve = useCallback(async () => {
    setIsLoading(true);
    setMessage('');
    setSelectedSquare(null);
    setPossibleMoves([]);

    try {
      const move = await requestBestMove(board, selectedColor);
      if (!move) {
        setMessage(`${PLAYER_LABELS[selectedColor]} has no move.`);
        return;
      }

      if (appMode === "game") {
        setBoard((prevBoard) => applyMoveToBoard(prevBoard, move));
        setSelectedColor(opponentOf(selectedColor));
      }

      setMessage(formatMove(move));

    } catch (error) {
      console.error('Error sending position:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [appMode, board, requestBestMove, selectedColor]);

  /*
   * Mode and player changes invalidate any pending game-mode selection. The
   * wrappers below centralize that cleanup so child controls can stay simple.
   */
  const handleModeChange = useCallback((mode) => {
    setAppMode(mode);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setMessage("");
  }, []);

  const handlePlayerChange = useCallback((color) => {
    setSelectedColor(color);
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, []);

  const displayedMessage = message || `${PLAYER_LABELS[selectedColor]} move`;

  /*
   * The component tree is intentionally shallow: App owns the rules and API
   * calls, CheckersBoard owns canvas rendering and coordinate clicks, and
   * Controls owns the buttons that change app state.
   */
  return (
    <div className="app">
      <header className="app-header">
        <h1>Russian Checkers</h1>
        {/* <p className="subtitle">Set up your position and solve</p> */}
      </header>

      <main className="app-main">
        {displayedMessage && (
          <div
            className={`message ${
              displayedMessage.startsWith("Error") ? "error" : "success"
            }`}
          >
            {displayedMessage}
          </div>
        )}

        <div className="board-controls">
          <CheckersBoard
            board={board}
            onSquareClick={handleSquareClick}
            selectedSquare={selectedSquare}
            possibleMoves={possibleMoves}
          />

          <Controls
            appMode={appMode}
            setAppMode={handleModeChange}
            selectedColor={selectedColor}
            setSelectedColor={handlePlayerChange}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            onClear={handleClear}
            onSolve={handleSolve}
            isLoading={isLoading}
          />
        </div>

      </main>
    </div>
  );
}

export default App;
