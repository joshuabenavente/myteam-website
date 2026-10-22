/**
 * Adapted from https://www.shadertoy.com/view/DdcfzH
 * Copyright © 2023 Benjamin Weschler.
 * Inspired by https://www.shadertoy.com/view/wdyczG
 * Licensed under CC BY-NC-SA 3.0:
 * https://creativecommons.org/licenses/by-nc-sa/3.0/
 * Changes: team-color uniforms, a darker text-safe palette, slower animation,
 * WebGL entry point, and a defined (ascending-edge) vertical smoothstep.
 */
export const headerFragmentShader = `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uDark;
uniform vec3 uMid;
uniform vec3 uAccent;

mat2 Rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
    return fract(sin(p) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    float n = mix(mix(dot(-1.0+2.0*hash(i), f),
        dot(-1.0+2.0*hash(i+vec2(1.0, 0.0)), f-vec2(1.0, 0.0)), u.x),
        mix(dot(-1.0+2.0*hash(i+vec2(0.0, 1.0)), f-vec2(0.0, 1.0)),
        dot(-1.0+2.0*hash(i+vec2(1.0)), f-vec2(1.0)), u.x), u.y);
    return 0.5 + 0.5*n;
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution;
    float aspectRatio = iResolution.x / iResolution.y;
    vec2 tuv = uv - 0.5;
    float degree = noise(vec2(iTime*0.05, tuv.x*tuv.y));
    tuv.y /= aspectRatio;
    tuv *= Rot(radians((degree-0.5)*720.0+180.0));
    tuv.y *= aspectRatio;
    float speed = iTime * 2.0;
    tuv.x += sin(tuv.y*5.0+speed)/30.0;
    tuv.y += sin(tuv.x*7.5+speed)/15.0;

    float cycle = sin(iTime * 0.5);
    float t = (sign(cycle)*pow(abs(cycle), 0.6)+1.0)/2.0;
    vec3 color1 = mix(uMid, mix(uDark, uAccent, 0.24), t);
    vec3 color2 = mix(uDark, uMid*0.55, t);
    vec3 color3 = mix(mix(uDark, uAccent, 0.30), uMid, t);
    vec3 color4 = mix(uMid*0.75, mix(uDark, uAccent, 0.18), t);
    float blend = smoothstep(-0.3, 0.2, (tuv*Rot(radians(-5.0))).x);
    vec3 layer1 = mix(color3, color2, blend);
    vec3 layer2 = mix(color4, color1, blend);
    vec3 color = mix(layer1, layer2, 1.0-smoothstep(-0.3, 0.5, tuv.y));
    color -= length(hash(gl_FragCoord.xy))*0.035;
    // Keep white labels readable throughout the animation and every team palette.
    float luminance = dot(max(color, vec3(0.0)), vec3(0.2126, 0.7152, 0.0722));
    color *= min(1.0, 0.38/max(luminance, 0.001));
    gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
}
`

export const headerVertexShader = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`
