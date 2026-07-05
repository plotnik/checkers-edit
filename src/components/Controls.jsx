import './Controls.css';

/*
 * Controls is a presentational panel. It does not know the checkers rules; it
 * simply exposes the current mode, player, piece type, and actions that App
 * passes down as props.
 */
const Controls = ({
  appMode,
  setAppMode,
  selectedColor,
  setSelectedColor,
  selectedType,
  setSelectedType,
  onClear,
  onSolve,
  isLoading
}) => {
  /*
   * The controls are grouped by intent. Mode changes how board clicks behave,
   * Player chooses who is acting or being placed, Piece Type applies only in
   * edit mode, and the bottom row holds command-style actions.
   */
  return (
    <div className="controls">
      <div className="control-group">
        <label className="control-label">Mode</label>
        <div className="toggle-container">
          <button
            className={`toggle-btn ${appMode === 'edit' ? 'active' : ''}`}
            onClick={() => setAppMode('edit')}
          >
            Edit Mode
          </button>
          <button
            className={`toggle-btn ${appMode === 'game' ? 'active' : ''}`}
            onClick={() => setAppMode('game')}
          >
            Game Mode
          </button>
        </div>
      </div>

      <div className="control-group">
        <label className="control-label">Player</label>
        <div className="toggle-container">
          <button
            className={`toggle-btn ${selectedColor === 'w' ? 'active white' : ''}`}
            onClick={() => setSelectedColor('w')}
          >
            <span className="piece-icon white-piece"></span>
            White
          </button>            
          <button
            className={`toggle-btn ${selectedColor === 'b' ? 'active' : ''}`}
            onClick={() => setSelectedColor('b')}
          >
            <span className="piece-icon black-piece"></span>
            Black
          </button>                          
        </div>
      </div>

      <div className={`control-group ${appMode === 'game' ? 'muted' : ''}`}>
        <label className="control-label">Piece Type</label>
        <div className="toggle-container">
          <button
            className={`toggle-btn ${selectedType === 'single' ? 'active' : ''}`}
            onClick={() => setSelectedType('single')}
            disabled={appMode === 'game'}
          >
            <span className="type-icon single"></span>
            Single
          </button>
          <button
            className={`toggle-btn ${selectedType === 'king' ? 'active' : ''}`}
            onClick={() => setSelectedType('king')}
            disabled={appMode === 'game'}
          >
            <span className="type-icon king"></span>
            King
          </button>
        </div>
      </div>

      {/* <div className="preview-section">
        <span className="preview-label">Selected:</span>
        <div className={`preview-piece ${selectedColor === 'b' ? 'black' : 'white'} ${selectedType}`}>
          {selectedType === 'king' && <span className="crown">♔</span>}
        </div>
      </div> */}

      <div className="action-buttons">
        <button 
          className="action-btn clear-btn"
          onClick={onClear}
          disabled={isLoading}
        >
          Clear Board
        </button>
        <button 
          className="action-btn solve-btn"
          onClick={onSolve}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Solving...
            </>
          ) : (
            'Solve'
          )}
        </button>
      </div>
    </div>
  );
};

export default Controls;
