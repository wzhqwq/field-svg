import { useEffect, useRef, useState } from "react"
import { StrengthCalculator } from "./strength"

const width = 800
const height = 800

function App() {
  const svgRef = useRef<SVGSVGElement>(null)

  const modeRef = useRef(0)
  const calculatorRef = useRef<StrengthCalculator | null>(null)

  useEffect(() => {
    if (svgRef.current) {
      const svg = svgRef.current
      calculatorRef.current = new StrengthCalculator(svg)
    }

    const handleClick = (event: MouseEvent) => {
      if (modeRef.current == 0) return
      if (calculatorRef.current) {
        const rect = svgRef.current?.getBoundingClientRect()
        const x = event.clientX - (rect?.left || 0)
        const y = event.clientY - (rect?.top || 0)
        if (modeRef.current == 1) {
          calculatorRef.current.addParticle(x, y)
        } else if (modeRef.current == 2) {
          calculatorRef.current.addSurfacePoint(x, y)
        }
      }
    }

    window.addEventListener("click", handleClick)
    return () => {
      window.removeEventListener("click", handleClick)
    }
  }, [])

  return (
    <>
      <svg ref={svgRef} width={width} height={height}>
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX={7}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto"
          >
            <polygon points="0 0, 10 5, 0 10" fill="black" />
          </marker>
        </defs>
      </svg>
      <button
        onClick={e => {
          e.stopPropagation()
          modeRef.current = 1
        }}
      >
        Add Particle
      </button>
      <button
        onClick={e => {
          e.stopPropagation()
          modeRef.current = 2
        }}
      >
        Add Surface Point
      </button>
      <button
        onClick={e => {
          e.stopPropagation()
          modeRef.current = 0
        }}
      >
        Cancel
      </button>
    </>
  )
}

export default App
