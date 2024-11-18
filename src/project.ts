import {makeProject} from '@motion-canvas/core';

import sudoku_intro from "./scenes/sudoku_intro?scene";
import sudoku_coloring from "./scenes/sudoku_coloring?scene";
import lock from './scenes/lock?scene';
import phone from "./scenes/phone?scene";
import teacher from "./scenes/teacher?scene";
import mario from "./scenes/mario?scene";

import './global.css';

export default makeProject({
  experimentalFeatures: true,
  scenes: [sudoku_coloring, sudoku_intro, lock, phone, teacher, mario],
});
