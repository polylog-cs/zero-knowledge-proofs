import {Img, Layout, NodeProps, Rect, Node, LayoutProps, Line, Circle, Txt, blur} from "@motion-canvas/2d";
import {Color, createRef, PossibleVector2, Reference, createSignal, all, sequence} from "@motion-canvas/core";

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


export class Graph {
    vertices: Array<{ ref: ReturnType<typeof createRef<Circle>>, colorSignal: ReturnType<typeof createSignal>, label: string }>;
    edges: Array<{ from: number; to: number; ref: ReturnType<typeof createRef<Line>> }>;
    nodeRef = createRef<Node>();
    palette = [Solarized.red, Solarized.blue, Solarized.green];

    constructor() {
        this.vertices = [];
        this.edges = [];
    }

    // Method to add a vertex with an optional label
    addVertex(label: string) {
        const ref = createRef<Circle>();
        const colorSignal = createSignal("lightgray"); // Default color
        this.vertices.push({ ref, colorSignal, label });
    }

    // Method to add an edge between two vertices by their indices
    addEdge(from: number, to: number) {
        const ref = createRef<Line>();
        this.edges.push({ from, to, ref });
    }

    // Method to build and return the node for the graph visualization
    getNode(positions: Array<[number, number]>) {
        return (
            <Node ref={this.nodeRef}>

                {this.edges.map((edge, i) => {
                    const fromVertex = this.vertices[edge.from];
                    const toVertex = this.vertices[edge.to];
                    return (
                        <Line
                            key={`edge-${i}`}
                            ref={edge.ref}
                            stroke="gray"
                            lineWidth={2}
                            opacity={0}
                            points={[
                                () => fromVertex.ref()?.position() || [0, 0],
                                () => toVertex.ref()?.position() || [0, 0]
                            ]}
                        />
                    );
                })}

                {this.vertices.map((vertex, i) => (
                    <Circle
                        key={i}
                        ref={vertex.ref}
                        size={50}
                        fill="gray"
                        opacity={0}
                        position={positions[i]} // Set initial position directly here
                    >
                        <Txt text={vertex.label} fontSize={24} fill="black" />
                    </Circle>
                ))}

            </Node>
        );
    }

    // Method to fade in all vertices and edges
    *fadeIn(duration: number) {
        yield* all(
            ...this.vertices.map(vertex => vertex.ref().opacity(1, duration)), // Animate vertices' opacity to 1
            ...this.edges.map(edge => edge.ref().opacity(1, duration)) // Use edge reference to animate opacity
        );
    }
}








export const gridSize = 9;
export const cellSize = 50;

export const solution = [
    [8, 1, 2, 7, 5, 3, 6, 4, 9],
    [9, 4, 3, 6, 8, 2, 1, 7, 5],
    [6, 7, 5, 4, 9, 1, 2, 8, 3],
    [1, 5, 4, 2, 3, 7, 8, 9, 6],
    [3, 6, 9, 8, 4, 5, 7, 2, 1],
    [2, 8, 7, 1, 6, 9, 5, 3, 4],
    [5, 2, 1, 9, 7, 4, 3, 6, 8],
    [4, 3, 8, 5, 2, 6, 9, 1, 7],
    [7, 9, 6, 3, 1, 8, 4, 5, 2],
];

export const clues = [
    [1, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 1, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 1, 0, 0, 0],
    [1, 0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0, 0, 0, 1, 1],
    [0, 0, 1, 1, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 1, 0, 0],
];


export class Sudoku {
    layoutRef = createRef<Layout>();
    cells: Array<Array<{ textRef: ReturnType<typeof createRef<Txt>>, blurSignal: ReturnType<typeof createSignal> }>>;
    gridSize: number;
    cellSize: number;
    solution: number[][];
    clues: number[][];

    constructor(gridSize: number, cellSize: number, solution: number[][], clues: number[][]) {
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.solution = solution;
        this.clues = clues;

        // Initialize references and blur signals for each cell
        this.cells = Array.from(
            { length: gridSize }, 
            () => Array.from({ length: gridSize }, () => ({
                textRef: createRef<Txt>(),
                blurSignal: createSignal(0) // Default blur value
            }))
        );
    }

    // Method to build and return the Sudoku grid layout
    getLayout() {
        return (
            <Layout
                layout
                direction="column"
                gap={0}
                alignItems="center"
                ref={this.layoutRef}
            >
                {this.solution.map((row, i) => (
                    <Layout 
                        key={`row${i}`} 
                        direction="row" 
                        gap={0}
                    >
                        {row.map((value, j) => (
                            <Rect 
                                key={`cell${i}${j}`} 
                                width={this.cellSize} 
                                height={this.cellSize} 
                                stroke="black" 
                                lineWidth={2}
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Txt 
                                    ref={this.cells[i][j].textRef} 
                                    fontSize={48} 
                                    fill="black" 
                                    opacity={this.clues[i][j] === 1 ? 1 : 0}  // Show only clues initially
                                    text={this.clues[i][j] === 1 ? `${value}` : ''}
                                    filters={[blur(this.cells[i][j].blurSignal)]} // Apply blur filter
                                />
                            </Rect>
                        ))}
                    </Layout>
                ))}
            </Layout>
        );
    }

    // Method to fill in non-clue values with blur animation
    *fillInNonClues(blurValue: number) {
        yield* sequence(
            0.03, // Delay between each cell being filled
            ...this.cells.flat().map((cell, index) => {
                const row = Math.floor(index / this.gridSize);
                const col = index % this.gridSize;
                if (this.clues[row][col] === 0) { // Only animate if it's not a clue
                    cell.blurSignal(blurValue); // Set initial blur value
                    return all(
                        cell.textRef().text(`${this.solution[row][col]}`, 0.5),
                        cell.textRef().opacity(1, 0.5),
                        //cell.blurSignal(0, 0.5) // Animate blur from initial value to 0
                    );
                }
            }).filter(Boolean) // Filter out undefined values for clue cells
        );
    }

    // Method to apply blur to all non-clue cells
    *blur_nonClues(blurValue: number) {
        yield* all(
            ...this.cells.flat().map((cell, index) => {
                const row = Math.floor(index / this.gridSize);
                const col = index % this.gridSize;
                if (this.clues[row][col] === 0) { // Only blur non-clues
                    return cell.blurSignal(blurValue, 0.5); // Set blur to specified value
                }
            }).filter(Boolean)
        );
    }
    
    // Method to remove blur from all cells
    *unblur() {
        yield* all(
            ...this.cells.flat().map(cell => cell.blurSignal(0, 0.5)) // Animate blur to zero
        );
    }
}
