precision mediump float;

uniform vec3 sunPosition;
uniform float rayleigh;
uniform float turbidity;
uniform float mieCoefficient;
uniform vec3 cameraPos;

varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying float vSunfade;
varying vec3 vBetaR;
varying vec3 vBetaM;
varying vec3 vCenter;

varying vec3 cps[8];
varying vec3 cps2[8];

uniform vec3 worldCenter; // = vec3(-100.0, 100.0, 50.0);
uniform float cubeRadius; // = 50.0;
//const vec3 up = vec3(0.0, 0.0, 1.0);

// constants for atmospheric scattering
//const float e = 2.71828182845904523536028747135266249775724709369995957;
//const float pi = 3.141592653589793238462643383279502884197169;

// wavelength of used primaries, according to preetham
const vec3 lambda = vec3(680E-9, 550E-9, 450E-9);
// this pre-calcuation replaces older TotalRayleigh(vec3 lambda) function:
// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
const vec3 totalRayleigh = vec3(5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5);

// mie stuff
// K coefficient for the primaries
//const float v = 4.0;
//const vec3 K = vec3(0.686, 0.678, 0.666);
// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
const vec3 MieConst = vec3(1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14);

// earth shadow hack
// cutoffAngle = pi / 1.95;
const float cutoffAngle = 1.6110731556870734;
const float steepness = 1.5;
const float EE = 1000.0;

vec3 totalMie(float T) {
    float c = (0.2 * T) * 10E-18;
    return 0.434 * c * MieConst;
}

void main()
{
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vCenter = (vec4(
        worldCenter.x - modelMatrix[3][0],
        worldCenter.y - modelMatrix[3][1],
        worldCenter.z - modelMatrix[3][2],
         1.0)).xyz;

    gl_Position.z = gl_Position.w; // set z to camera.far

    vSunDirection = normalize(sunPosition);

//    float cubeRadius = 12.5;
//    cubeRadius *= 2.0;

    // night
    vec3 centerToCamera = cameraPos - worldCenter;
    float cx = centerToCamera.x; float acx = abs(cx);
    float cy = centerToCamera.y; float acy = abs(cy);
    float cz = centerToCamera.z; float acz = abs(cz);
    bool isX = acx > acy && acx > acz;
    bool isY = acy > acx && acy > acz;
    bool isZ = !isX && !isY;
    vec3 nsp = normalize(sunPosition);
    float projection = isX ? sign(cx) * nsp.x : isY ? sign(cy) * nsp.y : sign(cz) * nsp.z;
//	vSunfade = 1.0 - clamp(1.0 - exp((sunPosition.y / 450000.0)), 0.0, 1.0);
//	vSunfade = 1.0 - clamp(1.0 - exp(projection / 150000.0), 0.0, 1.0);
    vSunfade = 1.0 - 1.0 * clamp(1.0 - exp(projection), 0.0, 1.0);
//    vSunfade = isZ ? 1.0 : 0.0;

    float rayleighCoefficient = rayleigh - (1.0 * (1.0 - vSunfade));

// extinction (absorbtion + out scattering)
// rayleigh coefficients
    vBetaR = totalRayleigh * rayleighCoefficient;

// mie coefficients
    vBetaM = totalMie(turbidity) * mieCoefficient;

// pass center coordinates
    vec3 center = vCenter;
    cps2[0] = center + vec3( cubeRadius,  cubeRadius,  cubeRadius);
    cps2[1] = center + vec3(-cubeRadius,  cubeRadius,  cubeRadius);
    cps2[2] = center + vec3( cubeRadius, -cubeRadius,  cubeRadius);
    cps2[3] = center + vec3(-cubeRadius, -cubeRadius,  cubeRadius);
    cps2[4] = center + vec3( cubeRadius,  cubeRadius, -cubeRadius);
    cps2[5] = center + vec3(-cubeRadius,  cubeRadius, -cubeRadius);
    cps2[6] = center + vec3( cubeRadius, -cubeRadius, -cubeRadius);
    cps2[7] = center + vec3(-cubeRadius, -cubeRadius, -cubeRadius);

    // Deprojection (should not depend on fov or near/far planes).
    // Used for computing the right part of the projected convex hull.
    float near = 0.1;
    float far = 20000.0;
    float fmn = far - near;
    vec3 tcenter = normalize(vCenter);
    for (int i = 0; i < 8; ++i) {
        vec3 currentC = 1.0 * (cps2[i] - center) + center;
        float alpha = dot(currentC, tcenter);
        float beta = dot(normalize(currentC), normalize(tcenter));
        float R = beta < 0.1 ? fmn : fmn / alpha;
        vec3 yc = currentC - alpha * tcenter;
        cps[i] = currentC + yc * (R - 1.0);
    }
}
