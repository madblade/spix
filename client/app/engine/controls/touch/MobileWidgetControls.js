
let MobileWidgetCameraControls = function(
    element, camera)
{
    this.camera = camera;
    let onLeftStickMove = function(x, y) {
        console.log(`left ${x},${y}`);
    };
    let onRightStickMove = function(x, y) {
        console.log(`right ${x},${y}`);
    };
    let onButtonPressed = function(which) {
        console.log(`button ${which}`);
    };
    this.widgetControls = new MobileWidgetControls(
        element, onLeftStickMove, onRightStickMove, onButtonPressed
    );
};

MobileWidgetCameraControls.prototype.animate = function()
{
    this.widgetControls.animate();
};

/**
 * Mobile Widget Controller
 * @param element HTMLElement used to get touch events and to draw the widget.
 * @param onLeftStickMove function(X, Y) from the stick center.
 * @param onRightStickMove function(X, Y) from the stick center.
 * @param onButtonPress function(whichButton) for additional buttons.
 * @constructor
 */
let MobileWidgetControls = function(
    element,
    onLeftStickMove,
    onRightStickMove,
    onButtonPress)
{
    if (!(element instanceof HTMLElement))
        throw Error('[MobileWidgetControls] Expected element to be an HTMLElement.');

    // Main objects.
    this.element = element;
    this.leftStickMoveCallback = onLeftStickMove;
    this.rightStickMoveCallback = onRightStickMove;
    this.buttonPressCallback = onButtonPress;

    // Model.
    let OFFSET_CENTER = 100;
    this.STICK_REACH_DISTANCE = 40;
    this.STICK_HEAD_DIAMETER = 20;
    this.STICK_BASE_DIAMETER = 40;
    this.OFFSET_CENTER = OFFSET_CENTER;
    this.CANVAS_ID = 'widget-drawing-canvas';
    this.TIME_MS_TO_GET_TO_ORIGINAL_POSITION = 200; // 400ms to relax
    this.buttons = {};
    this.leftStick = {
        originX: OFFSET_CENTER,
        originY: window.innerHeight - OFFSET_CENTER,
        x: 0, y: 0,
        lastHeldX: 0, lastHeldY: 0, held: !1, timeStampReleased: 0,
        needsUpdate: !0
    };
    this.rightStick = {
        originX: window.innerWidth - OFFSET_CENTER,
        originY: window.innerHeight - OFFSET_CENTER,
        x: 0, y: 0,
        lastHeldX: 0, lastHeldY: 0, held: !1, timeStampReleased: 0,
        needsUpdate: !0
    };
    // TODO
    this.rightPad = {
        x: 0,
        y: 0,
    };
    this.lastTimeStamp = 0;

    // Graphics.
    let c = document.getElementById(this.CANVAS_ID);
    if (!c) {
        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', this.CANVAS_ID);
        this.canvas.setAttribute('width', `${window.innerWidth}`);
        this.canvas.setAttribute('height', `${window.innerHeight}`);
        this.canvas.setAttribute('style', 'position: absolute; width: 100%; bottom: 0; z-index: 999;');
        this.element.appendChild(this.canvas);
    } else {
        this.canvas = c;
    }

    // Listeners.
    this.element.addEventListener('mousemove', e => this.updateMove(e));
    this.element.addEventListener('mousedown', e => this.updateDown(e));
    this.element.addEventListener('mouseup', e => this.updateUp(e));
    window.addEventListener('resize', () => this.resize());

    // Util.
    this._resizeRequest = null;

    // Model init.
    this.init();
};

MobileWidgetControls.prototype.getTimeInMilliseconds = function() {
    return performance.now();
};

MobileWidgetControls.prototype.init = function()
{
    let ls = this.leftStick;
    ls.x = ls.y = ls.lastHeldX = ls.lastHeldY = ls.timeStampReleased = 0; ls.held = !1;
    ls.originX = this.OFFSET_CENTER;
    ls.originY = window.innerHeight - this.OFFSET_CENTER;
    ls.needsUpdate = !0;
    let rs = this.rightStick;
    rs.x = rs.y = rs.lastHeldX = rs.lastHeldY = rs.timeStampReleased = 0; rs.held = !1;
    rs.originX = window.innerWidth - this.OFFSET_CENTER;
    rs.originY = window.innerHeight - this.OFFSET_CENTER;
    rs.needsUpdate = !0;
    this.lastTimeStamp = this.getTimeInMilliseconds();
    this.draw();
};

MobileWidgetControls.prototype.updateModelMove = function(cx, cy)
{
    let lx = this.leftStick.originX; let ly = this.leftStick.originY;
    let rx = this.rightStick.originX; let ry = this.rightStick.originY;
    let dl = Math.sqrt(Math.pow(cx - lx, 2) + Math.pow(cy - ly, 2));
    let dr = Math.sqrt(Math.pow(cx - rx, 2) + Math.pow(cy - ry, 2));
    if (dl < 0.5 * dr) {
        this.leftStick.needsUpdate = true;
        if (!this.leftStick.held) return;
        let vx = cx - lx; let vy = cy - ly;
        if (dl > this.STICK_REACH_DISTANCE) {
            vx *= this.STICK_REACH_DISTANCE / dl;
            vy *= this.STICK_REACH_DISTANCE / dl;
        }
        this.leftStick.x = vx;
        this.leftStick.y = vy;
        this.leftStick.lastHeldX = vx;
        this.leftStick.lastHeldY = vy;
    } else if (dr < 0.5 * dl) {
        this.rightStick.needsUpdate = true;
        if (!this.rightStick.held) return;
        let vx = cx - rx; let vy = cy - ry;
        if (dr > this.STICK_REACH_DISTANCE) {
            vx *= this.STICK_REACH_DISTANCE / dr;
            vy *= this.STICK_REACH_DISTANCE / dr;
        }
        this.rightStick.x = vx;
        this.rightStick.y = vy;
        this.rightStick.lastHeldX = vx;
        this.rightStick.lastHeldY = vy;
    }
};
MobileWidgetControls.prototype.updateModelHold = function(cx, cy, isHolding)
{
    let lx = this.leftStick.originX; let ly = this.leftStick.originY;
    let rx = this.rightStick.originX; let ry = this.rightStick.originY;
    let dl = Math.sqrt(Math.pow(cx - lx, 2) + Math.pow(cy - ly, 2));
    let dr = Math.sqrt(Math.pow(cx - rx, 2) + Math.pow(cy - ry, 2));
    if (dl < 0.5 * dr) {
        this.leftStick.held = isHolding;
        if (!isHolding) this.leftStick.timeStampReleased = performance.now();
        this.leftStick.needsUpdate = true;
    } else if (dr < 0.5 * dl) {
        this.rightStick.held = isHolding;
        if (!isHolding) this.rightStick.timeStampReleased = performance.now();
        this.rightStick.needsUpdate = true;
    }
};

