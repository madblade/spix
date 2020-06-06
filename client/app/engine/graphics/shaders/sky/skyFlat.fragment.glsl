precision mediump float;

varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying float vSunfade;
varying vec3 vBetaR;
varying vec3 vBetaM;
varying float vSunE;

uniform float luminance;
uniform float mieDirectionalG;
const vec3 up = vec3(0.0, 0.0, 1.0);

const vec3 cameraPos = vec3( 0.0, 0.0, 0.0 );

// constants for atmospheric scattering
const float pi = 3.141592653589793238462643383279502884197169;

// optical length at zenith for molecules
const float rayleighZenithLength = 8.4E3;
const float mieZenithLength = 1.25E3;
// 66 arc seconds -> degrees, and the cosine of that
const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
const float ONE_OVER_FOURPI = 0.07957747154594767;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayleighPhase( float cosTheta ) {
    return THREE_OVER_SIXTEENPI * ( 1.0 + pow( abs(cosTheta), 2.0 ) );
}

float hgPhase( float cosTheta, float g ) {
    float g2 = pow( abs(g), 2.0 );
    float inverse = 1.0 / pow( abs(1.0 - 2.0 * g * cosTheta + g2), 1.5 );
    return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
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
    return ( ( x * ( A * x + C * B ) + D * E ) / ( x * ( A * x + B ) + D * F ) ) - E / F;
}


void main() {

    vec3 direction = normalize( vWorldPosition - cameraPos );

// night starry sky
    bool closeToHorizon = false;
    float vse = vSunE;
    float fafa = 100.0;
    float fdx = floor(direction.x * fafa + 0.5);
    float fdy = floor(direction.y * fafa + 0.5);
    float fdz = floor(direction.z * fafa + 0.5);
    float d = distance(direction, (1.0 / fafa) * (vec3(fdx, fdy, fdz)));
    float proba = random(vec2(fdx * fdz, fdy));
    float probaMax = mix(0.05, 0.00, 0.001 * vSunE);
    float dMax = mix(0.002, 0.00, 0.001 * vSunE);
    if (d < dMax && proba < probaMax && direction.z > 0.0) {
        // if (d < 0.002 && proba < 0.05) // from 0.05 to 0.005
    	vse = max(vSunE, 20.0 * proba * 500.0);
    	closeToHorizon = vSunDirection.z < 0.1; // ? 0.1 - vSunDirection.y : 0.0;
    }

// optical length
// cutoff angle at 90 to avoid singularity in next formula.
    float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
    float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( abs(93.885 - ( ( zenithAngle * 180.0 ) / pi )), -1.253 ) );
    float sR = rayleighZenithLength * inverse;
    float sM = mieZenithLength * inverse;

// combined extinction factor
    vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

// in scattering
    float cosTheta = dot( direction, vSunDirection );

    float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
    vec3 betaRTheta = vBetaR * rPhase;

    float mPhase = hgPhase( cosTheta, mieDirectionalG );
    vec3 betaMTheta = vBetaM * mPhase;

    vec3 Lin = pow( abs(vse * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex )), vec3( 1.5 ) );
    Lin *= mix(
        vec3( 1.0 ),
        pow( abs(vse * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex),
        vec3( 1.0 / 2.0 ) ),
        clamp( pow( abs(1.0 - dot( up, vSunDirection )), 5.0 ), 0.0, 1.0 )
    );

// nightsky
    vec3 L0 = vec3( 0.1 ) * Fex;

// composition + solar disc
    float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
    L0 += ( vse * 19000.0 * Fex ) * sundisk;

    vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

    vec3 curr = Uncharted2Tonemap( ( log2( 2.0 / pow( abs(luminance), 4.0 ) ) ) * texColor );
    vec3 color = curr * whiteScale;

    vec3 retColor = pow( abs(color), vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

// starry sky colorfix
    if (closeToHorizon) {
        float mean = (retColor.x + retColor.y + retColor.z) / 3.0;
        retColor = vec3(mean);
    }

	gl_FragColor = vec4( retColor, 1.0 );

    // quick dithering pass
    vec3 vp = vSunDirection; // normalize(vWorldPosition);
    float noise = random(vp.xy);
    float m = mix(-0.5 / 255.0, 0.5 / 255.0, noise);
    gl_FragColor.rgb += 1.0 * vec3(m);
}
