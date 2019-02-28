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
//varying mat4 vMVM;
//varying mat4 vPM;
varying vec3 vUp;
varying vec3 vPP;

// uniform mat4 viewInverse;
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

//float acbrt1(float x0) {
//    // union {int ix; float x;};
//    int ix;
//    float x;
//    x = x0;                      // x can be viewed as int.
//    ix = ix / 4 + ix / 16;           // Approximate divide by 3.
//    ix = ix + ix / 16;
//    ix = ix + ix / 256;
//    ix = 0x2a5137a0 + ix;        // Initial guess.
//    x = 0.33333333 * (2.0 * x + x0 / (x * x));  // Newton step.
//    x = 0.33333333 * (2.0 * x + x0 / (x * x));  // Newton step again.
//    return x;
//}

//float sinh(float x) {
//    return (exp(x) - exp(-x)) * 0.5;
//}

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

// float dotN(vec3 v1, vec3 v2, float n) {
//     return dot(v1, v2) * normN(v1, n) * normN(v2, n) / (normN(v1, 2.0) * normN(v2, 2.0));
// }

//vec3 project(vec3 distantPoint, vec3 unitVector) {
//    return unitVector + distantPoint - unitVector * dot(distantPoint, unitVector);
//}

bool doesCLieOnTheRightOfAB(vec2 a, vec2 b, vec2 c) {
    return (a.x - c.x) * (b.y - c.y) - (b.x - c.x) * (a.y - c.y) > 0.0;
}

// a = origin
bool isInsideAngle(vec2 x, vec2 a, vec2 b, vec2 c) {
    float norm1 = distance(vec2(0), b - a);
    float norm2 = distance(vec2(0), c - a);
    float dot1 = dot(b - a, c - a) / (norm1 * norm2);
    if (dot1 < -1.0) return false;

    // float dot1 = dot(x, b);
    // float dot2 = dot(x, c);
    // if (dot1 < 0.0 || dot2 < 0.0) return false; // discard inverted angles

    bool rightAB = doesCLieOnTheRightOfAB(a, b, x);
    bool rightAC = doesCLieOnTheRightOfAB(a, c, x);
    return rightAB != rightAC;
}

