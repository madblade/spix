
'use strict';

import { Random }        from './tile/random';
import { defaultExtent } from './tile/terrain';
import { voronoi }       from './voronoi';

let d3voronoi = voronoi;

let Mesher = function()
{
    this.buffer = [];
    this.randomGenerator = new Random('mesher');
};

Mesher.prototype.generatePoints = function(n, extent)
{
    extent = extent || defaultExtent;
    let pts = [];
    let rng = this.randomGenerator;
    // let side = Math.sqrt(n);
    // for (let x = 0; x < side; ++x) {
    //     for (let y = 0; y < side; ++y) {
    //         let r1 = randomGenerator.uniform();
    //         let r2 = randomGenerator.uniform();
    //         pts.push(
    //             [
    //                 ((x + 0.5 * (r1)) / side - 0.5) * extent.width,
    //                 ((y + 0.5 * (r2)) / side - 0.5) * extent.height
    //             ]
    //         );
    //     }
    // }
    for (let i = 0; i < n; i++)
    {
        let r1 = rng.uniform();
        let r2 = rng.uniform();
        pts.push([(r1 - 0.5) * extent.width, (r2 - 0.5) * extent.height]);
    }
    return pts;
};

Mesher.prototype.centroid = function(pts) {
    let x = 0;
    let y = 0;
    for (let i = 0; i < pts.length; i++) {
        x += pts[i][0];
        y += pts[i][1];
    }
    return [x / pts.length, y / pts.length];
};

Mesher.prototype.improvePoints = function(pts, n, extent)
{
    n = n || 1;
    extent = extent || defaultExtent;
    for (let i = 0; i < n; i++) {
        pts = this.voronoi(pts, extent)
            .polygons(pts)
            .map(this.centroid);
    }
    return pts;
};

Mesher.prototype.generateGoodPoints = function(n, extent)
{
    extent = extent || defaultExtent;
    let pts = this.generatePoints(n, extent);
    pts = pts.sort(function(a, b) {
        return a[0] - b[0];
    });
    return this.improvePoints(pts, 1, extent);
};

Mesher.prototype.voronoi = function(pts, extent)
{
    extent = extent || defaultExtent;
    let w = extent.width / 2;
    let h = extent.height / 2;
    return d3voronoi().extent([[-w, -h], [w, h]])(pts);
};

