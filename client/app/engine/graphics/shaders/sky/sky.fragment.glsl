precision highp float;

varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying float vSunfade;
varying vec3 vBetaR;
varying vec3 vBetaM;
varying float vSunE;
varying vec3 vCenter;
varying vec3 vForward;
varying vec3 vPosition;
varying vec3 vP2;
varying mat4 vMVM;

uniform float luminance;
uniform float mieDirectionalG;

const vec3 cameraPos = vec3(0.0, 0.0, 0.0);

// constants for atmospheric scattering
const float pi = 3.141592653589793238462643383279502884197169;

const float n = 1.0003; // refractive index of air
const float N = 2.545E25; // number of molecules per unit volume for air at
                            // 288.15K and 1013mb (sea level -45 celsius)
// optical length at zenith for molecules
const float rayleighZenithLength = 8.4E3;
const float mieZenithLength = 1.25E3;
const vec3 up = vec3(0.0, 0.0, 1.0);

// 66 arc seconds -> degrees, and the cosine of that
const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

// 3.0 / ( 16.0 * pi )
const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
// 1.0 / ( 4.0 * pi )
const float ONE_OVER_FOURPI = 0.07957747154594767;

float rayleighPhase(float cosTheta) {
	return THREE_OVER_SIXTEENPI * (1.0 + pow(cosTheta, 2.0));
}

