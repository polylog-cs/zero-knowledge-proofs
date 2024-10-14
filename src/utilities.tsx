import {Img, Layout, NodeProps, Rect, Node, LayoutProps} from "@motion-canvas/2d";
import {Color, createRef, PossibleVector2, Reference} from "@motion-canvas/core";

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
};


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
