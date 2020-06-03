
'use strict';

import { RedBlackNode } from './RedBlackTree';
import { createCell } from './Cell';
import { attachCircle, detachCircle } from './Circle';
import { createEdge, setEdgeEnd } from './Edge';
import { beaches, epsilon } from './Diagram';

let beachPool = [];

function Beach()
{
    RedBlackNode(this);
    this.edge =
    this.site =
    this.circle = null;
}

function createBeach(site)
{
    let beach = beachPool.pop() || new Beach();
    beach.site = site;
    return beach;
}

function detachBeach(beach)
{
    detachCircle(beach);
    beaches.remove(beach);
    beachPool.push(beach);
    RedBlackNode(beach);
}

export function removeBeach(beach)
{
    let circle = beach.circle;
    let x = circle.x;
    let y = circle.cy;
    let vertex = [x, y];
    let previous = beach.P;
    let next = beach.N;
    let disappearing = [beach];

    detachBeach(beach);

    let lArc = previous;
    while (lArc.circle &&
      Math.abs(x - lArc.circle.x) < epsilon &&
      Math.abs(y - lArc.circle.cy) < epsilon) {
        previous = lArc.P;
        disappearing.unshift(lArc);
        detachBeach(lArc);
        lArc = previous;
    }

    disappearing.unshift(lArc);
    detachCircle(lArc);

    let rArc = next;
    while (rArc.circle &&
      Math.abs(x - rArc.circle.x) < epsilon &&
      Math.abs(y - rArc.circle.cy) < epsilon) {
        next = rArc.N;
        disappearing.push(rArc);
        detachBeach(rArc);
        rArc = next;
    }

    disappearing.push(rArc);
    detachCircle(rArc);

    let nArcs = disappearing.length;
    let iArc;
    for (iArc = 1; iArc < nArcs; ++iArc) {
        rArc = disappearing[iArc];
        lArc = disappearing[iArc - 1];
        setEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
    }

    lArc = disappearing[0];
    rArc = disappearing[nArcs - 1];
    rArc.edge = createEdge(lArc.site, rArc.site, null, vertex);

    attachCircle(lArc);
    attachCircle(rArc);
}

export function addBeach(site)
{
    let x = site[0];
    let directrix = site[1];
    let lArc;
    let rArc;
    let dxl;
    let dxr;
    let node = beaches._;

    while (node) {
        dxl = leftBreakPoint(node, directrix) - x;
        if (dxl > epsilon) node = node.L; else {
            dxr = x - rightBreakPoint(node, directrix);
            if (dxr > epsilon) {
                if (!node.R) {
                    lArc = node;
                    break;
                }
                node = node.R;
            } else {
                if (dxl > -epsilon) {
                    lArc = node.P;
                    rArc = node;
                } else if (dxr > -epsilon) {
                    lArc = node;
                    rArc = node.N;
                } else {
                    lArc = rArc = node;
                }
                break;
            }
        }
    }

    createCell(site);
    let newArc = createBeach(site);
    beaches.insert(lArc, newArc);

    if (!lArc && !rArc) return;

    if (lArc === rArc) {
        detachCircle(lArc);
        rArc = createBeach(lArc.site);
        beaches.insert(newArc, rArc);
        newArc.edge = rArc.edge = createEdge(lArc.site, newArc.site);
        attachCircle(lArc);
        attachCircle(rArc);
        return;
    }

    if (!rArc) { // && lArc
        newArc.edge = createEdge(lArc.site, newArc.site);
        return;
    }

    // else lArc !== rArc
    detachCircle(lArc);
    detachCircle(rArc);

    let lSite = lArc.site;
    let ax = lSite[0];
    let ay = lSite[1];
    let bx = site[0] - ax;
    let by = site[1] - ay;
    let rSite = rArc.site;
    let cx = rSite[0] - ax;
    let cy = rSite[1] - ay;
    let d = 2 * (bx * cy - by * cx);
    let hb = bx * bx + by * by;
    let hc = cx * cx + cy * cy;
    let vertex = [(cy * hb - by * hc) / d + ax, (bx * hc - cx * hb) / d + ay];

    setEdgeEnd(rArc.edge, lSite, rSite, vertex);
    newArc.edge = createEdge(lSite, site, null, vertex);
    rArc.edge = createEdge(site, rSite, null, vertex);
    attachCircle(lArc);
    attachCircle(rArc);
}

function leftBreakPoint(arc, directrix)
{
    let site = arc.site;
    let rfocx = site[0];
    let rfocy = site[1];
    let pby2 = rfocy - directrix;

    if (!pby2) return rfocx;

    let lArc = arc.P;
    if (!lArc) return -Infinity;

    site = lArc.site;
    let lfocx = site[0];
    let lfocy = site[1];
    let plby2 = lfocy - directrix;

    if (!plby2) return lfocx;

    let hl = lfocx - rfocx;
    let aby2 = 1 / pby2 - 1 / plby2;
    let b = hl / plby2;

    if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;

    return (rfocx + lfocx) / 2;
}

function rightBreakPoint(arc, directrix)
{
    let rArc = arc.N;
    if (rArc) return leftBreakPoint(rArc, directrix);
    let site = arc.site;
    return site[1] === directrix ? site[0] : Infinity;
}
