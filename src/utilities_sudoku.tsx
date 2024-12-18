import {Img, Layout, NodeProps, Rect, Node, LayoutProps, Line, Circle, Txt, blur, Spline} from "@motion-canvas/2d";
import {Color, createRef, PossibleVector2, Reference, createSignal, all, sequence, Logger, Vector2, waitFor} from "@motion-canvas/core";
import {Graph} from "./utilities_graph";
import {Solarized, solarizedPalette} from "./utilities";



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


export class SudokuGraph extends Graph {
    public gridVertices: string[] = [];
    public cliqueVertices: string[] = [];
    public cliqueArcs: Array<[string, string]> = [];
    public crossArcs: Array<[string, string]> = [];
    public rowArcs: Array<[string, string]> = [];
    public columnArcs: Array<[string, string]> = [];
    public boxArcs: Array<[string, string]> = [];

    constructor(
        public vertexRadius: number = 40,
        public gap: number = 40,
        public cliqueRadius = 100,
        public cliqueShift = -200,
        public arcDeviation = 40,
    ) {
        super(vertexRadius);

        // Helper function to add arcs for all pairs in a list of vertices,
        // thus forming a clique of arcs.
        const addAllPairsAsArcs = (verts: string[], targetArray: Array<[string, string]>, deviation: number, reverse: boolean = false) => {
            const newEdges: Array<[string, string]> = [];
            for (let i = 0; i < verts.length; i++) {
                for (let j = i + 1; j < verts.length; j++) {
                    const v1 = verts[i];
                    const v2 = verts[j];
                    this.addEdge(v1, v2, deviation);
                    newEdges.push([v1, v2]);
                }
            }
            if(reverse == true){
                newEdges.reverse();
            }
            targetArray.push(...newEdges);
        };

        // 1) Add the 81 grid vertices (9x9)
        this.gridVertices = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const x = col * (30 + this.gap);
                const y = row * (30 + this.gap);
                this.addVertex(`(${row},${col})`, [x, y]);
                this.gridVertices.push(`(${row},${col})`);
            }
        }

        // 2) Add the 9 clique vertices arranged in a circle
        for (let i = 0; i < 9; i++) {
            const angle = (2 * Math.PI * i) / 9;
            const x = 3.5 * (this.gap + this.vertexRadius) + this.cliqueRadius * Math.cos(angle);
            const y = this.cliqueShift + this.cliqueRadius * Math.sin(angle);

            this.addVertex(`clique-${i}`, [x, y]);
            this.cliqueVertices.push(`clique-${i}`);
        }

        // 3) Make the clique vertices a complete graph of arcs
        addAllPairsAsArcs(this.cliqueVertices, this.cliqueArcs, 0);

        // 4) Add cross arcs: For every cell that has a clue, connect it to all clique vertices except the one that matches its value
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (clues[i][j] === 1) {
                    const cellVertex = `(${i},${j})`;
                    const clueValue = solution[i][j]; // a number from 1 to 9
                    const skipIndex = clueValue - 1;
                    for (let k = 0; k < 9; k++) {
                        if (k !== skipIndex) {
                            this.addEdge(cellVertex, `clique-${k}`);
                            this.crossArcs.push([cellVertex, `clique-${k}`]);
                        }
                    }
                }
            }
        }

        // 5) Make each row a clique of arcs
        for (let i = 0; i < 9; i++) {
            const rowVertices = [];
            for (let col = 0; col < 9; col++) {
                rowVertices.push(`(${i},${col})`);
            }
            addAllPairsAsArcs(rowVertices, this.rowArcs, this.arcDeviation);
        }

        // 6) Make each column a clique of arcs
        for (let j = 0; j < 9; j++) {
            const colVertices = [];
            for (let row = 8; row >= 0; row--) {
                colVertices.push(`(${row},${j})`);
            }
            addAllPairsAsArcs(colVertices, this.columnArcs, this.arcDeviation, true);
        }

        // Create a set of all pairs already used by row and column arcs to avoid duplicates
        const existingPairs = new Set<string>();
        const addPairToSet = (a: string, b: string) => {
            const pairKey = a < b ? `${a},${b}` : `${b},${a}`;
            existingPairs.add(pairKey);
        };
        for (const [a, b] of this.rowArcs) addPairToSet(a, b);
        for (const [a, b] of this.columnArcs) addPairToSet(a, b);

        // 7) Make each 3x3 box a clique of arcs without duplicates
        for (let boxID = 0; boxID < 9; boxID++) {
            const boxVertices = [];
            const boxRow = Math.floor(boxID / 3) * 3;
            const boxCol = (boxID % 3) * 3;
            for (let r = boxRow; r < boxRow + 3; r++) {
                for (let c = boxCol; c < boxCol + 3; c++) {
                    boxVertices.push(`(${r},${c})`);
                }
            }

            // Add arcs for all pairs in this box if not already in row/column arcs
            for (let i = 0; i < boxVertices.length; i++) {
                for (let j = i + 1; j < boxVertices.length; j++) {
                    const v1 = boxVertices[i];
                    const v2 = boxVertices[j];
                    const pairKey = v1 < v2 ? `${v1},${v2}` : `${v2},${v1}`;
                    if (!existingPairs.has(pairKey)) {
                        this.addEdge(v1, v2, this.arcDeviation / 2);
                        this.boxArcs.push([v1, v2]);
                    }
                }
            }
        }
    }

    getRowVertices(row: number) {
        const vertices = [];
        for (let col = 0; col < 9; col++) {
            const v = this.getVertex(`(${row},${col})`);
            if (v) vertices.push(v);
        }
        return vertices;
    }

    getColumnVertices(col: number) {
        const vertices = [];
        for (let row = 0; row < 9; row++) {
            const v = this.getVertex(`(${row},${col})`);
            if (v) vertices.push(v);
        }
        return vertices;
    }

    *colorSolution(solution: number[][], colors: string[] = solarizedPalette) {

        const cliqueAnims: Array<Generator> = [];
        for (let d = 0; d < 9; d++) {
            cliqueAnims.push(this.getVertex(`clique-${d}`).fill(colors[d], 0.5));
        }
        yield* sequence(
            0.2, 
            ...cliqueAnims
        );

        // Now, for each digit 1 through 9, color all Sudoku vertices with that digit
        for (let d = 1; d <= 9; d++) {
            const color = colors[d - 1];
            const colorAnimations: Array<Generator> = [];

            // Find all vertices that correspond to cells with digit d
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (solution[i][j] === d) {
                        const vertex = this.getVertex(`(${i},${j})`);
                        if (vertex) {
                            colorAnimations.push(vertex.fill(color, 0.5));
                        }
                    }
                }
            }

            // Animate all these changes simultaneously
            if (colorAnimations.length > 0) {
                yield* all(...colorAnimations);
            }
        }
    }
}