float hgPhase(float cosTheta, float g) {
	float g2 = pow(g, 2.0);
	float inverse = 1.0 / pow(1.0 - 2.0 * g * cosTheta + g2, 1.5);
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
const float cutoffAngle = 1.5 * 1.6110731556870734; // TODO hack
const float steepness = 1.5; // TODO hack
const float EE = 100.0; // TODO hack
float sunIntensity(float zenithAngleCos) {
	zenithAngleCos = clamp(zenithAngleCos, -1.0, 1.0);
	return EE * max(0.0, 1.0 - pow( e, -((cutoffAngle - acos(zenithAngleCos)) / steepness)));
}

float acbrt1(float x0) {
    // union {int ix; float x;};
    int ix;
    float x;
    x = x0;                      // x can be viewed as int.
    ix = ix / 4 + ix / 16;           // Approximate divide by 3.
    ix = ix + ix / 16;
    ix = ix + ix / 256;
    ix = 0x2a5137a0 + ix;        // Initial guess.
    x = 0.33333333 * (2.0 * x + x0 / (x * x));  // Newton step.
    x = 0.33333333 * (2.0 * x + x0 / (x * x));  // Newton step again.
    return x;
}

float sinh(float x) {
    return (exp(x) - exp(-x)) * 0.5;
}

float normN(vec3 v, float n) {
    return pow(
        pow(v.x, n) +
        pow(v.y, n) +
        pow(v.z, n),
        1.0 / n
    );
}

vec3 normalizeN(vec3 v, float n) {
    return v * 1.0 / normN(v, n);
}

vec3 normalizeNRotated(vec3 v, float n) { // }, vec3 f) {
//    float rho = sqrt(f.x * f.x + f.y * f.y + f.z * f.z);
//    float the = acos(f.z / rho);
//    float phi = atan2(f.x, f.y);
    vec3 rotated = ((vMVM * vec4(v, 1.0)).xyz);
    return v * 1.0 / normN(v, n);
}

float dotN(vec3 v1, vec3 v2, float n) {
    return dot(v1, v2) * normN(v1, n) * normN(v2, n) / (normN(v1, 2.0) * normN(v2, 2.0));
}

vec3 project(vec3 distantPoint, vec3 unitVector) {
//    vec3 difference = distantPoint - unitVector;
//    return (difference) - unitVector * dot(difference, unitVector);
    return unitVector + distantPoint - unitVector * dot(distantPoint, unitVector);
}

bool doesCLieOnTheRightOfAB(vec2 a, vec2 b, vec2 c) {
    return (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y) > 0.0;
}

// a = origin
bool isInsideAngle(vec2 x, vec2 a, vec2 b, vec2 c) {
    bool rightAB = doesCLieOnTheRightOfAB(a, b, x);
    bool rightAC = doesCLieOnTheRightOfAB(a, c, x);
    return rightAB != rightAC;
}

// Checking two half-spaces defined by b and c; a is the origin
bool isInsideTri(vec3 x, vec3 a, vec3 b, vec3 c) {
    vec3 leftNormal = cross(a - b, a);
    float leftD = dot(leftNormal, b);
    vec3 rightNormal = cross(a - c, a);
    float rightD = dot(rightNormal, c);

    bool leftPlus  = dot(vec4(leftNormal, leftD), vec4(x, 1.0)) < 0.0;
    bool rightPlus = dot(vec4(rightNormal, rightD), vec4(x, 1.0)) < 0.0;
//    return leftPlus == rightPlus;
    return (c.z - b.z < 0.0);
}

float distanceTo2DIntersection(vec2 x, vec2 origin, vec2 a, vec2 b) {
    // x * p = a + q * b
    // (x*p, y*p) = (a.x + q*b.x, a.y, q*b.y)
    // x*p = a.x + q*b.x
    // y*p = a.y + q*b.y
    float x1 = origin.x;
    float y1 = origin.y;
    float x2 = (a.x + b.x) * 0.5; // x.x;
    float y2 = (a.y + b.y) * 0.5; // x.y;

    float x3 = a.x;
    float y3 = a.y;
    float x4 = b.x;
    float y4 = b.y;

    // Using determinants.
    float y1my2 = y1 - y2; float y3my4 = y3 - y4;
    float x1mx2 = x1 - x2; float x3mx4 = x3 - x4;
    float den = x1mx2 * y3my4 + y1my2 * x3mx4;
    if (den == 0.0 || abs(den) <= 0.0001) return 100000000.0;

    float n1 = x1 * y2 - y1 * x2;
    float n2 = x3 * y4 - y3 * x4;
    float num1 = n1 * (x3mx4) - n2 * (x1mx2);
    float num2 = n1 * (y3my4) - n2 * (y1my2);
    vec2 res = vec2(num1 / den, num2 / den);
    return distance(vec2(0.0), res);
}

float distanceToIntersection(vec3 origin, vec3 x, vec3 a, vec3 b) {
    // Line eq:
    // p = d l + l0
    vec3 l0 = a; // point on the line
    vec3 l = b - a; // line direction

    if (
        acos(dot(a-origin,b-origin)) > acos(dot(x-origin, b-origin)) &&
        acos(dot(a-origin,b-origin)) > acos(dot(a-origin, x-origin)))
        return 2.0;
        else return 20.0;
//    if (b.z - a.z < 0.0) return 2.0;
//    else return 20.0;

    // Plane eq:
    // (p - p0) n = 0
    vec3 p0 = x; // point on the plane
    vec3 n = cross(origin, x); // plane normal

    // Intersection:
    // d l . n + (l0 - p0) . n = 0
    // d = (p0 - l0) . n / (l . n)
    float denum = dot(l, n);
    if (abs(denum) == 0.0)
        return -1.0;

    float d = dot(p0 - l0, n) * 1.0 / denum;

    // Intersection point.
    // d l + l0
    vec3 p = d * l + l0;

    // IMPORTANT! Here we only need the distance
    // from the center to make discontinuities
    return distance(origin, p);
}

void main()
{
    float nPower = 2.0;
    vec3 deltaWorldCamera = normalize(vWorldPosition - cameraPos);
    // 450 000

    // 1. project vWorldPosition on the plane (n=modelView * forwardVector, p = c)
    // 2. compute u = d(pvwp, c), up = vec(u)
    // 3. extinct backface and distance > radius_atmos
    // --
    // 4. if d(plp, c) < radius_atmos:
    //      up = f(forwardVector, plp, vCenter)
    // 5. extinct after radius_atmos
    // TODO hack

                                   // \/ WTF
//    vec3 vc = normalizeN(vCenter - vP2, nPower); // vec3(0.0, -10.0, 0.0); // vCenter;
    vec3 vc = normalizeN(vCenter, nPower); // vec3(0.0, -10.0, 0.0); // vCenter;
    vec3 vf = normalizeN(vForward, nPower);
    vec3 vp = normalizeN(vPosition, nPower);

    vec3 diff = (vp - 1.0 * vc); // TODO hack 1.1 to 2.0 adjust for distance

//    diff *= 0.0001;
//    diff = vPosition - vCenter;

    float ddx = (vp.x - vc.x);
    float ddy = (vp.y - vc.y);
    float ddz = (vp.z - vc.z);

//    ddx = mmax; // ((vp.x - vc.x) > 0.0 ? 1.0 : -1.0) * mmax;
//    ddy = mmax; // ((vp.y - vc.y) > 0.0 ? 1.0 : -1.0) * mmax;
//    ddz = mmax; // ((vp.z - vc.z) > 0.0 ? 1.0 : -1.0) * mmax;

    bool useL4 = true;
    float dL2 = 1.0 * distance(vp, vc);
    float dL4 = 1.0 * pow(pow(ddx, nPower) + pow(ddy, nPower) + pow(ddz, nPower), 1.0 / nPower);
//    nPower = 8.0;
//    float dL8 = 1.0 * pow(pow(vp.x - vc.x, nPower) + pow(vp.y - vc.y, nPower) + pow(vp.z - vc.z, nPower), 1.0 / nPower);

//    diff = diff - vc * dot(diff, vc);
    if (useL4 && false)
    diff = vec3(
        sign(ddx) * pow(ddx, nPower),
        sign(ddy) * pow(ddy, nPower),
        sign(ddz) * pow(ddz, nPower)) * 1.0 / dL4;

    float dd = dotN(vp, vc, nPower);
//    float ac = acos(dd);
//    if (useL4)
//        dd = 0.5 * pi * pow(sin(pi * dd), 1.0);

    float pi2  = 0.5 * pi;
//    diff *= d;
    float dLim = 0.53;
    float deltaD = dL4 - dLim;
    float ccc = 1.0;
//    if (deltaD > 0.0) ccc *= -1.0 / exp(1.0 + deltaD);

// Compute clamped cubic vc-to-vp vector.
    float sphericParameter = exp(-2.0 * ccc * (1.0 + dd) / 2.0);
    float flatParameter = exp(-2.0 * abs(dd));
// Intersect with plane x = vc.x + diameter
// Intersect with plane y = vc.y - diameter
// Intersect with plane z = vc.z + diameter
// Intersect with plane z = vc.z - diameter

// Solve vp*t = +-diameter, then take min on projection <- centered on 0
// Solve vp*t = vc +- diameter, then take min on projection
    // vpx * t = vcx +- diameter => t = vcx+-diameter/vpx
    flatParameter = 0.1;

    float ax = abs(ddx); // abs((vCenter - vPosition).x); // ;
    float ay = abs(ddy); // abs((vCenter - vPosition).y); // ;
    float az = abs(ddz); // abs((vCenter - vPosition).z); // ;
    float ax2 = abs(ddx);
    float ay2 = abs(ddy);
    float az2 = abs(ddz);

// Project cube points on the plane tangent to the unit sphere in (vc).
    float cubeDiameter = 25.0;
    vec3 cps[8];
    // for future version (GL ES 3.0 -> bitwise ops)
    //    for (int i = 0; i < 8; ++i)
    //        cps[i] = vCenter + vec3((i & 1 ? 1 : -1) * cubeDiameter,
    //                                (i >> 1 & 1 ? 1 : -1) * cubeDiameter,
    //                                (i >> 2 & 1 ? 1 : -1) * cubeDiameter);

    cps[0] = vCenter + vec3( cubeDiameter,  cubeDiameter,  cubeDiameter);
    cps[1] = vCenter + vec3(-cubeDiameter,  cubeDiameter,  cubeDiameter);
    cps[2] = vCenter + vec3( cubeDiameter, -cubeDiameter,  cubeDiameter);
    cps[3] = vCenter + vec3(-cubeDiameter, -cubeDiameter,  cubeDiameter);
    cps[4] = vCenter + vec3( cubeDiameter,  cubeDiameter, -cubeDiameter);
    cps[5] = vCenter + vec3(-cubeDiameter,  cubeDiameter, -cubeDiameter);
    cps[5] = vCenter + vec3( cubeDiameter, -cubeDiameter, -cubeDiameter);
    cps[7] = vCenter + vec3(-cubeDiameter, -cubeDiameter, -cubeDiameter);

//    for (int i = 0; i < 8; ++i)
//        cps[i] = project(cps[i], vc);

    vec3 proj = vec3(1.0, 1.0, 1.0);
    vec3 dpv =
//            vc +
        cps[2] - vc * dot(cps[2], vc);
//        cps[2];
//            vPosition - vc * dot(vPosition, vc); // project(vPosition, vc);
//        10.0 * vc + proj - vc * dot(proj, vc);
    vec3 dpc = vCenter - vc * dot(vCenter, vc); // project(vCenter, vc);
    // vec3 dpv = project(vp, vc);
    // Projected vertex = dpv.
    // Projected center = vc.

    vec3 xVector = dpv;
    vec3 yVector = cross(dpv, vc);
//    float xikoerk = 0.0;

// TODO find a 2D uv parametrization
    // Project on 3D plane.
    vec2 xys[8];

    for (int i = 0; i < 8; ++i) {
        xys[i] = vec2(dot(cps[i], xVector), dot(cps[i], yVector));
    }
    vec2 dpv2D =
//    vec2(1.0, 0.0);
     vec2(dot(vp, xVector), dot(vp, yVector));
    vec2 dpc2D =
//    vec2(0.0, 0.0);
     vec2(dot(vc, xVector), dot(vc, yVector));

// Find nearest point angles, then partial convex hull.
// Define distance to center as x times the convex hull position.
// + max if dotProduct < 0
    float dots[8];
    for (int i = 0; i < 8; ++i)
        dots[i] = dot(xys[i], dpv2D);
//        dots[i] = dot(cps[i], dpv);

    // Find positive elements
    // and quadratically determine triangles.

// When WebGL's GLSL is grown up.
    float distanceToShell = -1.0;
    bool mustInvert = false;
    for (int i = 0; i < 8; ++i) {
        if (dots[i] > 0.0) {
            for (int j = 0; j < 8; ++j) {
                if (dots[j] > 0.0 && j > i) {
                    bool invert = dot(xys[i], xys[j]) < 0.0;
                    vec2 A = invert ? xys[j] : xys[i];
                    vec2 B = invert ? xys[i] : xys[j];
//                    if (isInsideTri(dpv, vc, cps[i], cps[j])) {
                    if (isInsideAngle(dpv2D, dpc2D, A, B))
                    {
//                        float newDistance = distanceToIntersection(vc, dpv, cps[i], cps[j]);
                        float newDistance = distanceTo2DIntersection(dpv2D, dpc2D, A, B);
                        if (newDistance > distanceToShell) {
                            mustInvert = false;
                            distanceToShell = newDistance;
                            diff = 10.0 * (normalize(0.5 * (cps[i] + cps[j])) - 1.0 * vc);
                        }
                    }
                }
            }
        }
         else if (dots[i] < 0.0 && false) {
            for (int j = 0; j < 8; ++j) {
                if (dots[j] < 0.0 && j > i) {
                    bool invert = dot(xys[i], xys[j]) < 0.0;
                    vec2 A = invert ? xys[j] : xys[i];

                    vec2 B = invert ? xys[i] : xys[j];
                    if (isInsideAngle(dpv2D, dpc2D, A, B))
                    {
                        float newDistance = distanceTo2DIntersection(dpv2D, dpc2D, A, B);
                        if (newDistance > distanceToShell) {
                            mustInvert = true;
                            distanceToShell = newDistance;
                            diff = 10.0 * (normalize(0.5 * (cps[i] + cps[j])) - 1.0 * vc);
                        }
                    }
                }
            }
        }
    }

// TODO uncomment
//    float distanceToCenter = distance(projectedVertex, cp);
//    float distanceFromCenterToConvexHull = 0.0; // Project center on partial convex hull.
//    float geodesic = distance(vp, cp1);


// Compute convex hull

// Approximation: min distance to cpi.
// TODO something if dot(vc, vp) < 0
//    if (distanceToMinCP > distanceToCenter)
//    flatParameter = distanceToMinCP / (distanceToMinCP + distanceToCenter);

// TODO find spherical parametrization
//    float adjustNorm = 2.0;
//    if (ax > ay && ax > az) {
//        flatParameter = pow(ax2, adjustNorm);
//    }
//    else if (ay > ax && ay > az) {
//        flatParameter = pow(ay2, adjustNorm);
//    }
//    else if (az > ax && az > ay) {
//        flatParameter = pow(az2, adjustNorm);
//    }

    float omega = 2.0;
    if (distanceToShell > 0.0) omega /= (0.01 * distanceToShell); // exp(1.0 + 100.0 * distanceToShell);
    if (mustInvert) omega *= -1.0;

    flatParameter = 2.0 * exp(-20.0 * omega * pow(abs(flatParameter), 1.0));
    float subtract = flatParameter;
    diff -=
//        1.0 / ac;
// TODO hack exp inner factor to adjust for distance
        vc * subtract;
//        0.0;

    float lum = luminance;
    float vsf = vSunfade;

    // TODO remove hack
//    vec3 p1 = vc - vf * dot(vf, vc);
//    vec3 p2 = vp - 1.5 * vc * dot(vc, vp);
//    diff = p2 - vc;

    // TODO hack distance
    // TODO hack up vector (almost it)
    vec3 nup =
//    diff;
       normalizeN(diff, nPower) * 1.0;
//        normalize(vec3(0. 0, 0.0, 1.0));

    // TODO hack sun intensity from intersection
    float vse = vSunE;
    vse = sunIntensity(dot(vSunDirection, nup));
    // TODO compute distance in L-N space
//    if (deltaD > 0.0) vse *= 1.0 / exp(20.0 * deltaD);
//    if (deltaD < -0.02) vse *= 1.0 / exp(-20.0 * deltaD) ;

// optical length
// cutoff angle at 90 to avoid singularity in next formula.
// TODO zenith angle coefficient should be interpolated
    float coeff = 50.0;
    float dotUpDelta = coeff * dot(nup, deltaWorldCamera);
    float cutoff = max(0.0, dotUpDelta);
//	float zenithAngle = acos(cutoff);
// TODO find the right coeff before atan...
	float zenithAngle = 1.05 * atan(-cutoff) + pi * 0.5;
	float inverse = 1.0 / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
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

	vec3 Lin = pow(vse * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * (1.0 - Fex), vec3(1.5));
	Lin *= mix(
	    vec3(1.0),
        pow(vse * ((betaRTheta + betaMTheta) / (vBetaR + vBetaM)) * Fex,
	    vec3(1.0 / 2.0)),
	    clamp(pow(1.0 - dot(nup, vSunDirection), 5.0), 0.0, 1.0)
    );

// nightsky
	vec3 direction = deltaWorldCamera;
	float theta = acos(direction.y); // elevation --> y-axis, [-pi/2, pi/2]
	float phi = atan(direction.z, direction.x); // azimuth --> x-axis [-pi/2, pi/2]
	vec2 uv = vec2(phi, theta) / vec2(2.0 * pi, pi) + vec2(0.5, 0.0);
	vec3 L0 = vec3(0.1) * Fex;

// composition + solar disc
	float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);
	L0 += (vse * 19000.0 * Fex) * sundisk;

	vec3 texColor = (Lin
	+ L0)
//	)
	* 0.04 + vec3(0.0, 0.0003, 0.00075);

	vec3 curr = Uncharted2Tonemap((log2(2.0 / pow(lum, 4.0))) * texColor);
	vec3 color = curr * whiteScale;

	vec3 retColor = pow(color, vec3(1.0 / (1.2 + (1.2 * vsf))));

    // Output color
	gl_FragColor = vec4(retColor, 1.0);

//    gl_FragColor = vec4(1.0, 1.0, dd, 1.0);
//    gl_FragColor = vec4(normalize(nup), 1.0);
//    gl_FragColor = vec4(normalize(diff), 1.0);
//    if (abs(d - dLim) < 0.001)
//	    gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);

    // Dithering
    // TODO put dithering back.
//	float noise = random(vp.xy);
//	float m = mix(-0.5/255.0, 0.5/255.0, noise);
//	gl_FragColor.rgb += vec3(m);
}
