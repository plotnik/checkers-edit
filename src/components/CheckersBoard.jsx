import { useRef, useEffect, useCallback } from 'react';
import './CheckersBoard.css';

const LIGHT_SQUARE = '#f0d9b5';
const DARK_SQUARE = '#b58863';
const BOARD_BORDER = '#5d3a1a';
const LABEL_COLOR = '#f5e6d3';

const CheckersBoard = ({ board, onSquareClick }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Draw isometric cylinder (piece)
  const drawPiece = useCallback((ctx, centerX, centerY, radius, color, isKing) => {
    const height = radius * 0.4;
    const ellipseHeight = radius * 0.3;
    
    // Colors based on piece color
    const isBlack = color === 'b' || color === 'B';
    const baseColor = isBlack ? '#2c2c2c' : '#f5f5f5';
    const topColor = isBlack ? '#1a1a1a' : '#ffffff';
    const sideColor = isBlack ? '#404040' : '#e0e0e0';
    const highlightColor = isBlack ? '#555555' : '#ffffff';
    const shadowColor = isBlack ? '#000000' : '#cccccc';
    const crownColor = isBlack ? '#ffd700' : '#ffd700';
    
    const drawSingleCylinder = (cy, scale = 1) => {
      const r = radius * scale;
      const h = height * scale;
      const eh = ellipseHeight * scale;
      
      // Side of cylinder
      ctx.beginPath();
      ctx.ellipse(centerX, cy + h, r, eh, 0, 0, Math.PI);
      ctx.lineTo(centerX - r, cy);
      ctx.ellipse(centerX, cy, r, eh, 0, Math.PI, 0, true);
      ctx.lineTo(centerX + r, cy + h);
      ctx.closePath();
      
      // Gradient for side
      const sideGradient = ctx.createLinearGradient(centerX - r, cy, centerX + r, cy);
      sideGradient.addColorStop(0, shadowColor);
      sideGradient.addColorStop(0.3, sideColor);
      sideGradient.addColorStop(0.5, highlightColor);
      sideGradient.addColorStop(0.7, sideColor);
      sideGradient.addColorStop(1, shadowColor);
      ctx.fillStyle = sideGradient;
      ctx.fill();
      ctx.strokeStyle = shadowColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Top ellipse
      ctx.beginPath();
      ctx.ellipse(centerX, cy, r, eh, 0, 0, Math.PI * 2);
      ctx.closePath();
      
      // Radial gradient for top
      const topGradient = ctx.createRadialGradient(
        centerX - r * 0.3, cy - eh * 0.3, 0,
        centerX, cy, r
      );
      topGradient.addColorStop(0, highlightColor);
      topGradient.addColorStop(0.5, topColor);
      topGradient.addColorStop(1, baseColor);
      ctx.fillStyle = topGradient;
      ctx.fill();
      ctx.strokeStyle = shadowColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      return cy;
    };
    
    if (isKing) {
      // Draw bottom cylinder
      drawSingleCylinder(centerY + height * 0.5);
      // Draw top cylinder (stacked)
      const topY = centerY - height * 0.5;
      drawSingleCylinder(topY);
      
      // Draw crown symbol on top
      ctx.beginPath();
      const crownY = topY - ellipseHeight * 0.2;
      const crownSize = radius * 0.35;
      
      // Simple crown shape
      ctx.moveTo(centerX - crownSize, crownY + crownSize * 0.3);
      ctx.lineTo(centerX - crownSize, crownY - crownSize * 0.2);
      ctx.lineTo(centerX - crownSize * 0.5, crownY + crownSize * 0.1);
      ctx.lineTo(centerX, crownY - crownSize * 0.4);
      ctx.lineTo(centerX + crownSize * 0.5, crownY + crownSize * 0.1);
      ctx.lineTo(centerX + crownSize, crownY - crownSize * 0.2);
      ctx.lineTo(centerX + crownSize, crownY + crownSize * 0.3);
      ctx.closePath();
      
      ctx.fillStyle = crownColor;
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      drawSingleCylinder(centerY);
    }
  }, []);

  // Draw the board
  const drawBoard = useCallback((ctx, size) => {
    const labelSize = size * 0.06;
    const boardSize = size - labelSize * 2;
    const squareSize = boardSize / 8;
    const offsetX = labelSize;
    const offsetY = labelSize;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background/border
    ctx.fillStyle = BOARD_BORDER;
    ctx.fillRect(0, 0, size, size);

    // Draw squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const x = offsetX + col * squareSize;
        const y = offsetY + row * squareSize;
        
        // Alternate colors - dark squares where (row + col) is odd
        const isDark = (row + col) % 2 === 1;
        ctx.fillStyle = isDark ? DARK_SQUARE : LIGHT_SQUARE;
        ctx.fillRect(x, y, squareSize, squareSize);
        
        // Draw piece if present
        const piece = board[row][col];
        if (piece) {
          const centerX = x + squareSize / 2;
          const centerY = y + squareSize / 2;
          const radius = squareSize * 0.38;
          const isKing = piece === 'B' || piece === 'W';
          drawPiece(ctx, centerX, centerY, radius, piece, isKing);
        }
      }
    }

    // Draw labels
    ctx.fillStyle = LABEL_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${labelSize * 0.6}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

    // File labels (a-h) at bottom
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let col = 0; col < 8; col++) {
      const x = offsetX + col * squareSize + squareSize / 2;
      const y = size - labelSize / 2;
      ctx.fillText(files[col], x, y);
    }

    // Rank labels (1-8) on left - 8 at top, 1 at bottom
    for (let row = 0; row < 8; row++) {
      const x = labelSize / 2;
      const y = offsetY + row * squareSize + squareSize / 2;
      ctx.fillText(String(8 - row), x, y);
    }
  }, [board, drawPiece]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const containerWidth = container.clientWidth;
      const size = Math.min(containerWidth, window.innerHeight * 0.6);
      
      // Set canvas size with device pixel ratio for sharp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      drawBoard(ctx, size);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawBoard]);

  // Handle click
  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const size = rect.width;
    const labelSize = size * 0.06;
    const boardSize = size - labelSize * 2;
    const squareSize = boardSize / 8;
    
    // Calculate which square was clicked
    const col = Math.floor((x - labelSize) / squareSize);
    const row = Math.floor((y - labelSize) / squareSize);
    
    // Check bounds
    if (row < 0 || row > 7 || col < 0 || col > 7) return;
    
    // Only allow clicks on dark squares
    const isDark = (row + col) % 2 === 1;
    if (!isDark) return;
    
    onSquareClick(row, col);
  }, [onSquareClick]);

  return (
    <div className="board-container" ref={containerRef}>
      <canvas 
        ref={canvasRef}
        className="checkers-canvas"
        onClick={handleClick}
      />
    </div>
  );
};

export default CheckersBoard;
