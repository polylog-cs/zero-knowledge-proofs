import { makeProject } from '@motion-canvas/core';

import building_protocol_1 from './scenes/building_protocol_1?scene';
import building_protocol_2 from './scenes/building_protocol_2?scene';
import commitments_1 from './scenes/commitments_1?scene';
import commitments_2 from './scenes/commitments_2?scene';
import discussion1 from './scenes/discussion1?scene';
import lock from './scenes/lock?scene';
import np_to_coloring_algorithm from './scenes/np_to_coloring_algorithm?scene';
import np_to_coloring_conversion from './scenes/np_to_coloring_conversion?scene';
import np_to_coloring from './scenes/np_to_coloring?scene';
import phone_trust from './scenes/phone_trust?scene';
import phone from './scenes/phone?scene';
import rotation from './scenes/rotation?scene';
import sudoku_coloring from './scenes/sudoku_coloring?scene';
import sudoku_intro from './scenes/sudoku_intro?scene';
import sudoku_reduction from './scenes/sudoku_reduction?scene';
import teacher from './scenes/teacher?scene';
import test from './scenes/test?scene';

import './global.css';

export default makeProject({
  experimentalFeatures: true,
  scenes: [
    discussion1,
    building_protocol_1,
    building_protocol_2,
    commitments_1,
    commitments_2,
    //test,
    sudoku_reduction,
    lock,
    phone,
    teacher,
    np_to_coloring,
    np_to_coloring_algorithm,
    np_to_coloring_conversion,
    phone_trust,
  ],
});