Mesher.prototype.makeMesh = function(pts, extent)
{
    extent = extent || defaultExtent;
    let vor = this.voronoi(pts, extent);

    let vxs = [];
    let vxids = new Map();
    let adj = [];
    let edges = [];
    let tris = [];
    let voronoiEdges = vor.edges;

    for (let i = 0; i < voronoiEdges.length; i++)
    {
        let e = voronoiEdges[i];
        if (e === undefined) continue;
        let e0 = vxids.get(e[0]);
        let e1 = vxids.get(e[1]);
        if (e0 === undefined) {
            e0 = vxs.length;
            vxids.set(e[0], e0);
            vxs.push(e[0]);
        }
        if (e1 === undefined) {
            e1 = vxs.length;
            vxids.set(e[1], e1);
            vxs.push(e[1]);
        }

        adj[e0] = adj[e0] || [];
        adj[e0].push(e1);
        adj[e1] = adj[e1] || [];
        adj[e1].push(e0);

        let left = e.left;
        let right = e.right;

        edges.push([e0, e1, left, right]);

        tris[e0] = tris[e0] || [];
        if (!tris[e0].includes(left)) tris[e0].push(left);
        if (right && !tris[e0].includes(right)) tris[e0].push(right);

        tris[e1] = tris[e1] || [];
        if (!tris[e1].includes(left)) tris[e1].push(left);
        if (right && !tris[e1].includes(right)) tris[e1].push(right);
    }

    let borderStart = vxs.length;

    // Border surgery
    let w = extent.width / 2;
    let h = extent.height / 2;
    let topRight = [-w, -h];
    let topLeft = [w, -h];
    let bottomRight = [-w, h];
    let bottomLeft = [w, h];
    for (let i = 0; i < tris.length; ++i)
    {
        let ns = adj[i];
        if (!ns.length || ns.length === 3) continue;
        let t = tris[i];
        if (ns.length === 2)
        {
            if (t.length !== 2) continue;
            let e1 = t[0]; let e2 = t[1]; let e3 = t[2];
            let ea = e1 !== undefined ? e1 : e2;
            let eb = e1 !== undefined && e2 !== undefined ? e2 : e3;

            let midX = (ea[0] + eb[0]) / 2;
            let midY = (ea[1] + eb[1]) / 2;
            let newP1; let newP2;
            let newTri1; let newTri2;
            const newIndex1 = vxs.length;
            const newIndex2 = vxs.length + 1;
            if (Math.abs(midX) > Math.abs(midY)) { // centered in 0
                if (midX > 0) {
                    newP1 = [w, ea[1]]; newP2 = [w, eb[1]];
                    if (Math.max(ea[1], eb[1]) > topRight[1]) topRight[1] = Math.max(ea[1], eb[1]);
                    if (Math.min(ea[1], eb[1]) < bottomRight[1]) bottomRight[1] = Math.min(ea[1], eb[1]);
                    newTri1 = [ea, eb, [newP1[0], newP1[1]]]; newTri1[2].index = newIndex1;
                    newTri2 = [eb, newTri1[2], [newP2[0], newP2[1]]]; newTri2[2].index = newIndex2;
                } else {
                    newP1 = [-w, ea[1]]; newP2 = [-w, eb[1]];
                    if (Math.max(ea[1], eb[1]) > topLeft[1]) topLeft[1] = Math.max(ea[1], eb[1]);
                    if (Math.min(ea[1], eb[1]) < bottomLeft[1]) bottomLeft[1] = Math.min(ea[1], eb[1]);
                    newTri1 = [ea, eb, [newP1[0], newP1[1]]]; newTri1[2].index = newIndex1;
                    newTri2 = [eb, newTri1[2], [newP2[0], newP2[1]]]; newTri2[2].index = newIndex2;
                }
            } else if (midY > 0) {
                newP1 = [ea[0], h]; newP2 = [eb[0], h];
                if (Math.max(ea[0], eb[0]) > topRight[0]) topRight[0] = Math.max(ea[0], eb[0]);
                if (Math.min(ea[0], eb[0]) < topLeft[0]) topLeft[0] = Math.min(ea[0], eb[0]);
                newTri1 = [ea, eb, [newP1[0], newP1[1]]]; newTri1[2].index = newIndex1;
                newTri2 = [eb, newTri1[2], [newP2[0], newP2[1]]]; newTri2[2].index = newIndex2;
            } else {
                newP1 = [ea[0], -h]; newP2 = [eb[0], -h];
                if (Math.max(ea[0], eb[0]) > bottomRight[0]) bottomRight[0] = Math.max(ea[0], eb[0]);
                if (Math.min(ea[0], eb[0]) < bottomLeft[0]) bottomLeft[0] = Math.min(ea[0], eb[0]);
                newTri1 = [ea, eb, [newP1[0], newP1[1]]]; newTri1[2].index = newIndex1;
                newTri2 = [eb, newTri1[2], [newP2[0], newP2[1]]]; newTri2[2].index = newIndex2;
            }

            vxs.push(newP1); tris.push(newTri1); adj.push([]);
            vxs.push(newP2); tris.push(newTri2); adj.push([]);
        }
    }

    // Corner surgery
    function makeTris(a, b, c, d)
    {
        let newTri1 = [a, b, c]; let newTri2 = [b, c, d];
        vxs.push(a); tris.push(newTri1); adj.push([]);
        vxs.push(d); tris.push(newTri2); adj.push([]);
    }
    let p1 = [topRight[0], topRight[1]]; let p2 = [topRight[0], h]; let p3 = [w, topRight[1]]; let p4 = [w, h];
    makeTris(p1, p2, p3, p4);
    p1 = [bottomRight[0], bottomRight[1]]; p2 = [bottomRight[0], -h]; p3 = [w, bottomRight[1]]; p4 = [w, -h];
    makeTris(p1, p2, p3, p4);
    p1 = [bottomLeft[0], bottomLeft[1]]; p2 = [bottomLeft[0], -h]; p3 = [-w, bottomLeft[1]]; p4 = [-w, -h];
    makeTris(p1, p2, p3, p4);
    p1 = [topLeft[0], topLeft[1]]; p2 = [topLeft[0], h]; p3 = [-w, topLeft[1]]; p4 = [-w, h];
    makeTris(p1, p2, p3, p4);

    // Pre-compute tri indexes
    let z = new Map();
    let idx = 0;
    let tidx = [];
    for (let i = 0; i < tris.length; ++i) {
        let t = tris[i];
        let ctidx = [];
        if (t.length === 3) {
            for (let j = 0; j < 3; ++j) {
                let p = t[j];
                let index = `${p[0].toFixed(5)},${p[1].toFixed(5)}`;
                let oi = z.get(index);
                if (oi !== undefined)
                {
                    ctidx.push(oi);
                }
                else
                {
                    ctidx.push(idx);
                    z.set(index, idx);
                    idx++;
                }
            }
        }
        tidx.push(ctidx);
    }

    let mesh = {
        vor,

        pts,
        edges,
        extent,

        vxs,
        adj,
        tris,
        triPointIndexes: tidx,
        nbTriPointIndexes: idx,
        nbInteriorTris: borderStart,
    };

    let vl = vxs.length;
    if (vl !== adj.length || vl !== tris.length)
        console.error('Incompatible mesh.');

    mesh.buffer = new Array(vl);
    // console.log(mesh);

    return mesh;
};

