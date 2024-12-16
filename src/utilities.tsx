import {Img, Layout, NodeProps, Rect, Node, LayoutProps, Line, Circle, Txt, blur, Spline} from "@motion-canvas/2d";
import {Color, createRef, PossibleVector2, Reference, createSignal, all, sequence, Logger, Vector2, waitFor} from "@motion-canvas/core";

export const Solarized = {
    base03: "#002b36",
    base02: "#073642",
    base01: "#586e75",
    base00: "#657b83",
    base0: "#839496",
    base1: "#93a1a1",
    base2: "#eee8d5",
    base3: "#fdf6e3",
    yellow: "#b58900",
    orange: "#cb4b16",
    red: "#dc322f",
    magenta: "#d33682",
    violet: "#6c71c4",
    blue: "#268bd2",
    cyan: "#2aa198",
    green: "#859900",

    background: "#eee8d5", // base2
    gray: "#93a1a1", //  base1
};

export const fontSize = 50;

export interface IconProps extends LayoutProps {
    path: string;
    color: Color | string;
}

export class Icon extends Layout {
    public readonly image: Reference<Img>;

    public constructor(props?: IconProps) {
        super({...props});

        this.image = createRef<Img>();

        this.add(
            <Layout layout cache>
                <Img ref={this.image} layout={false} src={props.path} />
                <Rect layout={false} size={() => Math.max(this.image().width(), this.image().height())}
                      rotation={this.image().rotation}
                      fill={props.color}
                      compositeOperation={'source-in'}/>
            </Layout>
        );
    }
}

export function addVectors(v1: [number, number], v2: [number, number]): [number, number] {
    return [v1[0] + v2[0], v1[1] + v2[1]];
}







  export function* indicate(node: {
    scale: (value: number, duration?: number) => Generator<any,void,unknown>
  }, 
  newScale: number = 1.5,
) {
    // Save current z-level
    const oldZ = node.zIndex(); // get current z-value
    
    // Move it to the front
    yield* node.zIndex(999, 0); // instantly set z to a very large number
  
    // Animate scale up and back down
    yield* node.scale(newScale, 0.3);
    yield* waitFor(0.5);
    yield* node.scale(1.0, 0.3);
  
    // Restore old z
    yield* node.zIndex(oldZ, 0);
  }
  


  // Logs an array with an optional message
export function logArray(logger: Logger, arr: unknown[], message: string = '') {
    const prefix = message ? `${message}: ` : '';
    logger.info(`${prefix}${JSON.stringify(arr)}`);
}

// Logs a pair (tuple of two elements) with an optional message
export function logPair(logger: Logger, pair: [unknown, unknown], message: string = '') {
    const prefix = message ? `${message}: ` : '';
    logger.info(`${prefix}(${JSON.stringify(pair[0])}, ${JSON.stringify(pair[1])})`);
}

export function logPosition(logger: Logger, position: Vector2, message: string = '') {
    const prefix = message ? `${message}: ` : '';
    logger.info(`${prefix}(${JSON.stringify(position.x)}, ${JSON.stringify(position.y)})`);
}

// Logs any object or value with an optional message
export function logValue(logger: Logger, value: unknown, message: string = '') {
    const prefix = message ? `${message}: ` : '';
    logger.info(`${prefix}${JSON.stringify(value)}`);
}
// Logs a labeled object, where the label is a string and the object is anything.
export function logLabeled(logger: Logger, label: string, value: unknown) {
    logger.info(`${label}: ${JSON.stringify(value)}`);
}