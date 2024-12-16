import { makeProject } from "@motion-canvas/core";

import sudoku_intro from "./scenes/sudoku_intro?scene";
import test from "./scenes/test?scene";
import sudoku_coloring from "./scenes/sudoku_coloring?scene";
import lock from "./scenes/lock?scene";
import phone from "./scenes/phone?scene";
import phone_trust from "./scenes/phone_trust?scene";
import teacher from "./scenes/teacher?scene";
import mario from "./scenes/mario?scene";
import sudoku_reduction from "./scenes/sudoku_reduction?scene";

import "./global.css";

export default makeProject({
  experimentalFeatures: true,
  scenes: [
    //test,
    sudoku_reduction,
    //sudoku_coloring,
    // sudoku_intro,
    // lock,
    // phone,
    // teacher,
    // mario,
    // phone_trust,
  ],
});
