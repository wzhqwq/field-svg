import * as d3 from "d3"

import type { Circle } from "./dot"
import { DraggableCircles } from "./dot"
import { VectorRenderer, type Vector } from "./vector"
import { PointNormalEstimator } from "./normal"

interface Particle {
  x: number
  y: number
  q: number
}

interface SurfacePoint {
  x: number
  y: number
  nx: number
  ny: number
}

const lowestErrorColor = "#FFB9B9"
const highestErrorColor = "#9E0000"
const errorInterpolator = d3.interpolateRgb(lowestErrorColor, highestErrorColor)

export class StrengthCalculator {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>

  private particles: Particle[]
  private surfacePoints: SurfacePoint[]

  private draggableParticles: DraggableCircles
  private draggableSurfacePoints: DraggableCircles

  private singleParticleStrength: VectorRenderer
  private sumStrength: VectorRenderer

  private normals: PointNormalEstimator

  private showAmplitudes: boolean = true

  constructor(svgNode: SVGSVGElement) {
    this.svg = d3.select(svgNode)
    this.particles = []
    this.surfacePoints = []

    this.normals = new PointNormalEstimator(
      this.svg.append("g").attr("id", "normals").node() as SVGSVGElement
    )

    this.singleParticleStrength = new VectorRenderer(
      this.svg.append("g").attr("id", "strength_single").node() as SVGSVGElement,
      "1pt"
    )
    this.sumStrength = new VectorRenderer(
      this.svg.append("g").attr("id", "strength_sum").node() as SVGSVGElement,
      "1.5pt"
    )
    this.draggableParticles = new DraggableCircles(
      this.svg.append("g").attr("id", "particles").node() as SVGSVGElement,
      {
        radius: "0.26cm",
        fill: "#F98C61",
        stroke: "#DD674F",
        strokeWidth: "1pt",
      },
      (updatedCircles: Circle[]) => {
        this.particles = updatedCircles.map((circle, i) => ({
          x: circle.x,
          y: circle.y,
          q: this.particles[i]?.q || 1, // Default charge
        }))
        this.update()
      },
      (deletedIndex: number) => {
        this.particles.splice(deletedIndex, 1)
        this.update()
      }
    )
    this.draggableSurfacePoints = new DraggableCircles(
      this.svg.append("g").attr("id", "points").node() as SVGSVGElement,
      {
        radius: "0.11cm",
        fill: "white",
        stroke: "black",
        strokeWidth: "1pt",
      },
      (updatedCircles: Circle[]) => {
        this.surfacePoints = updatedCircles.map((circle, i) => ({
          x: circle.x,
          y: circle.y,
          nx: this.surfacePoints[i]?.nx || 0, // Default normal x
          ny: this.surfacePoints[i]?.ny || 0, // Default normal y
        }))
        this.normals.updatePoints(this.surfacePoints)
        this.update()
      },
      (deletedIndex: number) => {
        this.surfacePoints.splice(deletedIndex, 1)
        this.normals.updatePoints(this.surfacePoints)
        this.update()
      }
    )

    // load from localStorage
    const data = localStorage.getItem("fieldData")
    if (data) {
      const parsedData = JSON.parse(data)
      this.particles = parsedData.particles
      this.surfacePoints = parsedData.surfacePoints
      this.particles.forEach(particle => {
        this.draggableParticles.addCircle(particle.x, particle.y, particle.q.toFixed(0))
      })
      this.surfacePoints.forEach(surfacePoint => {
        this.draggableSurfacePoints.addCircle(surfacePoint.x, surfacePoint.y)
      })
      this.update()
      this.normals.updatePoints(this.surfacePoints)
    }
  }

  public addParticle(x: number, y: number, q: number) {
    this.particles.push({ x, y, q })
    this.draggableParticles.addCircle(x, y, q.toFixed(0))
    this.update()
  }
  public addSurfacePoint(x: number, y: number) {
    this.surfacePoints.push({ x, y, nx: 0, ny: 0 }) // Default normal
    this.draggableSurfacePoints.addCircle(x, y)
    this.normals.updatePoints(this.surfacePoints)
    this.update()
  }

  public setShowAmplitudes(show: boolean) {
    this.showAmplitudes = show
    this.update()
  }

  private update() {
    const singleVectors: Vector[] = []
    const sumVectors: Vector[] = []

    for (const surfacePoints of this.surfacePoints) {
      const sumStrength = [0, 0]
      for (const particle of this.particles) {
        const dx = surfacePoints.x - particle.x
        const dy = surfacePoints.y - particle.y
        const r2 = dx * dx + dy * dy
        const r = Math.sqrt(r2)
        const strength = particle.q / r2
        const t = 10000.0 / r
        const strengthVector = [strength * dx * t, strength * dy * t]
        singleVectors.push({
          start: [surfacePoints.x, surfacePoints.y],
          value: strengthVector as [number, number],
          color: "#DDD",
        })
        sumStrength[0] += strengthVector[0]
        sumStrength[1] += strengthVector[1]
      }
      const sumStrengthLength = Math.sqrt(sumStrength[0] ** 2 + sumStrength[1] ** 2)
      const sumStrengthNormalized = [
        sumStrength[0] / sumStrengthLength,
        sumStrength[1] / sumStrengthLength,
      ]
      // cross strength with normal
      const cross = [
        sumStrengthNormalized[0] * surfacePoints.ny - sumStrengthNormalized[1] * surfacePoints.nx,
        sumStrengthNormalized[1] * surfacePoints.nx - sumStrengthNormalized[0] * surfacePoints.ny,
      ]
      // length is from 0 to 1
      const crossLength = Math.sqrt(cross[0] ** 2 + cross[1] ** 2)
      sumVectors.push({
        start: [surfacePoints.x, surfacePoints.y],
        value: (this.showAmplitudes ? sumStrength : sumStrengthNormalized.map(s => s * 20)) as [number, number],
        color: errorInterpolator(crossLength),
      })
    }
    // this.singleParticleStrength.update(singleVectors)
    this.sumStrength.update(sumVectors)

    // record in localStorage
    const data = {
      particles: this.particles,
      surfacePoints: this.surfacePoints,
    }
    localStorage.setItem("fieldData", JSON.stringify(data))
  }
}
