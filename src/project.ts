import { makeProject } from '@motion-canvas/core';

import building_the_protocol_1 from './scenes/building_the_protocol_1?scene';
import building_the_protocol_2 from './scenes/building_the_protocol_2?scene';
import commitments_1 from './scenes/commitments_1?scene';
import commitments_2 from './scenes/commitments_2?scene';
import discussion_1_fix from './scenes/discussion_1_fix?scene';
import discussion_1 from './scenes/discussion_1?scene';
import discussion_2 from './scenes/discussion_2?scene';
import discussion_3 from './scenes/discussion_3?scene';
import graph_coloring from './scenes/graph_coloring?scene';
import mario_big_graph from './scenes/mario_big_graph?scene';
import np_to_coloring_algorithm from './scenes/np_to_coloring_algorithm?scene';
import np_to_coloring_big_graph from './scenes/np_to_coloring_big_graph?scene';
import np_to_coloring_conversion from './scenes/np_to_coloring_conversion?scene';
import np_to_coloring from './scenes/np_to_coloring?scene';
import phone from './scenes/phone?scene';
import polylogo from './scenes/polylogo?scene';
import reductions from './scenes/reductions?scene';
import sudoku_reduction from './scenes/sudoku_reduction?scene';
import teacher_failing from './scenes/teacher_failing?scene';
import teacher_fixup from './scenes/teacher_fixup?scene';
import teacher_many_times from './scenes/teacher_many_times?scene';
import teacher from './scenes/teacher?scene';
import timeline from './scenes/timeline?scene';

import './global.css';

import full_protocol from './scenes/full_protocol?scene';

export default makeProject({
  experimentalFeatures: true,
  scenes: [
    // polylogo, // TODO: malý crf
    // teacher_failing, // TODO: malý crf
    // teacher, // TODO: malý crf
    // teacher_fixup, // TODO: malý crf
    // teacher_many_times, // TODO: malý crf
    // graph_coloring, // TODO: malý crf
    // building_the_protocol_1, // TODO: malý crf
    // building_the_protocol_2, // TODO: malý crf
    // discussion_1,
    // discussion_1_fix,
    // discussion_2,
    // discussion_3,
    // commitments_1,
    // commitments_2,
    // sudoku_reduction,
    // np_to_coloring,
    full_protocol,
    // np_to_coloring_algorithm,
    // np_to_coloring_conversion,
    // np_to_coloring_big_graph,
    // reductions,  // TODO: broken
    // phone,
    // timeline,  // TODO: broken
    // mario_big_graph,
  ],
});
