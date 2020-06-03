
'use strict';

import { createBorderEdge } from './Edge';
import { cells, edges, epsilon } from './Diagram';

export function createCell(site)
{
    // eslint-disable-next-line no-return-assign
    return cells[site.index] = {
        site,
        halfedges: []
    };
}

function cellHalfedgeAngle(cell, edge)
{
    let site = cell.site;
    let va = edge.left;
    let vb = edge.right;
    if (site === vb) { vb = va; va = site; }
    if (vb) return Math.atan2(vb[1] - va[1], vb[0] - va[0]);
    if (site === va) { va = edge[1]; vb = edge[0]; }
    else { va = edge[0]; vb = edge[1]; }
    return Math.atan2(va[0] - vb[0], vb[1] - va[1]);
}

export function cellHalfedgeStart(cell, edge)
{
    return edge[+(edge.left !== cell.site)];
}

export function cellHalfedgeEnd(cell, edge)
{
    return edge[+(edge.left === cell.site)];
}

export function sortCellHalfedges()
{
    for (let i = 0, n = cells.length, cell, halfedges, j, m; i < n; ++i)
    {
        if ((cell = cells[i]) && (m = (halfedges = cell.halfedges).length))
        {
            let index = new Array(m);
            let array = new Array(m);
            for (j = 0; j < m; ++j) {
                index[j] = j;
                array[j] = cellHalfedgeAngle(cell, edges[halfedges[j]]);
            }
            index.sort(function(a, b) { return array[b] - array[a]; });
            for (j = 0; j < m; ++j) array[j] = halfedges[index[j]];
            for (j = 0; j < m; ++j) halfedges[j] = array[j];
        }
    }
}

export function clipCells(x0, y0, x1, y1)
{
    let nCells = cells.length;
    let iCell;
    let cell;
    let site;
    let iHalfedge;
    let halfedges;
    let nHalfedges;
    let start;
    let startX;
    let startY;
    let end;
    let endX;
    let endY;
    let cover = true;

    for (iCell = 0; iCell < nCells; ++iCell) {
        cell = cells[iCell];
        if (cell)
        {
            site = cell.site;
            halfedges = cell.halfedges;
            iHalfedge = halfedges.length;

            // Remove any dangling clipped edges.
            while (iHalfedge--)
            {
                if (!edges[halfedges[iHalfedge]]) {
                    halfedges.splice(iHalfedge, 1);
                }
            }

            // Insert any border edges as necessary.
            iHalfedge = 0;
            nHalfedges = halfedges.length;
            while (iHalfedge < nHalfedges)
            {
                end = cellHalfedgeEnd(cell, edges[halfedges[iHalfedge]]);
                endX = end[0];
                endY = end[1];
                start = cellHalfedgeStart(cell, edges[halfedges[++iHalfedge % nHalfedges]]);
                startX = start[0];
                startY = start[1];

                if (Math.abs(endX - startX) > epsilon || Math.abs(endY - startY) > epsilon)
                {
                    let ne = Math.abs(endX - x0) < epsilon && y1 - endY > epsilon ?
                        [x0, Math.abs(startX - x0) < epsilon ? startY : y1] :
                        Math.abs(endY - y1) < epsilon && x1 - endX > epsilon ?
                            [Math.abs(startY - y1) < epsilon ? startX : x1, y1] :
                            Math.abs(endX - x1) < epsilon && endY - y0 > epsilon ?
                                [x1, Math.abs(startX - x1) < epsilon ? startY : y0] :
                                Math.abs(endY - y0) < epsilon && endX - x0 > epsilon ?
                                    [Math.abs(startY - y0) < epsilon ? startX : x0, y0] :
                                    null;
                    let be = createBorderEdge(site, end, ne);
                    halfedges.splice(iHalfedge, 0, edges.push(be) - 1);
                    ++nHalfedges;
                }
            }

            if (nHalfedges) cover = false;
        }
    }

    // If there weren’t any edges, have the closest site cover the extent.
    // It doesn’t matter which corner of the extent we measure!
    if (cover)
    {
        let dx; let dy; let d2;
        let dc = Infinity;

        for (iCell = 0, cover = null; iCell < nCells; ++iCell)
        {
            cell = cells[iCell];
            if (cell)
            {
                site = cell.site;
                dx = site[0] - x0;
                dy = site[1] - y0;
                d2 = dx * dx + dy * dy;
                if (d2 < dc) { dc = d2; cover = cell; }
            }
        }

        if (cover)
        {
            let v00 = [x0, y0];
            let v01 = [x0, y1];
            let v11 = [x1, y1];
            let v10 = [x1, y0];
            cover.halfedges.push(
                edges.push(createBorderEdge(site = cover.site, v00, v01)) - 1,
                edges.push(createBorderEdge(site, v01, v11)) - 1,
                edges.push(createBorderEdge(site, v11, v10)) - 1,
                edges.push(createBorderEdge(site, v10, v00)) - 1
            );
        }
    }

    // Lastly delete any cells with no edges; these were entirely clipped.
    for (iCell = 0; iCell < nCells; ++iCell)
    {
        cell = cells[iCell];
        if (cell) {
            if (!cell.halfedges.length) {
                delete cells[iCell];
            }
        }
    }
}
