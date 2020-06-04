precision mediump float;

varying vec3 cps[8];
varying vec3 cps2[8];

varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying float vSunfade;
varying vec3 vBetaR;
varying vec3 vBetaM;
varying vec3 vCenter;

uniform float luminance;
uniform float mieDirectionalG;

//const vec3 cameraPos = vec3(0.0, 0.0, 0.0);
uniform vec3 cameraPos;
const vec3 worldCenter = vec3(-100.0, 100.0, 50.0);

// constants for atmospheric scattering
const float pi = 3.141592653589793238462643383279502884197169;

// optical length at zenith for molecules
const float rayleighZenithLength = 8.4E3;
const float mieZenithLength = 1.25E3;
//const vec3 up = vec3(0.0, 0.0, 1.0);

// 66 arc seconds -> degrees, and the cosine of that
const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

// 3.0 / ( 16.0 * pi )
const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
// 1.0 / ( 4.0 * pi )
const float ONE_OVER_FOURPI = 0.07957747154594767;

float rayleighPhase(float cosTheta) {
    return THREE_OVER_SIXTEENPI * (1.0 + pow(abs(cosTheta), 2.0));
}

float hgPhase(float cosTheta, float g) {
    float g2 = pow(abs(g), 2.0);
    float inverse = 1.0 / pow(abs(1.0 - 2.0 * g * cosTheta + g2), 1.5);
    return ONE_OVER_FOURPI * ((1.0 - g2) * inverse);
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Filmic ToneMapping http://filmicgames.com/archives/75
const float A = 0.15;
const float B = 0.50;
const float C = 0.10;
const float D = 0.20;
const float E = 0.02;
const float F = 0.30;

const float whiteScale = 1.0748724675633854; // 1.0 / Uncharted2Tonemap(1000.0)

vec3 Uncharted2Tonemap( vec3 x ) {
    return
        (
            (x * (A * x + C * B) + D * E) /
            (x * (A * x + B) + D * F )
        ) - E / F;
}

const float e = 2.71828182845904523536028747135266249775724709369995957;
const float cutoffAngle = 1.6110731556870734; // HERE hack
const float steepness = 2.5; // HERE hack
const float EE = 10000.0; // HERE hack
float sunIntensity(float zenithAngleCos) {
    zenithAngleCos = clamp(zenithAngleCos, -1.0, 1.0);
    return EE * max(0.0, 1.0 - pow(abs(e), -((cutoffAngle - acos(zenithAngleCos)) / steepness)));
}

bool doesCLieOnTheRightOfAB(vec2 a, vec2 b, vec2 c) {
    return (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y) > 0.0;
}

// a = origin
bool isInsideAngle(vec2 x, vec2 a, vec2 b, vec2 c) {
    // dot1 = dot(x, b);
    // dot2 = dot(x, c);
    // if (dot1 < 0.0 || dot2 < 0.0) return false; // discard inverted angles

    float dot1 = dot(vec3(0.0, 0.0, 1.0), cross(vec3(b, 0.0), vec3(b - c, 0.0)));
    bool invert = dot1 > 0.0;

    bool rightAB = doesCLieOnTheRightOfAB(a, b, x);
    bool rightAC = doesCLieOnTheRightOfAB(a, c, x);
    return invert ? (!rightAB && rightAC) : (rightAB && !rightAC);
}

float distanceTo2DIntersection(vec2 x, vec2 origin, vec2 a, vec2 b) {
    // x * p = a + q * b
    // (x*p, y*p) = (a.x + q*b.x, a.y, q*b.y)
    // x*p = a.x + q*b.x
    // y*p = a.y + q*b.y
    vec2 o = origin;
    float x1 = o.x;
    float y1 = o.y;
    float x2 = x.x;
    float y2 = x.y;

    float x3 = a.x;
    float y3 = a.y;
    float x4 = b.x;
    float y4 = b.y;

    // Using determinants.
    float y1my2 = y1 - y2; float y3my4 = y3 - y4;
    float x1mx2 = x1 - x2; float x3mx4 = x3 - x4;
    float den = x1mx2 * y3my4 - y1my2 * x3mx4;
    if (den == 0.0 || abs(den) <= 0.00001) return -1.0;

    float n1 = x1 * y2 - y1 * x2;
    float n2 = x3 * y4 - y3 * x4;
    float num1 = n1 * (x3mx4) - n2 * (x1mx2);
    float num2 = n1 * (y3my4) - n2 * (y1my2);
    vec2 res = vec2(num1 / den, num2 / den);

    float dx = res.x - o.x;
    float dy = res.y - o.y;

    return (dx * dx + dy * dy);
}

// PERF [VXS] flag stands for temporary code for
// using vertices instead of the neighbor edge lookup
void main()
{
    vec3 cpp = cameraPos;
    vec3 deltaWorldCamera = normalize(vWorldPosition - cpp);

    vec3 vc = normalize(vCenter);
    vec3 vp = normalize(vWorldPosition);
    vec3 diff;

    // Compupte projection plane.
    vec3 midPoint = 0.5 * (cps[0] + cps[1]);
    vec3 dpv = midPoint - vc * dot(midPoint, vc);
    vec3 xVector = dpv;
    vec3 yVector = cross(xVector, vc);

    // Project cube on 2D plane.
    vec2 xys[8];
    vec2 dpc2D2;
    vec2 dpv2D2;
    dpc2D2 = vec2(dot(vCenter, xVector), dot(vCenter, yVector));
    dpv2D2 = vec2(dot(vWorldPosition, xVector), dot(vWorldPosition, yVector));
    for (int i = 0; i < 8; ++i) {
        xys[i] = vec2(dot(cps[i], xVector), dot(cps[i], yVector));
    }

    // Quadratically determine best segments.
    vec2 bestA;
    vec2 bestB;
    vec3 bestCPA;
    vec3 bestCPB;
    float tempDistance = -1.0;

    float newDistance;
    if (isInsideAngle(dpv2D2, dpc2D2, xys[0], xys[1]) && (newDistance =
        distanceTo2DIntersection(dpv2D2, dpc2D2, xys[0], xys[1])) > tempDistance) {
        bestA = xys[0]; bestB = xys[1];
        bestCPA = cps2[0]; bestCPB = cps2[1];
        tempDistance = newDistance;
    }
    if (isInsideAngle(dpv2D2, dpc2D2, xys[0], xys[2]) && (newDistance =
        distanceTo2DIntersection(dpv2D2, dpc2D2, xys[0], xys[2])) > tempDistance) {
        bestA = xys[0]; bestB = xys[2];
        bestCPA = cps2[0]; bestCPB = cps2[2];
        tempDistance = newDistance;
    }
    if (isInsideAngle(dpv2D2, dpc2D2, xys[1], xys[3]) && (newDistance =
        distanceTo2DIntersection(dpv2D2, dpc2D2, xys[1], xys[3])) > tempDistance) {
        bestA = xys[1]; bestB = xys[3];
        bestCPA = cps2[1]; bestCPB = cps2[3];
        tempDistance = newDistance;
    }
    if (isInsideAngle(dpv2D2, dpc2D2, xys[2], xys[3]) && (newDistance =
        distanceTo2DIntersection(dpv2D2, dpc2D2, xys[2], xys[3])) > tempDistance) {
        bestA = xys[2]; bestB = xys[3];
        bestCPA = cps2[2]; bestCPB = cps2[3];
        tempDistance = newDistance;
    }
    if (isInsideAngle(dpv2D2, dpc2D2, xys[4], xys[5]) && (newDistance =
        distanceTo2DIntersection(dpv2D2, dpc2D2, xys[4], xys[5])) > tempDistance) {
        bestA = xys[4]; bestB = xys[5];
        bestCPA = cps2[4]; bestCPB = cps2[5];
        tempDistance = newDistance;
    }
    if (isInsideAngle(dpv2D2, dpc2D2, xys[4], xys[6]) && (newDistance =
        distanceTo2DIntersection(dpv2D2, dpc2D2, xys[4], xys[6])) > tempDistance) {
        bestA = xys[4]; bestB = xys[6];
        bestCPA = cps2[4]; bestCPB = cps2[6];
        tempDistance = newDistance;
    }
    if (isInsideAngle(dpv2D2, dpc2D2, xys[5], xys[7]) && (newDistance =
        distanceTo2DIntersection(dpv2D2, dpc2D2, xys[5], xys[7])) > tempDistance) {
        bestA = xys[5]; bestB = xys[7];
        bestCPA = cps2[5]; bestCPB = cps2[7];
        tempDistance = newDistance;
    }
    if (isInsideAngle(dpv2D2, dpc2D2, xys[6], xys[7]) && (newDistance =
        distanceTo2DIntersection(dpv2D2, dpc2D2, xys[6], xys[7])) > tempDistance) {
        bestA = xys[6]; bestB = xys[7];
        bestCPA = cps2[6]; bestCPB = cps2[7];
        tempDistance = newDistance;
    }
    if (isInsideAngle(dpv2D2, dpc2D2, xys[0], xys[4]) && (newDistance =
        distanceTo2DIntersection(dpv2D2, dpc2D2, xys[0], xys[4])) > tempDistance) {
        bestA = xys[0]; bestB = xys[4];
        bestCPA = cps2[0]; bestCPB = cps2[4];
        tempDistance = newDistance;
    }
    if (isInsideAngle(dpv2D2, dpc2D2, xys[1], xys[5]) && (newDistance =
        distanceTo2DIntersection(dpv2D2, dpc2D2, xys[1], xys[5])) > tempDistance) {
        bestA = xys[1]; bestB = xys[5];
        bestCPA = cps2[1]; bestCPB = cps2[5];
        tempDistance = newDistance;
    }
    if (isInsideAngle(dpv2D2, dpc2D2, xys[2], xys[6]) && (newDistance =
        distanceTo2DIntersection(dpv2D2, dpc2D2, xys[2], xys[6])) > tempDistance) {
        bestA = xys[2]; bestB = xys[6];
        bestCPA = cps2[2]; bestCPB = cps2[6];
        tempDistance = newDistance;
    }
    if (isInsideAngle(dpv2D2, dpc2D2, xys[3], xys[7]) && (newDistance =
        distanceTo2DIntersection(dpv2D2, dpc2D2, xys[3], xys[7])) > tempDistance) {
        bestA = xys[3]; bestB = xys[7];
        bestCPA = cps2[3]; bestCPB = cps2[7];
        // tempDistance = newDistance;
    }

    // Get nearest cube vertex.
    float dotNA = dot(normalize(bestA), dpv2D2);
    float dotNB = dot(normalize(bestB), dpv2D2);
    bool whichOne = dotNA > dotNB;
    vec2 iE = whichOne ? bestA : bestB;
    vec2 iE2 = whichOne ? bestB : bestA;

    // Determine neighbor of best segment.
    vec2 neighborSegment = iE + 0.1 * (iE - iE2);
        // this vector should be inside the neighbor's angle
        // (2019-03[madblade] or is this wrong?)
        // (2019-03[madblade] if it is, switch to the ugly but more efficient interp using the best vertex)
    vec2 bestNeighborProjected;
    vec3 bestCPNeighbor;
    tempDistance = -1.0;
    for (int i = 0; i < 8; ++i) {
        vec2 other = xys[i];
        if (isInsideAngle(neighborSegment, dpc2D2, iE, other)) {
            newDistance = distanceTo2DIntersection(neighborSegment, dpc2D2, iE, other);
            if (newDistance > tempDistance) {
                bestNeighborProjected = xys[i];
                bestCPNeighbor = cps2[i];
                tempDistance = newDistance;
            }
        }
    }

    vec2 interpolatorEnd = normalize(iE);
    float dotEV = dot(interpolatorEnd, normalize(dpv2D2));
    vec2 middle = 0.5 * (bestA + bestB);
    float dotES = dot(interpolatorEnd, normalize(middle));
    float interpolatorFactor = 0.0;

    // Tweak this function for smoothing the interp at the cube angles.
    float start = 0.9;
    float ceiler = 1.0 / (1.0 - start);
    float agreement = (dotEV - start) * ceiler;
    if (dotEV > start) {
        float increaseMe = 20.0; // HERE tweak (200 was default without terrain)
            // increase this to limit the range for interpolation
            // (causes sharper edges at cube vertices)
        interpolatorFactor = 0.5 * pow(abs(agreement), increaseMe);
        // PERF [VXS]
        // interpolatorFactor = 1.0 * pow(abs(agreement), 200.0);
    }

    float iF = 1.0 * interpolatorFactor;
    // iF = 0.0; // (uncomment to discard interpolation, BAD! edges will be sharp)

    {
        vec2 bestSegment = -bestA + bestB;
        vec3 verticalCros = cross(vec3(bestSegment, 0.0), vec3(0.0, 0.0, 1.0));
        bool whichOrientation = dot(vec2(verticalCros.x, verticalCros.y), bestB) > 0.0;
        float coeffOrientation = whichOrientation ? -1.0 : 1.0;

        vec3 closestCP = whichOne ? bestCPA : bestCPB;
        vec3 bestEdge = cross(0.5 * (bestCPA + bestCPB), coeffOrientation * (bestCPA - bestCPB));

        vec2 bestSegment2 = -bestNeighborProjected + iE;
        vec3 verticalCros2 = cross(vec3(bestSegment2, 0.0), vec3(0.0, 0.0, 1.0));
        bool whichOrientation2 = dot(vec2(verticalCros2.x, verticalCros2.y), iE) < 0.0;
        float coeffOrientation2 = whichOrientation2 ? -1.0 : 1.0;
        vec3 bestEdge2 = cross(0.5 * (closestCP + bestCPNeighbor), coeffOrientation2 * (closestCP - bestCPNeighbor));

        diff = normalize(iF * normalize(bestEdge2) + (1.0 - iF) * normalize(bestEdge));
    }

    // Change this coefficient for the sky gradient: 1.0 = sharp, 0.001 = smooth.
    float smoothCoefficient = 0.01; // HERE tweak (0.02 was default without terrain)
    vec3 nup = diff * smoothCoefficient;

    // XXX check if needed to hack sun intensity from intersection (2019-03[madblade]: low priority)
    float lum = luminance;
    float vsf = vSunfade;
    float vse = sunIntensity(dot(vSunDirection, nup));

    // optical length
    // cutoff angle at 90 to avoid singularity in next formula.
    // XXX zenith angle coefficient should be interpolated (2019-03[madblade]: huh?)
    float coeff = 50.0; // HERE tweak
    float dotUpDelta = coeff * dot(nup, deltaWorldCamera);
    float cutoff = max(0.0, dotUpDelta);
    //	float zenithAngle = acos(cutoff);
    // XXX find the right coeff before atan (2019-03[madblade]: whatever this means, not a priority)
    float zenithAngle = 1.05 * atan(-cutoff) + pi * 0.5;
    float inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(abs(93.885 - ((zenithAngle * 180.0) / pi)), -1.253));
    float sR = rayleighZenithLength * inverse;
    float sM = mieZenithLength * inverse;

    // combined extinction factor
    vec3 Fex = exp(-(vBetaR * sR + vBetaM * sM));

    // in scattering
    float cosTheta = dot(deltaWorldCamera, vSunDirection);
    float rPhase = rayleighPhase(cosTheta * 0.5 + 0.5);
    vec3 betaRTheta = vBetaR * rPhase;
    float mPhase = hgPhase(cosTheta, mieDirectionalG);
    vec3 betaMTheta = vBetaM * mPhase;

    vec3 Lin = pow(abs(vse * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * (1.0 - Fex)), vec3(1.5));
    Lin *= mix(
        vec3(1.0),
        pow(abs(vse * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * Fex),
        vec3(1.0 / 2.0)),
        clamp(pow(abs(1.0 - dot(nup, vSunDirection)), 5.0), 0.0, 1.0)
    );

    // nightsky
    vec3 L0 = vec3(0.1) * Fex;

    // composition + solar disc
    float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
    L0 += (vse * 19000.0 * Fex) * sundisk;
    vec3 texColor = (Lin + L0) * 0.04 + vec3(0.0, 0.0003, 0.00075);
    vec3 curr = Uncharted2Tonemap((log2(2.0 / pow(abs(lum), 4.0))) * texColor);
    vec3 color = curr * whiteScale;
    vec3 retColor = pow(abs(color), vec3(1.0 / (1.2 + (1.2 * vsf))));

    // Debug here:
    // retColor = vec3(1.0, debugBeta1, 0.0);

    gl_FragColor = vec4(retColor, 1.0);
    // (the following displays center-to-cube-vertices lines in red)
    // for (int i = 0; i < 8; ++i) {
    //     if (distance(normalize(dpv2D2), normalize(xys2[i])) < 0.005)
    //         gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // }

    // Dithering (removes gradient banding)
    // (there is still banding at 0.2 noise)
    float noise = random(vp.xy);
    float m = mix(-0.5 / 255.0, 0.5 / 255.0, noise);
    gl_FragColor.rgb += 3.0 * vec3(m);
}
