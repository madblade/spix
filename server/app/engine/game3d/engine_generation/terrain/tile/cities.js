
'use strict';

import { maxArg }        from '../math';

let CityPlacer = function(
    mesher, fieldModifier, eroder
)
{
    if (!mesher || !fieldModifier || !eroder) throw Error('Invalid argument');

    this.buffer = [];
    this.fluxBuffer = [];

    this.mesher = mesher;
    this.fieldModifier = fieldModifier;
    this.eroder = eroder;

    this.nbCities = 0;
};

CityPlacer.prototype.resetBuffer = function(newBufferLength)
{
    if (this.buffer.length !== newBufferLength)
        this.buffer = new Float64Array(newBufferLength);
    else this.buffer.fill(0);
};

CityPlacer.prototype.resetFluxBuffer = function(newBufferLength)
{
    if (this.fluxBuffer.length !== newBufferLength)
        this.fluxBuffer = new Float64Array(newBufferLength);
    else this.fluxBuffer.fill(0);
};

CityPlacer.prototype.copyBuffer = function(source, destination)
{
    if (source.length !== destination.length) throw Error('[CityPlacer] Invalid buffer lengths.');
    const l = source.length;
    for (let i = 0; i < l; ++i)
    {
        destination[i] = source[i];
    }
};

CityPlacer.prototype.cityScore = function(mesh, tile, cities)
{
    const eroder = this.eroder;
    const mesher = this.mesher;
    const fieldModifier = this.fieldModifier;

    let h = tile.buffer;

    this.resetBuffer(h.length);
    if (this.fluxBuffer.length !== h.length) {
        this.resetFluxBuffer(h.length);
        let oldFlux = this.fluxBuffer;
        this.fluxBuffer = eroder.getFlux(mesh, tile);
        eroder.fluxBuffer = oldFlux;
    }

    this.copyBuffer(this.fluxBuffer, this.buffer);
    // let oldBuffer = this.buffer;
    // this.buffer = eroder.getFlux(mesh); // swap
    // eroder.fluxBuffer = oldBuffer;
    fieldModifier.apply1D(mesh, this.buffer, Math.sqrt);

    // let score = applyTransform(getFlux(h), Math.sqrt);
    let score = this.buffer;
    const mew2 = mesh.extent.width / 2;
    const meh2 = mesh.extent.height / 2;
    for (let i = 0; i < h.length; i++)
    {
        if (h[i] <= 0 || mesher.isnearedge(mesh, i)) {
            score[i] = -999999;
            continue;
        }
        score[i] += 0.01 / (1e-9 + Math.abs(mesh.vxs[i][0]) - mew2);
        score[i] += 0.01 / (1e-9 + Math.abs(mesh.vxs[i][1]) - meh2);
        for (let j = 0; j < cities.length; j++) {
            score[i] -= 0.02 / (mesher.distance(mesh, cities[j], i) + 1e-9);
        }
    }

    return score;
};

CityPlacer.prototype.placeCity = function(country, tile)
{
    country.cities = country.cities || [];
    let score = this.cityScore(country.mesh, tile, country.cities);
    let newcity = maxArg(score);
    country.cities.push(newcity);
    this.nbCities++;
};

CityPlacer.prototype.placeCities = function(country, tile, n)
{
    // let params = country.params;
    // let n = params.ncities;
    for (let i = 0; i < n; i++)
        this.placeCity(country, tile);
};

