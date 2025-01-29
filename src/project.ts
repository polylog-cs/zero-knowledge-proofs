import { makeProject } from '@motion-canvas/core';

import building_the_protocol_1 from './scenes/building_the_protocol_1?scene';
import building_the_protocol_2 from './scenes/building_the_protocol_2?scene';
import commitments_1 from './scenes/commitments_1?scene';
import commitments_2 from './scenes/commitments_2?scene';
import discussion1 from './scenes/discussion1?scene';
import discussion2 from './scenes/discussion2?scene';
import discussion3 from './scenes/discussion3?scene';
import graph_coloring from './scenes/graph_coloring?scene';
import np_to_coloring_algorithm from './scenes/np_to_coloring_algorithm?scene';
import np_to_coloring_big_graph from './scenes/np_to_coloring_big_graph?scene';
import np_to_coloring_conversion from './scenes/np_to_coloring_conversion?scene';
import np_to_coloring from './scenes/np_to_coloring?scene';
import phone from './scenes/phone?scene';
import sudoku_reduction from './scenes/sudoku_reduction?scene';
import teacher_failing from './scenes/teacher_failing?scene';
import teacher from './scenes/teacher?scene';

import './global.css';

export default makeProject({
  experimentalFeatures: true,
  scenes: [
    teacher_failing,
    teacher,
    graph_coloring,
    building_the_protocol_1,
    building_the_protocol_2,
    discussion1,
    discussion2,
    discussion3,
    commitments_1,
    commitments_2,
    sudoku_reduction,
    np_to_coloring,
    np_to_coloring_algorithm,
    np_to_coloring_conversion,
    np_to_coloring_big_graph,
    phone,
  ],
});
