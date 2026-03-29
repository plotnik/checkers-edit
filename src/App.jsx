import { useState, useCallback } from "react";
import config from './config';
import CheckersBoard from "./components/CheckersBoard";
import Controls from "./components/Controls";
import "./App.css";

// Initialize empty board - index [0][0] = a8
const createEmptyBoard = () => {
  return Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
};

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

// Convert board coordinates [row, col] to chess notation (e.g., "a8")
const coordsToNotation = ([row, col]) => {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = row + 1;
  return `${file}${rank}`;
};

function App() {
  const [board, setBoard] = useState(createInitialBoard);
  const [selectedColor, setSelectedColor] = useState("w"); // 'b' for black, 'w' for white
  const [selectedType, setSelectedType] = useState("single"); // 'single' or 'king'
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSquareClick = useCallback(
    (row, col) => {
      setBoard((prevBoard) => {
        const newBoard = prevBoard.map((r) => [...r]);

        if (newBoard[row][col] !== null) {
          // Remove existing piece
          newBoard[row][col] = null;
        } else {
          // Place new piece
          const piece =
            selectedType === "king"
              ? selectedColor.toUpperCase()
              : selectedColor;
          newBoard[row][col] = piece;
        }

        return newBoard;
      });
    },
    [selectedColor, selectedType]
  );

  const handleClear = useCallback(() => {
    setBoard(createInitialBoard());
    setMessage("");
  }, []);

  const handleSolve = useCallback(async () => {
    // Convert board to flat array of 8 strings
    const boardStrings = board.map((row, rowIdx) => {
      return row
        .map((cell, colIdx) => {
          // Determine if this is a dark or light square
          // Dark squares: (row + col) is odd
          const isDarkSquare = (rowIdx + colIdx) % 2 === 1;

          if (cell) {
            return cell;
          } else {
            return isDarkSquare ? "." : "_";
          }
        })
        .join("");
    });

    const req = { 
      board: boardStrings.join("\n"),
      side: selectedColor,
      depth: 12
    };
    console.log("Board:", req);

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${config.apiBaseUrl}/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.text();
      console.log('Response:', result);
      const json = JSON.parse(result);
      const separator = json.move.isCapture ? ":" : "-";
      let msg = coordsToNotation(json.move.start);
      for (const step of json.move.seq) {
        msg += separator + coordsToNotation(step);
      }
      setMessage(msg);

    } catch (error) {
      console.error('Error sending position:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [board, selectedColor]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Checkers Position Editor</h1>
        {/* <p className="subtitle">Set up your position and solve</p> */}
      </header>

      <main className="app-main">
        {message && (
          <div
            className={`message ${
              message.startsWith("Error") ? "error" : "success"
            }`}
          >
            {message}
          </div>
        )}

        <div className="board-controls">
          <CheckersBoard board={board} onSquareClick={handleSquareClick} />

          <Controls
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
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
