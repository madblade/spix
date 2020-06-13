/* To use with RingBufferGeometry */
/* Example:
var ringGeometry = new THREE.RingBufferGeometry(
    5, 13, 20, 1, 0, Math.PI
);
var material = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 1.0 },
        outerRadius: { value: 13.0 },
        innerRadius: { value: 5.0 }
    },
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent,
    side: THREE.DoubleSide,
    transparent: true
});
// Time from 0. to 1.: ring appears
// Time from 1. to 2.: inner ring continues to spin
// Linear time interpolation.
*/

uniform float time;
uniform float outerRadius;
uniform float innerRadius;
varying vec3 vPosition;
varying vec2 vUv;
const float PI = 3.1415926535897932384626433832795;

// Same noise fn as usual
float rand(vec2 n)
{
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

// From https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float noise(vec2 p)
{
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0 - 2.0 * u);
    float res = mix(
        mix(
            rand(ip),
            rand(ip + vec2(1.0, 0.0)),
            u.x
        ),
        mix(
            rand(ip + vec2(0.0, 1.0)),
            rand(ip + vec2(1.0, 1.0)),
            u.x
        ),
        u.y
    );
    return res*res;
}

// Sekiro inspired
void main()
{
    float x = vPosition.x;
    float y = vPosition.y;
    float opacity = 1.0;

    float ringWidth = outerRadius - innerRadius;
    float dist = distance(vPosition.xy, vec2(0.0));
    float distanceFromTop = (outerRadius - dist) / ringWidth;

    float numberOfStripes = 7.0;
    float stripeWidth = ringWidth / numberOfStripes;
    float distanceFromTopI = (outerRadius - stripeWidth - dist) / (ringWidth - stripeWidth);

    float stripeId = floor(mod(distanceFromTop * numberOfStripes, numberOfStripes));

    float isOuterStripe = step(stripeId, 0.0);

    float multStripe = 1.0 * PI; // 0.1 * isOuterStripe;
    float angle = atan(y, x);
    float distanceFromStart = angle + clamp(time * multStripe, 0.0, PI - 0.32) + 0.0; //+ offsetStripe;

    float isHead = step(distanceFromStart, PI);
    float isTail = step(PI - angle, 0.32);

    // opacity = sin(PI * fract(distanceFromTop * numberOfStripes));
    opacity = 1.0;

    float d = distanceFromStart / PI;
    float edge = 0.9;
    d = 1.0 - max(d - edge, 0.0) / (1.0 - edge);
    float isIn = step(0.0, d - edge - 0.1);
    opacity -= isHead * d * d; // * sin(PI * fract(distanceFromStart));
    opacity -= isHead * isOuterStripe * d * d;
    float d2 = 1.0 - (PI - angle) / 0.32;
    opacity -= isTail * pow(d2 * d2, 4.0);

    float smoothOuterStripeEdges = 1.0 - sin(PI * fract(distanceFromTop * numberOfStripes));
    opacity -= isOuterStripe * smoothOuterStripeEdges;

    float chi = sin(PI * fract((distanceFromTopI) * (1.0)));
    // x3 e-x/2
    //float chi = 1.0 - fract((distanceFromTopI) * (1.0));
    //chi = pow(chi, 3.0) * exp(-chi * chi);
    float smoothSecondStripeEdges = 1.0 - pow(chi, 0.5);
    opacity -= (1.0 - isOuterStripe) * (smoothSecondStripeEdges + 0.2);

    opacity -= (1.0 - isIn) * (1.0 - isOuterStripe) *
        noise(vec2(
            distanceFromTop * ringWidth * 9.0,
            (distanceFromStart + clamp(time * multStripe - PI + 0.4, 0.0, PI)) * 2.0
        ));

    gl_FragColor = vec4(1.0, 1.0, 1.0, opacity);
}
