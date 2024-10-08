import {makeProject} from '@motion-canvas/core';

import lock from './scenes/lock?scene';
import phone from "./scenes/phone?scene";
import mario from "./scenes/mario?scene";

export default makeProject({
  experimentalFeatures: true,
  scenes: [lock, phone, mario],
});
