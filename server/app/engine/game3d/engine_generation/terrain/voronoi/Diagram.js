
'use strict';

import { addBeach, removeBeach } from './Beach';
import { sortCellHalfedges, cellHalfedgeStart, clipCells } from './Cell';
import { firstCircle } from './Circle';
import { clipEdges } from './Edge';
import RedBlackTree from './RedBlackTree';

export var epsilon = 1e-6;
export var epsilon2 = 1e-12;
export var beaches;
export var cells;
export var circles;
export var edges;

function triangleArea(a, b, c)
{
    return (a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1]);
}

function lexicographic(a, b)
{
    return b[1] - a[1] ||
      b[0] - a[0];
}

export default function Diagram(sites, extent)
{
    let site = sites.sort(lexicographic).pop();
    let x;
    let y;
    let circle;

    edges = [];
    cells = new Array(sites.length);
    beaches = new RedBlackTree();
    circles = new RedBlackTree();

    while (true)
    {
        circle = firstCircle;
        if (site &&
            (!circle || site[1] < circle.y || site[1] === circle.y && site[0] < circle.x))
        {
            if (site[0] !== x || site[1] !== y) {
                addBeach(site);
                x = site[0];
                y = site[1];
            }
            site = sites.pop();
        } else if (circle) {
            removeBeach(circle.arc);
        } else {
            break;
        }
    }

    sortCellHalfedges();

    if (extent) {
        let x0 = +extent[0][0];
        let y0 = +extent[0][1];
        let x1 = +extent[1][0];
        let y1 = +extent[1][1];
        clipEdges(x0, y0, x1, y1);
        clipCells(x0, y0, x1, y1);
    }

    this.edges = edges;
    this.cells = cells;

    beaches =
    circles =
    edges =
    cells = null;
}

Diagram.prototype = {
    constructor: Diagram,

    polygons()
    {
        let edg = this.edges;
        return this.cells.map(function(cell) {
            let polygon = cell.halfedges.map(
                function(i) { return cellHalfedgeStart(cell, edg[i]); }
            );
            polygon.data = cell.site.data;
            return polygon;
        });
    },

    triangles()
    {
        let triangles = [];
        let edg = this.edges;

        this.cells.forEach(function(cell, i)
        {
            if (!(m = (halfedges = cell.halfedges).length)) return;
            let site = cell.site;
            let halfedges;
            let j = -1;
            let m;
            let s0;
            let e1 = edg[halfedges[m - 1]];
            let s1 = e1.left === site ? e1.right : e1.left;

            while (++j < m)
            {
                s0 = s1;
                e1 = edg[halfedges[j]];
                s1 = e1.left === site ? e1.right : e1.left;
                if (s0 && s1 && i < s0.index && i < s1.index && triangleArea(site, s0, s1) < 0)
                {
                    triangles.push([site.data, s0.data, s1.data]);
                }
            }
        });

        return triangles;
    },

    links() {
        return this.edges.filter(function(edge)
        {
            return edge.right;
        }).map(function(edge) {
            return {
                source: edge.left.data,
                target: edge.right.data
            };
        });
    },

    find(x, y, radius)
    {
        let that = this;
        let i0;
        let i1 = that._found || 0;
        let n = that.cells.length;
        let cell;

        // Use the previously-found cell, or start with an arbitrary one.
        while (!(cell = that.cells[i1])) if (++i1 >= n) return null;
        let dx = x - cell.site[0]; let dy = y - cell.site[1]; let
            d2 = dx * dx + dy * dy;

        let callback = function(e) {
            let edge = that.edges[e];
            let v = edge.left;
            if ((v === cell.site || !v) && !(v = edge.right)) return;
            let vx = x - v[0];
            let vy = y - v[1];
            let v2 = vx * vx + vy * vy;
            if (v2 < d2) { d2 = v2; i1 = v.index; }
        };

        // Traverse the half-edges to find a closer cell, if any.
        do {
            cell = that.cells[i0 = i1]; i1 = null;
            cell.halfedges.forEach(callback);
        } while (i1 !== null);

        that._found = i0;

        return radius === null || d2 <= radius * radius ? cell.site : null;
    }
};
