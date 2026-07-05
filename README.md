# Checkers Position Editor

Interactive web app for creating a checkers board position and sending it to a solver API.

## Features

- Visual 8x8 board rendered on canvas
- Click dark squares to add or remove pieces
- Choose side to move (white or black)
- Choose piece type (single or king)
- Reset board to a standard starting position
- Send current position to backend solver and display best move

## Tech Stack

- React 19
- Vite 7
- Plain CSS

## Requirements

- Node.js 18+ (Node.js 20+ recommended)
- npm
- Running solver API that exposes `POST /solve`

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create environment file (for local development):

```bash
cp .env.example .env.development
```

3. Set backend URL in `.env.development`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

4. Start dev server:

```bash
npm run dev
```

5. Open the URL shown by Vite (usually `http://localhost:5173`).

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - create production build
- `npm run preview` - preview production build locally
- `npm run lint` - run ESLint

## How To Use

1. Pick a player color in the controls.
2. Pick piece type (`Single` or `King`).
3. Click any dark square to place/remove pieces.
4. Click `Solve` to send the position to the backend.
5. Read the resulting move in the message area.
6. Click `Clear Board` to restore the default start position.

## Position Encoding Sent To API

The frontend sends a JSON payload like:

```json
{
	"board": "_b_b_b_b\nb_b_b_b_\n_b_b_b_b\n........\n........\nw_w_w_w_\n_w_w_w_w\nw_w_w_w_",
	"side": "w",
	"depth": 12
}
```

Board format details:

- 8 lines separated by `\n`
- `b` and `w` for black/white single pieces
- `B` and `W` for kings
- `.` for empty dark squares
- `_` for light squares
- `depth` is controlled by the `SOLVER_DEPTH` constant in `src/App.jsx` and is currently `12`

## Expected Solver Response

The UI expects a response containing a move object similar to:

```json
{
	"move": {
		"isCapture": false,
		"start": [2, 3],
		"seq": [[3, 4]]
	}
}
```

The move is displayed in board notation such as `c3-d4` (or `c3:e5` for captures).

## Project Structure

```text
src/
	App.jsx                    # App state, board serialization, API call
	config.js                  # Reads VITE_API_BASE_URL
	components/
		CheckersBoard.jsx        # Canvas board rendering and click handling
		Controls.jsx             # Side/type toggles and action buttons
```

## Troubleshooting

- If Solve fails with network/CORS errors, verify `VITE_API_BASE_URL` and backend CORS policy.
- If the result is empty or malformed, check backend JSON shape for the `move` object.
- After changing env variables, restart the Vite dev server.
