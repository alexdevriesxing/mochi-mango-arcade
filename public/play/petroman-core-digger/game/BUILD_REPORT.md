# Production Build Report

## Gameplay and UX polish

- Native game space increased from 960×540 to 1280×720.
- Playfield increased from 28×14 cells to 36×18 cells.
- Character and enemy render scale reduced relative to the field for clearer navigation.
- Twelve levels were rebuilt around loops, decision points, safe recovery lanes and visible boulder setups.
- Added paced hatch spawning, active-enemy caps and late-stage burrowing pressure.
- Added input buffering, continuous held-direction movement and faster traversal.
- Added a tunnel-aware returning purifier orb.
- Added horizontal reactor-drum pushing, wobble warnings, multi-cell drops and crush-chain scoring.
- Added grouped core bonuses and four independent stage-clear conditions.
- PETRO completion now awards an extra life and clears the stage.
- Added rare timed Golden Core rewards from major boulder drops.

## Asset policy

All visible runtime art is loaded from the included hand-drawn PNG atlases and illustrated screens. No placeholder characters, procedural enemy shapes, temporary terrain blocks or external runtime art dependencies are used. Dynamic text and score values are rendered over the illustrated HUD.
