#version 300 es
precision highp float;

#include "@motion-canvas/core/shaders/common.glsl"

uniform vec4 mixColor;
uniform float mixStrength;
uniform float distFactor;
uniform vec2 position;

void main() {
    // Sample the texture
    outColor = texture(sourceTexture, sourceUV);

    float px = position.x / resolution.x + 0.5;
    float py = position.y / resolution.y + 0.5;

    // Calculate distance from the center (0.5, 0.5)
    float dist = distance(sourceUV, vec2(px, py));

    dist /= distFactor;

    // We want a stronger mix near the center, so we can invert the distance.
    // Clamp the distance to 0.0 to 1.0 range for more control.
    float mixFactor = 1.0 - clamp(dist * 2.0, 0.0, 1.0); // Multiply distance by 2 to make the effect sharper

    mixFactor *= mixStrength;

    // Mix the sampled texture color with the mixColor, based on the mixFactor
    outColor.rgb = mix(outColor.rgb, mixColor.rgb, mixFactor);
}
