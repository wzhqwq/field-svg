import * as d3 from "d3"

import type { Circle } from "./dot"
import { DraggableCircles } from "./dot"
import { VectorRenderer, type Vector } from "./vector"

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

export class StrengthCalculator {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>

  private particles: Particle[]
  private surfacePoints: SurfacePoint[]

  private draggableParticles: DraggableCircles
  private draggableSurfacePoints: DraggableCircles

  private singleParticleStrength: VectorRenderer
  private sumStrength: VectorRenderer

  constructor(svgNode: SVGSVGElement) {
    this.svg = d3.select(svgNode)
    this.particles = []
    this.surfacePoints = []

    this.singleParticleStrength = new VectorRenderer(
      this.svg.append("g").attr("id", "strength_single").node() as SVGSVGElement,
      "red"
    )
    this.sumStrength = new VectorRenderer(
      this.svg.append("g").attr("id", "strength_sum").node() as SVGSVGElement,
      "green"
    )
    this.draggableParticles = new DraggableCircles(
      this.svg.append("g").attr("id", "particles").node() as SVGSVGElement,
      {
        radius: 15,
        fill: "blue",
        stroke: "black",
        strokeWidth: 1,
      },
      (updatedCircles: Circle[]) => {
        this.particles = updatedCircles.map((circle, i) => ({
          x: circle.x,
          y: circle.y,
          q: this.particles[i]?.q || 1, // Default charge
        }))
        this.update()
      }
    )
    this.draggableSurfacePoints = new DraggableCircles(
      this.svg.append("g").attr("id", "points").node() as SVGSVGElement,
      {
        radius: 10,
        fill: "white",
        stroke: "black",
        strokeWidth: 1,
      },
      (updatedCircles: Circle[]) => {
        this.surfacePoints = updatedCircles.map((circle, i) => ({
          x: circle.x,
          y: circle.y,
          nx: this.surfacePoints[i]?.nx || 0, // Default normal x
          ny: this.surfacePoints[i]?.ny || 0, // Default normal y
        }))
        this.update()
      }
    )
  }

  public addParticle(x: number, y: number) {
    this.particles.push({ x, y, q: 10 }) // Default charge
    this.draggableParticles.addCircle(x, y)
    this.update()
  }
  public addSurfacePoint(x: number, y: number) {
    this.surfacePoints.push({ x, y, nx: 0, ny: 0 }) // Default normal
    this.draggableSurfacePoints.addCircle(x, y)
    this.update()
  }

  private update() {
    const singleVectors: Vector[] = []
    const sumVectors: Vector[] = []

    for (const surfacePoints of this.surfacePoints) {
      const sumStrength = [0, 0] as [number, number]
      for (const particle of this.particles) {
        const dx = surfacePoints.x - particle.x
        const dy = surfacePoints.y - particle.y
        const r2 = dx * dx + dy * dy
        const r = Math.sqrt(r2)
        const strength = particle.q / r2
        const t = 50000.0 / r
        const strengthVector = [strength * dx * t, strength * dy * t] as [number, number]
        singleVectors.push({
          start: [surfacePoints.x, surfacePoints.y],
          value: strengthVector,
        })
        sumStrength[0] += strengthVector[0]
        sumStrength[1] += strengthVector[1]
      }
      sumVectors.push({
        start: [surfacePoints.x, surfacePoints.y],
        value: sumStrength,
      })
    }
    // this.singleParticleStrength.update(singleVectors)
    this.sumStrength.update(sumVectors)
  }
}