Mesher.prototype.generateGoodMesh = function(n, extent)
{
    extent = extent || defaultExtent;
    let pts = this.generateGoodPoints(n, extent);
    return this.makeMesh(pts, extent);
};

Mesher.prototype.mergeSegments = function(segs)
{
    let adj = new Map();
    const nbSegs = segs.length;
    for (let i = 0; i < nbSegs; i++) {
        let seg = segs[i];
        let a0 = adj.get(seg[0]) || [];
        let a1 = adj.get(seg[1]) || [];
        a0.push(seg[1]);
        a1.push(seg[0]);
        adj.set(seg[0], a0);
        adj.set(seg[1], a1);
    }

    let done = new Uint8Array(nbSegs);
    let paths = [];
    let path = null;
    while (true)
    {
        if (path === null) {
            for (let i = 0; i < nbSegs; i++) {
                if (done[i]) continue;
                done[i] = 1;
                path = [segs[i][0], segs[i][1]];
                break;
            }
            if (path === null) break;
        }

        let changed = false;
        for (let i = 0; i < nbSegs; i++) {
            if (done[i]) continue;
            let ap0 = adj.get(path[0]);
            let apl = adj.get(path[path.length - 1]);

            if (ap0 && ap0.length === 2 && segs[i][0] === path[0])
                path.unshift(segs[i][1]);
            else if (ap0 && ap0.length === 2 && segs[i][1] === path[0])
                path.unshift(segs[i][0]);
            else if (apl && apl.length === 2 && segs[i][0] === path[path.length - 1])
                path.push(segs[i][1]);
            else if (apl && apl.length === 2 && segs[i][1] === path[path.length - 1])
                path.push(segs[i][0]);
            else
                continue;

            done[i] = 1;
            changed = true;
            break;
        }
        if (!changed) {
            paths.push(path);
            path = null;
        }
    }

    return paths;
};

Mesher.prototype.contour = function(mesh, level)
{
    let meshEdges = mesh.edges;
    let field = mesh.buffer;
    level = level || 0;
    let edges = [];

    for (let i = 0; i < meshEdges.length; i++)
    {
        let e = meshEdges[i];
        if (e[3] === undefined) continue;
        if (this.isnearedge(mesh, e[0]) || this.isnearedge(mesh, e[1])) continue;
        if (field[e[0]] > level && field[e[1]] <= level ||
            field[e[1]] > level && field[e[0]] <= level)
        {
            edges.push([e[2], e[3]]);
        }
    }

    return this.mergeSegments(edges);
};

Mesher.prototype.isedge = function(mesh, i)
{
    return mesh.adj[i].length < 3;
};

Mesher.prototype.inef = function(v, w, h)
{
    const x = v[0];
    const y = v[1];
    return x < -0.45 * w || x > 0.45 * w || y < -0.45 * h || y > 0.45 * h;
};

Mesher.prototype.isnearedge = function(mesh, i)
{
    const x = mesh.vxs[i][0];
    const y = mesh.vxs[i][1];
    const w = mesh.extent.width;
    const h = mesh.extent.height;
    return x < -0.45 * w || x > 0.45 * w || y < -0.45 * h || y > 0.45 * h;
};

Mesher.prototype.neighbours = function(mesh, i)
{
    return mesh.adj[i];
};

Mesher.prototype.distance = function(mesh, i, j)
{
    let p = mesh.vxs[i];
    let q = mesh.vxs[j];
    return Math.sqrt(
        Math.pow(p[0] - q[0], 2) + Math.pow(p[1] - q[1], 2)
    );
};

export {
    Mesher
};
