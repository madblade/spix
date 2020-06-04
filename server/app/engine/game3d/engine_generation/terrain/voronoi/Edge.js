
'use strict';

import { cells, edges, epsilon } from './Diagram';

export function createEdge(left, right, v0, v1)
{
    let edge = [null, null];
    let index = edges.push(edge) - 1;
    edge.left = left;
    edge.right = right;
    if (v0) setEdgeEnd(edge, left, right, v0);
    if (v1) setEdgeEnd(edge, right, left, v1);
    cells[left.index].halfedges.push(index);
    cells[right.index].halfedges.push(index);
    return edge;
}

export function createBorderEdge(left, v0, v1)
{
    let edge = [v0, v1];
    edge.left = left;
    return edge;
}

export function setEdgeEnd(edge, left, right, vertex)
{
    if (!edge[0] && !edge[1]) {
        edge[0] = vertex;
        edge.left = left;
        edge.right = right;
    } else if (edge.left === right) {
        edge[1] = vertex;
    } else {
        edge[0] = vertex;
    }
}

// Liang–Barsky line clipping.
function clipEdge(edge, x0, y0, x1, y1)
{
    let a = edge[0];
    let b = edge[1];
    let ax = a[0];
    let ay = a[1];
    let bx = b[0];
    let by = b[1];
    let t0 = 0;
    let t1 = 1;
    let dx = bx - ax;
    let dy = by - ay;
    let r;

    r = x0 - ax;
    if (!dx && r > 0) return;
    r /= dx;
    if (dx < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
    } else if (dx > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
    }

    r = x1 - ax;
    if (!dx && r < 0) return;
    r /= dx;
    if (dx < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
    } else if (dx > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
    }

    r = y0 - ay;
    if (!dy && r > 0) return;
    r /= dy;
    if (dy < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
    } else if (dy > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
    }

    r = y1 - ay;
    if (!dy && r < 0) return;
    r /= dy;
    if (dy < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
    } else if (dy > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
    }

    if (!(t0 > 0) && !(t1 < 1)) return true;

    if (t0 > 0) edge[0] = [ax + t0 * dx, ay + t0 * dy];
    if (t1 < 1) edge[1] = [ax + t1 * dx, ay + t1 * dy];
    return true;
}

function connectEdge(edge, x0, y0, x1, y1) {
    let v1 = edge[1];
    if (v1) return true;

    let v0 = edge[0];
    let left = edge.left;
    let right = edge.right;
    let lx = left[0];
    let ly = left[1];
    let rx = right[0];
    let ry = right[1];
    let fx = (lx + rx) / 2;
    let fy = (ly + ry) / 2;
    let fm;
    let fb;

    if (ry === ly) {
        if (fx < x0 || fx >= x1) return;
        if (lx > rx) {
            if (!v0) v0 = [fx, y0];
            else if (v0[1] >= y1) return;
            v1 = [fx, y1];
        } else {
            if (!v0) v0 = [fx, y1];
            else if (v0[1] < y0) return;
            v1 = [fx, y0];
        }
    } else {
        fm = (lx - rx) / (ry - ly);
        fb = fy - fm * fx;
        if (fm < -1 || fm > 1) {
            if (lx > rx) {
                if (!v0) v0 = [(y0 - fb) / fm, y0];
                else if (v0[1] >= y1) return;
                v1 = [(y1 - fb) / fm, y1];
            } else {
                if (!v0) v0 = [(y1 - fb) / fm, y1];
                else if (v0[1] < y0) return;
                v1 = [(y0 - fb) / fm, y0];
            }
        } else if (ly < ry) {
            if (!v0) v0 = [x0, fm * x0 + fb];
            else if (v0[0] >= x1) return;
            v1 = [x1, fm * x1 + fb];
        } else {
            if (!v0) v0 = [x1, fm * x1 + fb];
            else if (v0[0] < x0) return;
            v1 = [x0, fm * x0 + fb];
        }
    }

    edge[0] = v0;
    edge[1] = v1;
    return true;
}

export function clipEdges(x0, y0, x1, y1)
{
    let i = edges.length;
    let edge;

    while (i--) {
        if (!connectEdge(edge = edges[i], x0, y0, x1, y1) ||
        !clipEdge(edge, x0, y0, x1, y1) ||
        !(Math.abs(edge[0][0] - edge[1][0]) > epsilon ||
            Math.abs(edge[0][1] - edge[1][1]) > epsilon)) {
            delete edges[i];
        }
    }
}
