import { useEffect, useRef, useState } from "react"
import { StrengthCalculator } from "./strength"

const width = 1400
const height = 800

const particleCharges = [10, 5, 2, 1, -1, -2, -5, -10]

function App() {
  const svgRef = useRef<SVGSVGElement>(null)

  const calculatorRef = useRef<StrengthCalculator | null>(null)

  const [mode, setMode] = useState(0)
  const [particleCharge, setParticleCharge] = useState(10)
  const [showAmplitudes, setShowAmplitudes] = useState(true)

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (mode == 0) return
    if (calculatorRef.current) {
      const rect = svgRef.current?.getBoundingClientRect()
      const x = event.clientX - (rect?.left || 0)
      const y = event.clientY - (rect?.top || 0)
      if (mode == 1) {
        calculatorRef.current.addParticle(x, y, particleCharge)
      } else if (mode == 2) {
        calculatorRef.current.addSurfacePoint(x, y)
      }
    }
  }
  useEffect(() => {
    if (svgRef.current) {
      const svg = svgRef.current
      if (!calculatorRef.current) {
        calculatorRef.current = new StrengthCalculator(svg)
      }
    }
  }, [])

  return (
    <>
      <div className="svg-wrapper" style={{ width, height }} onClick={handleClick}>
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
              fill="context-fill"
            >
              <polygon points="0 0, 10 5, 0 10" />
            </marker>
          </defs>
        </svg>
      </div>
      {mode == 0 ? (
        <>
          <button
            onClick={() => {
              setMode(1)
            }}
          >
            Add Particle
          </button>
          <button
            onClick={() => {
              setMode(2)
            }}
          >
            Add Surface Point
          </button>
          {showAmplitudes ? (
            <button
              onClick={() => {
                setShowAmplitudes(false)
                calculatorRef.current?.setShowAmplitudes(false)
              }}
            >
              Hide Amplitudes
            </button>
          ) : (
            <button
              onClick={() => {
                setShowAmplitudes(true)
                calculatorRef.current?.setShowAmplitudes(true)
              }}
            >
              Show Amplitudes
            </button>
          )}
        </>
      ) : (
        <button
          onClick={() => {
            setMode(0)
          }}
        >
          Cancel
        </button>
      )}
      {mode == 1 &&
        particleCharges.map(charge => (
          <button
            key={charge}
            onClick={() => {
              setParticleCharge(charge)
            }}
          >
            {charge}
          </button>
        ))}
      <button
        onClick={() => {
          const svg = svgRef.current
          if (svg) {
            const serializer = new XMLSerializer()
            const svgString = serializer.serializeToString(svg)
            const blob = new Blob([svgString], { type: "image/svg+xml" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "diagram.svg"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
        }}
      >
        download svg
      </button>
    </>
  )
}

export default App
