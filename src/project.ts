import {makeProject} from '@motion-canvas/core';

import lock from './scenes/lock?scene';
import phone from "./scenes/phone?scene";
import teacher from "./scenes/teacher?scene";
import mario from "./scenes/mario?scene";

import './global.css';

export default makeProject({
  experimentalFeatures: true,
  scenes: [lock, phone, teacher, mario],
});
