import { Img, Layout, LayoutProps, Node, Rect } from '@motion-canvas/2d';
import {
  Color,
  createRef,
  Reference,
  useLogger,
  useRandom,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

export const Solarized = {
  base03: '#002b36',
  base02: '#073642',
  base01: '#586e75',
  base00: '#657b83',
  base0: '#839496',
  base1: '#93a1a1',
  base2: '#eee8d5',
  base3: '#fdf6e3',
  yellow: '#d0b700',
  yellow2: '#b58900', // The original Solarized yellow
  orange: '#c1670c',
  orange2: '#cb4b16', // The original Solarized orange - too close to red
  red: '#dc322f',
  magenta: '#d33682',
  violet: '#6c71c4',
  blue: '#268bd2',
  cyan: '#2aa198',
  green: '#859900',

  background: '#eee8d5', // base2
  text: '#657b83', //  base00
  gray: '#657b83', //  base00
  proverText: '#b58900', // yellow
  verifierText: '#073642', // base02
};

export const solarizedPalette = [
  Solarized.red,
  Solarized.orange,
  Solarized.yellow,
  Solarized.green,
  Solarized.cyan,
  Solarized.blue,
  Solarized.violet,
  Solarized.magenta,
  '#3ecea0', // We've run out of solarized :(
];

export const fontSize = 50;
export const FONT_FAMILY = 'Computer Modern Serif, Noto Color Emoji, sans-serif';
// sans-serif so that it's visible CMU hasn't loaded
// (if this has happened to you, just force a HMR update by touching a file)

export interface IconProps extends LayoutProps {
  path: string;
  color: Color | string;
}

export class Icon extends Layout {
  public readonly image: Reference<Img>;

  public constructor(props?: IconProps) {
    super({ ...props });

    this.image = createRef<Img>();

    this.add(
      <Layout layout cache>
        <Img ref={this.image} layout={false} src={props.path} />
        <Rect
          layout={false}
          size={() => Math.max(this.image().width(), this.image().height())}
          rotation={this.image().rotation}
          fill={props.color}
          compositeOperation={'source-in'}
        />
      </Layout>,
    );
  }
}

export function addVectors(
  v1: [number, number],
  v2: [number, number],
): [number, number] {
  return [v1[0] + v2[0], v1[1] + v2[1]];
}

export function* indicate(node: Node, newScale: number = 1.5) {
  // Save current z-level
  const oldZ = node.zIndex(); // get current z-value

  // Move it to the front
  yield* node.zIndex(999, 0); // instantly set z to a very large number

  const scale = node.scale();
  // Animate scale up and back down
  yield* node.scale(scale.mul(newScale), 0.3);
  yield* waitFor(0.5);
  yield* node.scale(scale, 0.3);

  // Restore old z
  yield* node.zIndex(oldZ, 0);
}

export function logArray(arr: unknown[], message: string = '') {
  const logger = useLogger();
  const prefix = message ? `${message}: ` : '';
  logger.info(`${prefix}${JSON.stringify(arr)}`);
}

export function logPair(pair: [unknown, unknown], message: string = '') {
  const logger = useLogger();
  const prefix = message ? `${message}: ` : '';
  logger.info(`${prefix}(${JSON.stringify(pair[0])}, ${JSON.stringify(pair[1])})`);
}

export function logPosition(position: Vector2, message: string = '') {
  const logger = useLogger();
  const prefix = message ? `${message}: ` : '';
  logger.info(
    `${prefix}(${JSON.stringify(position.x)}, ${JSON.stringify(position.y)})`,
  );
}

export function logValue(value: unknown, message: string = '') {
  const logger = useLogger();
  const prefix = message ? `${message}: ` : '';
  logger.info(`${prefix}${JSON.stringify(value)}`);
}

export function logLabeled(label: string, value: unknown) {
  const logger = useLogger();
  logger.info(`${label}: ${JSON.stringify(value)}`);
}

export function shuffleArray(array: any[]) {
  const random = useRandom();
  for (let i = array.length - 1; i > 0; i--) {
    const j = random.nextInt(0, i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
}
