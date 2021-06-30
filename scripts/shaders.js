const vertexShader = `varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const fragmentShaderOwn = `
varying vec2 vUv;
uniform sampler2D s_texture;
uniform float hover;
uniform float opacity;

float exponentialInOut(float t) {
    return t == 0.0 || t == 1.0 ? 
        t : t < 0.5 ?
        +0.5 * pow(2.0, (20.0 * t) - 10.0) : -0.5 * pow(2.0, 10.0 - (t * 20.0)) + 1.0;
}

void main() {
    vec2 uv = vUv;

    // hover effect
    float zoomLevel = .2;
    float hoverLevel = exponentialInOut(min(1., (distance(vec2(.5), uv) * hover) + hover));
    uv *= 1. - zoomLevel * hoverLevel;
    uv += zoomLevel / 2. * hoverLevel;

    uv = clamp(uv, 0., 1.);

    vec4 color = texture2D(s_texture, uv);

    if(hoverLevel > 0.) {
        hoverLevel = 1.-abs(hoverLevel-.5)*2.;
        
        //Pixel displace
        uv.y += color.r * hoverLevel * .05;
        color = texture2D(s_texture, uv);
        
        // RGBshift
        color.r = texture2D(s_texture, uv+(hoverLevel)*0.01).r;
        color.g = texture2D(s_texture, uv-(hoverLevel)*0.01).g;
    }
    //gl_FragColor = color;
    gl_FragColor = mix(vec4(1.,1.,1.,opacity), color, opacity);
}
`;

const fragmentShaderScroll = `
uniform sampler2D tDiffuse;

uniform sampler2D sceneTexture;
uniform vec2 mouse; // not used?
uniform float mouseVelocity; // not used?
uniform float effectVelocity;
varying vec2 vUv;

float map(float value, float inMin, float inMax, float outMin, float outMax) {
    return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main() {
    vec2 uv = vUv;
    vec4 itexture = texture2D(tDiffuse, uv);

    float curveLevel = min(1., effectVelocity *.5);
    float nUvY = pow(1.- uv.y * 1.2, 10.) * curveLevel;
    
    if(nUvY < .001) {
        gl_FragColor = texture2D(tDiffuse, uv);
    } else {
        float curve = max(0., nUvY) + 1.;
        curve = map(curve, 1., 5., 1., 2.);
        uv.x = uv.x/curve + ((curve - 1.)/2./curve);
        
        //Curve generation
        itexture = texture2D(tDiffuse, clamp(uv, vec2(0.), vec2(1.)));
        
        //Pixel displace
        uv.y += itexture.r * nUvY * .7;
        if(uv.y < 1.) itexture = texture2D(tDiffuse, uv);

        // RGB shift
        uv.y += 0.15 * nUvY;
        if(uv.y < 1.) itexture.g = texture2D(tDiffuse, uv).g;
        
        uv.y += 0.10 * nUvY;
        if(uv.y < 1.) itexture.b = texture2D(tDiffuse, uv).b;
        
        
        gl_FragColor = itexture;
    }
}
`;

const fragmentShaderSimple = `
#include <common>
 
uniform vec3 iResolution;
uniform float iTime;
 
// By iq: https://www.shadertoy.com/user/iq  
// license: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
 
    // Time varying pixel color
    vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
 
    // Output to screen
    fragColor = vec4(col,1.0);
}
 
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

const fragmentShaderOrig = `uniform sampler2D itexture;
uniform float imageAspectRatio;
uniform float aspectRatio;
uniform float opacity;
uniform float hover;
varying vec2 vUv;

float exponentialInOut(float t) {
    return t == 0.0 || t == 1.0 ? 
        t : t < 0.5 ?
        +0.5 * pow(2.0, (20.0 * t) - 10.0) : -0.5 * pow(2.0, 10.0 - (t * 20.0)) + 1.0;
}

void main() {
    vec2 uv = vUv;
    // fix aspectRatio
    float u = imageAspectRatio/aspectRatio;
    if(imageAspectRatio > aspectRatio) {
        u = 1. / u;
    }
    
    uv.y *= u;
    uv.y -= (u)/2.-.5;
    
    // hover effect
    float zoomLevel = .2;
    float hoverLevel = exponentialInOut(min(1., (distance(vec2(.5), uv) * hover) + hover));
    uv *= 1. - zoomLevel * hoverLevel;
    uv += zoomLevel / 2. * hoverLevel;
    
    uv = clamp(uv, 0., 1.);
    
    vec4 color = texture2D(itexture, uv);
    if(hoverLevel > 0.) {
        hoverLevel = 1.-abs(hoverLevel-.5)*2.;
        
        //Pixel displace
        uv.y += color.r * hoverLevel * .05;
        color = texture2D(itexture, uv);
        
        // RGBshift
        color.r = texture2D(itexture, uv+(hoverLevel)*0.01).r;
        color.g = texture2D(itexture, uv-(hoverLevel)*0.01).g;
    }
    
    gl_FragColor = mix(vec4(1.,1.,1.,opacity), color, opacity);
    
}
`;