MobileWidgetControls.prototype.updateMove = function(event)
{
    let cx = event.clientX; let cy = event.clientY;
    this.updateModelMove(cx, cy);
};
MobileWidgetControls.prototype.updateDown = function(event)
{
    let cx = event.clientX; let cy = event.clientY;
    this.updateModelHold(cx, cy, true);
    this.updateModelMove(cx, cy);
};
MobileWidgetControls.prototype.updateUp = function(event)
{
    let cx = event.clientX; let cy = event.clientY;
    this.updateModelHold(cx, cy, false);
};

MobileWidgetControls.prototype.drawStick = function(ctx, stick)
{
    ctx.beginPath();
    ctx.globalAlpha = 0.5;
    let originXLeft = stick.originX;
    let originYLeft = stick.originY;
    ctx.arc(
        originXLeft, originYLeft,
        this.STICK_BASE_DIAMETER, 0, 2 * Math.PI
    );
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.globalAlpha = 0.9;
    let stickXLeft = stick.x;
    let stickYLeft = stick.y;
    ctx.arc(
        originXLeft + stickXLeft, originYLeft + stickYLeft,
        this.STICK_HEAD_DIAMETER, 0, 2 * Math.PI
    );
    ctx.fillStyle = 'grey';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'black';
    ctx.stroke();
};

MobileWidgetControls.prototype.draw = function()
{
    let canvas = this.canvas;
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.drawStick(ctx, this.leftStick);
    this.drawStick(ctx, this.rightStick);
};

MobileWidgetControls.prototype.animate = function()
{
    let newTime = this.getTimeInMilliseconds();
    // let deltaTime = this.lastTimeStamp - newTime;

    let leftStick = this.leftStick;
    if (!leftStick.held && leftStick.needsUpdate) {
        let deltaT = newTime - leftStick.timeStampReleased;
        let maxDeltaT = this.TIME_MS_TO_GET_TO_ORIGINAL_POSITION;
        let t = this.smootherstep(0, maxDeltaT, deltaT);
        let ox = leftStick.originX; let oy = leftStick.originY;
        let newX = (ox + leftStick.lastHeldX) * (1 - t) + ox * t - ox;
        let newY = (oy + leftStick.lastHeldY) * (1 - t) + oy * t - oy;
        if (leftStick.x === leftStick.y && leftStick.x === leftStick.y)
            leftStick.needsUpdate = false;
        leftStick.x = newX;
        leftStick.y = newY;
        console.log(leftStick.x);
    }
    let rightStick = this.rightStick;
    if (!rightStick.held && rightStick.needsUpdate) {
        let deltaT = newTime - rightStick.timeStampReleased;
        let maxDeltaT = this.TIME_MS_TO_GET_TO_ORIGINAL_POSITION;
        let t = this.smootherstep(0, maxDeltaT, deltaT);
        let ox = rightStick.originX; let oy = rightStick.originY;
        let newX = (ox + rightStick.lastHeldX) * (1 - t) + ox * t - ox;
        let newY = (oy + rightStick.lastHeldY) * (1 - t) + oy * t - oy;
        if (rightStick.x === rightStick.y && rightStick.x === rightStick.y)
            rightStick.needsUpdate = false;
        rightStick.x = newX;
        rightStick.y = newY;
        console.log(rightStick.x);
    }

    this.lastTimeStamp = newTime;
    this.draw();
};

MobileWidgetControls.prototype.resize = function()
{
    if (this._resizeRequest) clearTimeout(this._resizeRequest);
    this._resizeRequest = setTimeout(() => {
        this.canvas.setAttribute('width', `${window.innerWidth}`);
        this.canvas.setAttribute('height', `${window.innerHeight}`);
        this.init();
    }, 100);
};

/* UTIL */

MobileWidgetControls.prototype.clamp = function(t, low, high)
{
    return Math.min(high, Math.max(low, t));
};

MobileWidgetControls.prototype.smoothstep = function(end1, end2, t)
{
    let x = this.clamp((t - end1) / (end2 - end1), 0.0, 1.0);
    return x * x * (3 - 2 * x);
};

MobileWidgetControls.prototype.smootherstep = function(end1, end2, t)
{
    let x = this.clamp((t - end1) / (end2 - end1), 0.0, 1.0);
    return x * x * x * (x * (x * 6 - 15) + 10);
};

MobileWidgetControls.prototype.addButton = function()
{
    // TODO
};

export { MobileWidgetControls, MobileWidgetCameraControls };