float distanceTo2DHalf(vec2 origin, vec2 a, vec2 b) {
    float x1 = origin.x;
    float y1 = origin.y;
    float x2 = (a.x + b.x) * 0.5;
    float y2 = (a.y + b.y) * 0.5;
    return sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
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
    if (den == 0.0 || abs(den) <= 0.0001) return -1.0;

    float n1 = x1 * y2 - y1 * x2;
    float n2 = x3 * y4 - y3 * x4;
    float num1 = n1 * (x3mx4) - n2 * (x1mx2);
    float num2 = n1 * (y3my4) - n2 * (y1my2);
    vec2 res = vec2(num1 / den, num2 / den);

    float dx = res.x - o.x;
    float dy = res.y - o.y;

    return sqrt(dx * dx + dy * dy);
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

                                   // \/ WTF
    vec3 vc = normalizeN(vCenter, nPower);
    vec3 vp = normalizeN(vPosition, nPower);

    vec3 diff = (vp - 1.0 * vc); // TODO hack 1.1 to 2.0 adjust for distance

//    float dd = dotN(vp, vc, nPower);
//    diff *= d;
//    float ccc = 1.0;

// Compute clamped cubic vc-to-vp vector.
//    float sphericParameter = exp(-2.0 * ccc * (1.0 + dd) / 2.0);

//    float flatParameter = exp(-2.0 * abs(dd));
    float flatParameter = 0.1;


// Project cube points on the plane tangent to the unit sphere in (vc).
    float cubeDiameter = 25.0;
    vec3 cps[8];
    // for future version (GL ES 3.0 -> bitwise ops)
    //    for (int i = 0; i < 8; ++i)
    //        cps[i] = vCenter + vec3((i & 1 ? 1 : -1) * cubeDiameter,
    //                                (i >> 1 & 1 ? 1 : -1) * cubeDiameter,
    //                                (i >> 2 & 1 ? 1 : -1) * cubeDiameter);

// TODO switch here for gagaga
    vec3 center = vCenter;
//     vPP;
    cps[0] = center + vec3( cubeDiameter,  cubeDiameter,  cubeDiameter);
    cps[1] = center + vec3(-cubeDiameter,  cubeDiameter,  cubeDiameter);
    cps[2] = center + vec3( cubeDiameter, -cubeDiameter,  cubeDiameter);
    cps[3] = center + vec3(-cubeDiameter, -cubeDiameter,  cubeDiameter);
    cps[4] = center + vec3( cubeDiameter,  cubeDiameter, -cubeDiameter);
    cps[5] = center + vec3(-cubeDiameter,  cubeDiameter, -cubeDiameter);
    cps[6] = center + vec3( cubeDiameter, -cubeDiameter, -cubeDiameter);
    cps[7] = center + vec3(-cubeDiameter, -cubeDiameter, -cubeDiameter);

    // Deprojection
    float nmf = 50000.0;
    vec3 tcenter = vc;
    for (int i = 0; i < 8; ++i) {
        vec3 currentC = cps[i];
        // vc <- vf
        float alpha = dot(currentC, tcenter);
        float R = abs(alpha) > 0.000000001 ? nmf / alpha : 1000000.0; // (far - near) / (2.0 * alpha)
        vec3 yc = currentC - dot(currentC, tcenter) * tcenter;
        cps[i] = currentC + yc * (R - 1.0);
    }

    vec3 cProj = vCenter;


    vec3 proj = vec3(1.0, 1.0, 1.0);
    vec3 dpv =
        0.5 * (cps[0] + cps[1]) - vc * dot(0.5 * (cps[0] + cps[1]), vc);
    vec3 dpc = cProj - vc * dot(cProj, vc);
    // Projected vertex = dpv.
    // Projected center = vc.

    vec3 xVector = dpv;
    vec3 yVector = cross(dpv, vc);

    // Project on 2D plane.
    vec2 xys2[8];

// Begin Change nil/2
    vec2 dpc2D2 = vec2(dot(vc, xVector), dot(vc, yVector));
    vec2 dpv2D2 = vec2(dot(vp, xVector), dot(vp, yVector));
    for (int i = 0; i < 8; ++i) {
        xys2[i] = vec2(dot(cps[i], xVector), dot(cps[i], yVector));
    }
// End Change nil/2

    // Find nearest point angles, then partial convex hull.
    // Define distance to center as x times the convex hull position.
    // + max if dotProduct < 0
    float dots2[8];
    for (int i = 0; i < 8; ++i)
        dots2[i] = (dot(xys2[i], dpv2D2) / (distance(vec2(0), xys2[i]) * distance(vec2(0), dpv2D2)));
        // TODO check if this last division is necessary

    bool mustInvert = false;
    float distanceToShell = -1.0;
    float tempDistance = -1.0;

    // Find positive elements and quadratically determine segments.
    // I found it! allow all dots, but filter afterwards
    float minDotValue = -0.5; // 100000000000.0;

    int bestI = 0;
    int bestJ = 0;

    vec2 bestA;
    vec2 bestB;
    for (int i = 0; i < 8; ++i) {
        if (dots2[i] > minDotValue) {
            for (int j = 0; j < 8; ++j) {
                if (dots2[j] > minDotValue && j > i) {
                    vec2 A2 = xys2[i];
                    vec2 B2 = xys2[j];
                    if (isInsideAngle(dpv2D2, dpc2D2, A2, B2))
                    {
                        float newDistance = distanceTo2DIntersection(dpv2D2, dpc2D2, A2, B2);
                        if (newDistance > tempDistance) {
                            bestI = i; // bestA = A2;
                            bestJ = j; // bestB = B2;
                            bestA = xys2[i];
                            bestB = xys2[j];
                            tempDistance = newDistance;
                        }
                    }
                }
            }
        }
    }

    float dotNA = dot(normalize(bestA), dpv2D2);
    float dotNB = dot(normalize(bestB), dpv2D2);
    bool whichOne = dotNA > dotNB;
    vec2 interpolatorEnd = whichOne ? normalize(bestA) : normalize(bestB);
    vec2 middle = 0.5 * (bestA + bestB);

    float dotNE = dot(normalize(middle), normalize(interpolatorEnd));
    float dotNC = dot(normalize(middle), normalize(dpv2D2));
    float dotEV = dot(normalize(interpolatorEnd), normalize(dpv2D2));

    // TODO find a function that is 1 at dpv2D2=interpolatorEnd and 0 at dpv2D2=middle
    float interpolatorFactor = pow((dotEV - dotNE), 1.0);

    {
        distanceToShell = distanceTo2DHalf(dpc2D2, bestA, bestB);

        // diff = 10.0 * (normalize(0.5 * (cps[i] + cps[j])) - 1.0 * vc);
        vec2 bestSegment = -bestA + bestB;
        vec2 orthoBestSegment = normalize(vec2(bestSegment.y, -bestSegment.x));
        float orientationBestSegment = dot(orthoBestSegment, bestA) > 0.0 ? 1.0 : -1.0;

        float otherMeuhDot = dot(dpv2D2, interpolatorEnd) > 0.0 ? 1.0 : -1.0;

        float iF = 1.0 * interpolatorFactor;
        vec3 meumeuh =
            (1.0 - iF) * (center + orientationBestSegment * (xVector * orthoBestSegment.x + yVector * orthoBestSegment.y))
            + (iF) * (center + otherMeuhDot * (xVector * interpolatorEnd.x + yVector * interpolatorEnd.y));
//;

        diff = 5.0 * (normalize((meumeuh))); //  - 1.0 * vc);
        // diff = 2.0 * (normalize(cross(cps[i] - cps[j], vc)));
        // diff = 2.0 * (normalize(0.5 * (cps[i] + cps[j]))); //  - 1.0 * vc);
    }

    float omega = 2.0;
    if (distanceToShell > 0.0) omega /= (0.01 * distanceToShell); // exp(1.0 + 100.0 * distanceToShell);
    if (mustInvert) omega *= -1.0;

    flatParameter = 2.0 * exp(-20.0 * omega * pow(abs(flatParameter), 1.0));
    float subtract = flatParameter;
    diff -=
//        1.0 / ac;
// TODO hack exp inner factor to adjust for distance
        vc * subtract;

    float lum = luminance;
    float vsf = vSunfade;

    // TODO hack distance
    vec3 nup = normalizeN(diff, nPower) * 1.0;

    // TODO hack sun intensity from intersection
    float vse = vSunE;
    vse = sunIntensity(dot(vSunDirection, nup));

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

	vec3 texColor = (Lin + L0) * 0.04 + vec3(0.0, 0.0003, 0.00075);

	vec3 curr = Uncharted2Tonemap((log2(2.0 / pow(lum, 4.0))) * texColor);
	vec3 color = curr * whiteScale;

	vec3 retColor = pow(color, vec3(1.0 / (1.2 + (1.2 * vsf))));

//    retColor = vec3(1.0, 0.0, exp(-interpolatorFactor));

	gl_FragColor = vec4(retColor, 1.0);
//    for (int i = 0; i < 8; ++i) {
//        if (distance(normalize(dpv2D2), normalize(xys2[i])) < 0.01)
//            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
//    }




    // Dithering
    // TODO put dithering back.
	float noise = random(vp.xy);
	float m = mix(-0.5/255.0, 0.5/255.0, noise);
	gl_FragColor.rgb += 10.0 * vec3(m);
}