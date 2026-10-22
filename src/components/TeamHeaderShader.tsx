import { useEffect, useRef, useState } from 'react'
import type { TeamTheme } from '../lib/teamColors.ts'
import { headerFragmentShader, headerVertexShader } from '../shaders/teamHeader.ts'

/** Decorative only: the CSS gradient stays underneath if WebGL is unavailable. */
export function TeamHeaderShader({ theme }: { theme: TeamTheme }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' })
    if (!gl) return

    const shaders: WebGLShader[] = []
    const program = gl.createProgram()
    const buffer = gl.createBuffer()
    const dispose = () => {
      if (buffer) gl.deleteBuffer(buffer)
      if (program) gl.deleteProgram(program)
      shaders.forEach((shader) => gl.deleteShader(shader))
    }
    if (!program || !buffer) { dispose(); return }
    for (const [type, source] of [[gl.VERTEX_SHADER, headerVertexShader], [gl.FRAGMENT_SHADER, headerFragmentShader]] as const) {
      const shader = gl.createShader(type)
      if (!shader) { dispose(); return }
      shaders.push(shader)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { dispose(); return }
      gl.attachShader(program, shader)
    }
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { dispose(); return }
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    for (const [name, hex] of [['uDark', theme.dark], ['uMid', theme.mid], ['uAccent', theme.accent]]) {
      gl.uniform3fv(gl.getUniformLocation(program, name), [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255))
    }
    const resolution = gl.getUniformLocation(program, 'iResolution')
    const time = gl.getUniformLocation(program, 'iTime')
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let elapsed = 8
    let previous = 0
    let inView = true
    let lost = false
    const draw = () => {
      if (lost) return
      // Bound GPU work on high-density mobile displays and wide monitors.
      const scale = Math.min(devicePixelRatio || 1, 1.5, 1600 / Math.max(canvas.clientWidth, 1))
      const width = Math.max(1, Math.round(canvas.clientWidth * scale))
      const height = Math.max(1, Math.round(canvas.clientHeight * scale))
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
      gl.viewport(0, 0, width, height)
      gl.uniform2f(resolution, width, height)
      gl.uniform1f(time, elapsed)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      canvas.style.opacity = '1'
      canvas.dataset.ready = 'true'
    }
    const tick = (now: number) => {
      if (!previous || now - previous >= 1000 / 30) {
        if (previous) elapsed += Math.min(now - previous, 100) / 1000 * 0.35
        previous = now
        draw()
      }
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      cancelAnimationFrame(frame)
      previous = 0
      if (lost || document.hidden || !inView) return
      draw()
      if (!motion.matches) frame = requestAnimationFrame(tick)
    }
    const resize = new ResizeObserver(sync)
    resize.observe(canvas)
    const intersection = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync() })
    intersection.observe(canvas)
    const onLost = (event: Event) => {
      event.preventDefault()
      lost = true
      canvas.style.opacity = '0'
      delete canvas.dataset.ready
      cancelAnimationFrame(frame)
    }
    const onRestored = () => setGeneration((n) => n + 1)
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)
    document.addEventListener('visibilitychange', sync)
    motion.addEventListener('change', sync)
    sync()
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      intersection.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      document.removeEventListener('visibilitychange', sync)
      motion.removeEventListener('change', sync)
      canvas.style.opacity = '0'
      delete canvas.dataset.ready
      dispose()
    }
  }, [theme.dark, theme.mid, theme.accent, generation])

  return <canvas ref={ref} className="team-header-shader" aria-hidden="true" />
}
