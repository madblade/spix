
'use strict';

import { RedBlackNode } from './RedBlackTree';
import { circles, epsilon2 } from './Diagram';

let circlePool = [];

export var firstCircle;

function Circle()
{
    RedBlackNode(this);
    this.x =
    this.y =
    this.arc =
    this.site =
    this.cy = null;
}

export function attachCircle(arc)
{
    let lArc = arc.P;
    let rArc = arc.N;

    if (!lArc || !rArc) return;

    let lSite = lArc.site;
    let cSite = arc.site;
    let rSite = rArc.site;

    if (lSite === rSite) return;

    let bx = cSite[0];
    let by = cSite[1];
    let ax = lSite[0] - bx;
    let ay = lSite[1] - by;
    let cx = rSite[0] - bx;
    let cy = rSite[1] - by;

    let d = 2 * (ax * cy - ay * cx);
    if (d >= -epsilon2) return;

    let ha = ax * ax + ay * ay;
    let hc = cx * cx + cy * cy;
    let x = (cy * ha - ay * hc) / d;
    let y = (ax * hc - cx * ha) / d;

    let circle = circlePool.pop() || new Circle();
    circle.arc = arc;
    circle.site = cSite;
    circle.x = x + bx;
    circle.y = (circle.cy = y + by) + Math.sqrt(x * x + y * y); // y bottom

    arc.circle = circle;

    let before = null;
    let node = circles._;

    while (node) {
        if (circle.y < node.y || circle.y === node.y && circle.x <= node.x) {
            if (node.L) node = node.L;
            else { before = node.P; break; }
        } else if (node.R) node = node.R;
        else { before = node; break; }
    }

    circles.insert(before, circle);
    if (!before) firstCircle = circle;
}

export function detachCircle(arc)
{
    let circle = arc.circle;
    if (circle) {
        if (!circle.P) firstCircle = circle.N;
        circles.remove(circle);
        circlePool.push(circle);
        RedBlackNode(circle);
        arc.circle = null;
    }
}