CityPlacer.prototype.getRivers = function(mesh, tile, limit)
{
    const eroder = this.eroder;
    const mesher = this.mesher;

    let dh = eroder.downhill(mesh, tile);
    let h = tile.buffer;
    let vxs = mesh.vxs;
    let flux;
    if (this.fluxBuffer.length === h.length) flux = this.fluxBuffer;
    else flux = eroder.getFlux(mesh, tile);

    let links = [];
    let above = 0;
    const hl = h.length;
    for (let i = 0; i < hl; i++) {
        if (h[i] > 0) above++;
    }
    limit *= above / hl;
    const dhl = dh.length;
    const mwidth = mesh.extent.width;
    const mheight = mesh.extent.height;
    for (let i = 0; i < dhl; i++)
    {
        const up = vxs[i];
        if (mesher.inef(up, mwidth, mheight)) continue;

        const dhi = dh[i];
        const hi = h[i];
        const fi = flux[i];
        if (fi > limit && hi > 0 && dhi >= 0) {
            let down = vxs[dhi];
            if (h[dhi] > 0) {
                links.push([up, down]);
            } else {
                links.push([up, [(up[0] + down[0]) / 2, (up[1] + down[1]) / 2]]);
            }
        }
    }

    return mesher.mergeSegments(links).map(this.relaxPath);
};

// Example: topological computation of territories.
CityPlacer.prototype.getTerritories = function(country)
{
    const eroder = this.eroder;
    const mesher = this.mesher;

    let mesh = country.mesh;
    let h = mesh.buffer;
    let cities = country.cities;
    let n = country.params.nterrs;
    if (n > country.cities.length) n = country.cities.length;
    let flux = eroder.getFlux(mesh);
    let terr = [];
    let queue = { queue: function() { }, dequeue: function() {  } };
    // new PriorityQueue({comparator(a, b) {return a.score - b.score;}});

    function weight(u, v)
    {
        let horiz = mesher.distance(mesh, u, v);
        let vert = h[v] - h[u];
        if (vert > 0) vert /= 10;
        let diff = 1 + 0.25 * Math.pow(vert / horiz, 2);
        diff += 100 * Math.sqrt(flux[u]);
        if (h[u] <= 0) diff = 100;
        if (h[u] > 0 !== h[v] > 0) return 1000;
        return horiz * diff;
    }

    for (let i = 0; i < n; i++) {
        terr[cities[i]] = cities[i];
        let nbs = mesher.neighbours(mesh, cities[i]);
        for (let j = 0; j < nbs.length; j++) {
            queue.queue({
                score: weight(cities[i], nbs[j]),
                city: cities[i],
                vx: nbs[j]
            });
        }
    }

    while (queue.length) {
        let u = queue.dequeue();
        if (terr[u.vx] !== undefined) continue;
        terr[u.vx] = u.city;
        let nbs = mesher.neighbours(mesh, u.vx);
        for (let i = 0; i < nbs.length; i++) {
            let v = nbs[i];
            if (terr[v] !== undefined) continue;
            let newdist = weight(u.vx, v);
            queue.queue({
                score: u.score + newdist,
                city: u.city,
                vx: v
            });
        }
    }

    // terr.mesh = h.mesh;
    return terr;
};

CityPlacer.prototype.getBorders = function(country)
{
    const mesher = this.mesher;

    let terr = country.terr;
    let mesh = country.mesh;
    let meshEdges = mesh.edges;
    let h = mesh.buffer;
    let edges = [];
    for (let i = 0; i < meshEdges.length; i++)
    {
        let e = meshEdges[i];
        if (e[3] === undefined) continue;
        if (mesher.isnearedge(mesh, e[0]) || mesher.isnearedge(mesh, e[1])) continue;
        if (h[e[0]] < 0 || h[e[1]] < 0) continue;
        if (terr[e[0]] !== terr[e[1]])
        {
            edges.push([e[2], e[3]]);
        }
    }

    return mesher.mergeSegments(edges).map(this.relaxPath);
};

CityPlacer.prototype.relaxPath = function(path)
{
    let newpath = [path[0]];
    for (let i = 1; i < path.length - 1; i++)
    {
        let newpt = [
            0.25 * path[i - 1][0] + 0.5 * path[i][0] + 0.25 * path[i + 1][0],
            0.25 * path[i - 1][1] + 0.5 * path[i][1] + 0.25 * path[i + 1][1]
        ];
        newpath.push(newpt);
    }
    newpath.push(path[path.length - 1]);
    return newpath;
};

// XXX [GENERATION] City wards.

export {
    CityPlacer
};
