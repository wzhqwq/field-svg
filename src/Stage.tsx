import { useRef, useState, useEffect } from "react"
import { StrengthCalculator } from "./strength"
import { atom, useAtom, useAtomValue } from "jotai"
import { currentPortfolioAtom } from "./base"
import { Switch } from "./Switch"

const width = 1400
const height = 800

const particleCharges = [10, 5, 2, 1, -1, -2, -5, -10]

const currentDataAtom = atom(
  get => get(currentPortfolioAtom)?.data || "",
  (get, set, newData) => {
    const data =
      typeof newData === "function" ? newData(get(currentPortfolioAtom)?.data || "") : newData
    set(currentPortfolioAtom, prev => {
      if (!prev) return null
      return {
        ...prev,
        data,
      }
    })
  },
)
const currentIdAtom = atom(get => get(currentPortfolioAtom)?.id || "")

export function Stage() {
  const id = useAtomValue(currentIdAtom)

  return (
    <div className="Stage">
      <SingleStage key={id} />
    </div>
  )
}

function SingleStage() {
  const svgRef = useRef<SVGSVGElement>(null)

  const calculatorRef = useRef<StrengthCalculator | null>(null)

  const [mode, setMode] = useState(0)
  const [particleCharge, setParticleCharge] = useState(10)
  const [showAmplitudes, setShowAmplitudes] = useState(true)
  const [data, setData] = useAtom(currentDataAtom)
  const [showTension, setShowTension] = useState(true)
  const [showGradient, setShowGradient] = useState(true)
  const [showHessian, setShowHessian] = useState(false)

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
        calculatorRef.current.loadData(data)
        calculatorRef.current.onSave = (newData: string) => {
          setData(newData)
        }
      }
    }
  }, [])
  useEffect(() => {
    if (calculatorRef.current) {
      calculatorRef.current.updateVisibility(showAmplitudes, showTension, showGradient, showHessian)
    }
  }, [showAmplitudes, showTension, showGradient, showHessian])

  return (
    <>
      <div className="svg-wrapper" style={{ width, height }} onClick={handleClick}>
        <svg ref={svgRef} width={width} height={height}>
          <defs>
            <marker
              id="arrowhead-1"
              viewBox="0 0 10 10"
              refX={8}
              refY={5}
              markerWidth={6}
              markerHeight={6}
              orient="auto"
              fill="context-fill"
            >
              <polygon points="0 0, 10 5, 0 10" />
            </marker>
            <marker
              id="arrowhead-2"
              viewBox="0 0 10 10"
              refX={4}
              refY={5}
              markerWidth={3}
              markerHeight={3}
              orient="auto"
              fill="context-fill"
            >
              <polygon points="0 0, 7 5, 0 10" />
            </marker>
          </defs>
        </svg>
        <div className="switches">
          <Switch label="Amplitudes" checked={showAmplitudes} onChange={setShowAmplitudes} />
          <Switch label="Tension" checked={showTension} onChange={setShowTension} />
          <Switch label="Gradient" checked={showGradient} onChange={setShowGradient} />
          <Switch label="Hessian" checked={showHessian} onChange={setShowHessian} />
        </div>
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