export function convertPairsToLabels(pairs: [number, number][]) {
    return pairs.map(([r, c]) => `(${r},${c})`);
}





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
                                opacity = {1}
                                fill = {Solarized.base2}
                            >
                                <Txt 
                                    ref={this.cells[i][j].textRef} 
                                    fontSize={48} 
                                    fill="black" 
                                    opacity={this.clues[i][j] === 1 ? 1 : 0}  // Show only clues initially
                                    text={this.clues[i][j] === 1 ? `${value}` : ''}
                                    //filters={[blur(this.cells[i][j].blurSignal)]} // Apply blur filter
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
                        cell.textRef().text(`${this.solution[row][col]}`, 0),
                        cell.textRef().opacity(1, 0.5),
                        //cell.blurSignal(0, 0.5) // Animate blur from initial value to 0
                    );
                }
            }).filter(Boolean).sort(() => Math.random() - 0.5) // Filter out undefined values for clue cells
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

    *fillInSolutionFancy() {
        for (let digit = 1; digit <= 9; digit++) {
            // Collect all non-clue cells for this digit
            const targetCells: Array<{row: number, col: number}> = [];
            for (let i = 0; i < this.gridSize; i++) {
                for (let j = 0; j < this.gridSize; j++) {
                    if (this.clues[i][j] === 0 && this.solution[i][j] === digit) {
                        targetCells.push({row: i, col: j});
                        this.cells[i][j].textRef().text(`${digit}`).scale(1.2)
                    }
                }
            }
    
            yield* all(
                ...targetCells.map(({row, col}) => {
                    const cell = this.cells[row][col];
                    const textNode = cell.textRef();
                    return all(
                        textNode.opacity(1, 0.2),
                        textNode.scale(1.0, 0.2)
                    );
                })
            );
            yield* waitFor(0.1);
        }
    }
    
}

