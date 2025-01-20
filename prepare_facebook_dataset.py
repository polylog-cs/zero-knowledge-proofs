"""Prepare the data to be loaded in np_to_coloring_big_graph.tsx.

It's this dataset: https://snap.stanford.edu/data/egonets-Facebook.html
filtered a bit for clarity and performance.
"""

import json
from pathlib import Path

import networkx as nx


def read_edge_list(
    file_path: Path, node_filtering: int, edge_filtering: int
) -> nx.Graph:
    if not file_path.exists():
        raise FileNotFoundError(f"Edge list file not found: {file_path}")

    G = nx.Graph()

    with open(file_path, "r") as f:
        for edge_index, line in enumerate(f):
            # Split line and convert to integers, skip empty lines
            if line.strip():
                source, target = map(int, line.strip().split())
                if (
                    source % node_filtering == 0
                    and target % node_filtering == 0
                    and edge_index % edge_filtering == 0
                ):
                    G.add_edge(source, target)

    return G


def compute_layout(G: nx.Graph) -> dict:
    """
    Compute Kamada-Kawai layout for the graph.

    Args:
        G (nx.Graph): NetworkX graph object

    Returns:
        dict: Node positions dictionary
    """
    pos = nx.kamada_kawai_layout(G)
    # pos = nx.random_layout(G)  # For testing
    pos_dict = {str(node): pos[node].tolist() for node in G.nodes()}

    return {"positions": pos_dict, "edges": list(G.edges())}


if __name__ == "__main__":
    edge_list_path = Path(__file__).parent / "src" / "assets" / "facebook_raw.txt"
    output_path = Path(__file__).parent / "src" / "assets" / "facebook_layout.json"
    node_filtering = 3
    edge_filtering = 5

    # Process the graph and save layout
    G = read_edge_list(edge_list_path, node_filtering, edge_filtering)
    pos_dict = compute_layout(G)

    with open(output_path, "w") as f:
        json.dump(pos_dict, f)

    print("Layout saved successfully!")
    print(f"Number of nodes: {len(pos_dict['positions'])}")
