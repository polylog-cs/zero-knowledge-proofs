import { makeScene2D } from '../utilities_fix_view_scaling';
import { terriblehack } from './teacher';

export default makeScene2D(function* (view) {
  yield* terriblehack(view, true);
});
