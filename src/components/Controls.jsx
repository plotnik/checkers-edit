import './Controls.css';
import PieceIcon from './PieceIcon';

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
  onSave,
  onRestore,
  isLoading
}) => {
  /*
   * The controls are grouped by intent. Mode changes how board clicks behave,
   * Player chooses who is acting or being placed, Piece Type applies only in
   * edit mode, and the bottom row holds command-style actions.
   */
  return (
    <div className="controls">
      {appMode === 'edit' && (
        <>
          <div className="action-buttons">
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
            <button
              className="action-btn clear-btn"
              onClick={onClear}
              disabled={isLoading}
            >
              Clear Board
            </button>
          </div>
          <div className="action-buttons edit-save-buttons">
            <button
              className="action-btn save-btn"
              onClick={onSave}
              disabled={isLoading}
            >
              Save
            </button>
            <button
              className="action-btn restore-btn"
              onClick={onRestore}
              disabled={isLoading}
            >
              Restore
            </button>
          </div>
        </>
      )}

      <div className="control-group">
        <label className="control-label">Mode</label>
        <div className="toggle-container">
          <button
            className={`toggle-btn ${appMode === 'game' ? 'active' : ''}`}
            onClick={() => setAppMode('game')}
          >
            Game Mode
          </button>
          <button
            className={`toggle-btn ${appMode === 'edit' ? 'active' : ''}`}
            onClick={() => setAppMode('edit')}
          >
            Edit Mode
          </button>
        </div>
      </div>

      {appMode !== 'game' && (
        <>
          <div className="control-group">
            <label className="control-label">Player</label>
            <div className="toggle-container">
              <button
                className={`toggle-btn ${selectedColor === 'w' ? 'active white' : ''}`}
                onClick={() => setSelectedColor('w')}
              >
                <PieceIcon color="white" />
                White
              </button>
              <button
                className={`toggle-btn ${selectedColor === 'b' ? 'active' : ''}`}
                onClick={() => setSelectedColor('b')}
              >
                <PieceIcon color="black" />
                Black
              </button>
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Piece Type</label>
            <div className="toggle-container">
              <button
                className={`toggle-btn ${selectedType === 'single' ? 'active' : ''}`}
                onClick={() => setSelectedType('single')}
              >
                <PieceIcon color={selectedColor === 'w' ? 'white' : 'black'} />
                Single
              </button>
              <button
                className={`toggle-btn ${selectedType === 'king' ? 'active' : ''}`}
                onClick={() => setSelectedType('king')}
              >
                <PieceIcon
                  color={selectedColor === 'w' ? 'white' : 'black'}
                  isKing
                />
                King
              </button>
            </div>
          </div>
        </>
      )}

      {/* <div className="preview-section">
        <span className="preview-label">Selected:</span>
        <div className={`preview-piece ${selectedColor === 'b' ? 'black' : 'white'} ${selectedType}`}>
          {selectedType === 'king' && <span className="crown">♔</span>}
        </div>
      </div> */}

    </div>
  );
};

export default Controls;
