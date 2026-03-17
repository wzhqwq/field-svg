import * as d3 from "d3"

import type { Circle } from "./dot"
import { DraggableCircles } from "./dot"
import { AxisRenderer, VectorRenderer, type Axis, type Vector } from "./vector"
import { PointNormalEstimator } from "./normal"
import type { FieldResult, Particle, SurfacePoint } from "./base"
import { calculateTensionMatrix } from "./split"
import { axisFromMatrix } from "./eigen"

const lowestErrorColor = "#FFB9B9"
const highestErrorColor = "#9E0000"
const errorInterpolator = d3.interpolateRgb(lowestErrorColor, highestErrorColor)

export class StrengthCalculator {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>

  private particles: Particle[] = []
  private surfacePoints: SurfacePoint[] = []
  private fields: FieldResult[] = []

  private draggableParticles: DraggableCircles
  private draggableSurfacePoints: DraggableCircles

  private particleAxis: AxisRenderer
  private gradient: VectorRenderer
  private sumStrength: VectorRenderer

  private normals: PointNormalEstimator

  private showAmplitudes: boolean = true

  public onSave: (data: string) => void = () => {}

  public showTension: boolean = true
  public showGradient: boolean = true
  public showHessian: boolean = false

  constructor(svgNode: SVGSVGElement) {
    this.svg = d3.select(svgNode)

    this.normals = new PointNormalEstimator(
      this.svg.append("g").attr("id", "normals").node() as SVGSVGElement,
    )

    this.particleAxis = new AxisRenderer(
      this.svg.append("g").attr("id", "particle_axis").node() as SVGSVGElement,
      "1pt",
      2e12,
    )
    this.gradient = new VectorRenderer(
      this.svg.append("g").attr("id", "gradient").node() as SVGSVGElement,
      "4pt",
    )
    this.gradient.arrowHeadIndex = 2
    this.sumStrength = new VectorRenderer(
      this.svg.append("g").attr("id", "strength_sum").node() as SVGSVGElement,
      "1.5pt",
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
      },
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
      },
    )
  }

  public loadData(data: string) {
    if (!data) {
      this.particles = []
      this.surfacePoints = []
      this.update()
      this.draggableParticles.clean()
      this.draggableSurfacePoints.clean()
      this.normals.clean()
      return
    }
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

  public updateVisibility(showAmplitudes: boolean, showTension: boolean, showGradient: boolean, showHessian: boolean) {
    this.showAmplitudes = showAmplitudes
    this.showTension = showTension
    this.showGradient = showGradient
    this.showHessian = showHessian
    this.update()
  }

  private updateFields() {
    const sumVectors: Vector[] = []
    const fields: FieldResult[] = []

    for (const point of this.surfacePoints) {
      const sumStrength = [0, 0] as [number, number]
      for (const particle of this.particles) {
        const dx = point.x - particle.x
        const dy = point.y - particle.y
        const r2 = dx * dx + dy * dy
        const r = Math.sqrt(r2)
        const strength = particle.q / r2
        const t = 10000.0 / r
        const strengthVector = [strength * dx * t, strength * dy * t]
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
        sumStrengthNormalized[0] * point.ny - sumStrengthNormalized[1] * point.nx,
        sumStrengthNormalized[1] * point.nx - sumStrengthNormalized[0] * point.ny,
      ]
      // length is from 0 to 1
      const crossLength = Math.sqrt(cross[0] ** 2 + cross[1] ** 2)
      sumVectors.push({
        start: [point.x, point.y],
        value: (this.showAmplitudes ? sumStrength : sumStrengthNormalized.map(s => s * 20)) as [
          number,
          number,
        ],
        color: errorInterpolator(crossLength),
      })

      fields.push({
        ...point,
        field: sumStrength,
      })
    }
    this.sumStrength.update(sumVectors)
    this.fields = fields
  }

  private updateParticleProperties() {
    const axes: Axis[] = []
    const gradients: Vector[] = []
    for (const particle of this.particles) {
      const { tension, gradient, hessian } = calculateTensionMatrix(particle, this.fields)
      if (this.showHessian) {
        axes.push({
          ...axisFromMatrix(hessian),
          center: [particle.x, particle.y] as [number, number],
        })
      } else if (this.showTension) {
        axes.push({
          ...axisFromMatrix(tension),
          center: [particle.x, particle.y] as [number, number],
        })
      }
      if (this.showGradient) {
        gradients.push({
          start: [particle.x, particle.y],
          value: gradient.map(g => g * -1e7) as [number, number],
          color: "#5eaefd",
        })
      }
    }
    this.particleAxis.update(axes)
    this.gradient.update(gradients)
  }

  private update() {
    this.updateFields()
    this.updateParticleProperties()

    const data = {
      particles: this.particles,
      surfacePoints: this.surfacePoints,
    }
    this.onSave(JSON.stringify(data))
  }
}
