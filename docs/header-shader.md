# Team header shader attribution

The team header background adapts [DdcfzH](https://www.shadertoy.com/view/DdcfzH),
Copyright © 2023 Benjamin Weschler, inspired by
[wdyczG](https://www.shadertoy.com/view/wdyczG).

The adapted shader in `src/shaders/teamHeader.ts` is licensed under the
[Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License](https://creativecommons.org/licenses/by-nc-sa/3.0/).
This license applies to the adapted shader; it does not relicense unrelated application code.
The source's noncommercial restriction remains in effect.

Changes replace the original light/dark palettes with team colors, darken the
output for header text, slow animation, stabilize film grain in pixel space,
and replace reversed smoothstep edges with their defined equivalent.
The renderer adds bounded resolution and frame rate, reduced-motion support,
visibility pausing, resize handling, and a CSS fallback when WebGL is unavailable.

The existing `?tune=1` CSS gradient preview remains available unchanged.
