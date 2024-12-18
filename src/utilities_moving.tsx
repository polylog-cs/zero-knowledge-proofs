import {Node} from "@motion-canvas/2d";
import {Vector2} from "@motion-canvas/core";

type Direction = 'left' | 'right' | 'up' | 'down';

// Helper to get node edges from the cached bounding box
function getNodeEdges(node: Node) {
    // cacheBBox returns {x, y, width, height}
    const bbox = node.cacheBBox();
    const left = bbox.x;
    const right = bbox.x + bbox.width;
    const top = bbox.y;
    const bottom = bbox.y + bbox.height;

    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;

    return {left, right, top, bottom, centerX, centerY, width: bbox.width, height: bbox.height};
}

/**
 * Move the node to a given position or node's position.
 * If duration > 0, animate; otherwise, apply immediately.
 */
export function move_to(node: Node, newPos: Vector2 | Node, duration: number = 0) {
    const finalPos = newPos instanceof Node ? newPos.position() : newPos;

    if (duration <= 0) {
        node.position(finalPos);
        return (function*(){})();
    } else {
        return (function*(){
            yield* node.position(finalPos, duration);
        })();
    }
}

/**
 * Shift the node by an offset.
 * If duration > 0, animate; otherwise, immediate.
 */
export function shift(node: Node, offset: Vector2, duration: number = 0) {
    const currentPos = node.position();
    const finalPos = currentPos.add(offset);

    if (duration <= 0) {
        node.position(finalPos);
        return (function*(){})();
    } else {
        return (function*(){
            yield* node.position(finalPos, duration);
        })();
    }
}

/**
 * Align this node to another node along a particular direction.
 * If duration > 0, animate; otherwise, immediate.
 */
export function align_to(node: Node, other: Node, direction: Direction, duration: number = 0) {
    const n = getNodeEdges(node);
    const o = getNodeEdges(other);

    let finalPos = node.position();

    switch (direction) {
        case 'left':
            finalPos = new Vector2(o.left + n.width / 2, finalPos.y);
            break;
        case 'right':
            finalPos = new Vector2(o.right - n.width / 2, finalPos.y);
            break;
        case 'up':
            finalPos = new Vector2(finalPos.x, o.top + n.height / 2);
            break;
        case 'down':
            finalPos = new Vector2(finalPos.x, o.bottom - n.height / 2);
            break;
    }

    if (duration <= 0) {
        node.position(finalPos);
        return (function*(){})();
    } else {
        return (function*(){
            yield* node.position(finalPos, duration);
        })();
    }
}

/**
 * Place node next to another node along a given direction with a buffer.
 * If duration > 0, animate; otherwise, immediate.
 */
export function next_to(node: Node, other: Node, direction: Direction, buff: number = 0, duration: number = 0) {
    const n = getNodeEdges(node);
    const o = getNodeEdges(other);

    let finalPos = node.position();

    switch (direction) {
        case 'left':
            finalPos = new Vector2(o.left - buff - n.width / 2, finalPos.y);
            break;
        case 'right':
            finalPos = new Vector2(o.right + buff + n.width / 2, finalPos.y);
            break;
        case 'up':
            finalPos = new Vector2(finalPos.x, o.top - buff - n.height / 2);
            break;
        case 'down':
            finalPos = new Vector2(finalPos.x, o.bottom + buff + n.height / 2);
            break;
    }

    if (duration <= 0) {
        node.position(finalPos);
        return (function*(){})();
    } else {
        return (function*(){
            yield* node.position(finalPos, duration);
        })();
    }
}
