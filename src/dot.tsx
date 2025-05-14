import * as d3 from "d3"

export interface Circle {
  x: number
  y: number
}
export interface CircleStyle {
  radius: number
  fill: string
  stroke: string
  strokeWidth: number
}

type UpdateCallback = (updatedCircles: Circle[]) => void

export class DraggableCircles {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
  private circles: Circle[]
  private onUpdate?: UpdateCallback
  private style: CircleStyle

  constructor(svgNode: SVGSVGElement, style: CircleStyle, onUpdate?: UpdateCallback) {
    this.svg = d3.select(svgNode)
    this.circles = []
    this.style = style
    this.onUpdate = onUpdate
  }

  private updateCircles() {
    const circleSelection = this.svg
      .selectAll<SVGCircleElement, Circle>("circle")
      .data(this.circles)

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const outerThis = this

    circleSelection
      .enter()
      .append("circle")
      .merge(circleSelection)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", this.style.radius)
      .attr("fill", this.style.fill)
      .attr("stroke", this.style.stroke)
      .attr("stroke-width", this.style.strokeWidth)
      .call(
        d3
          .drag<SVGCircleElement, Circle>()
          .on("start", function () {
            d3.select(this).raise().attr("stroke", "red")
            outerThis.svg.attr("cursor", "grabbing")
          })
          .on("drag", function (event, d) {
            d.x = event.x
            d.y = event.y
            d3.select(this).attr("cx", d.x).attr("cy", d.y)
            if (outerThis.onUpdate) {
              outerThis.onUpdate(outerThis.circles)
            }
          })
          .on("end", function () {
            d3.select(this).attr("stroke", outerThis.style.stroke)
            outerThis.svg.attr("cursor", "default")
          })
      )

    circleSelection.exit().remove()
  }

  public addCircle(x: number, y: number) {
    const newCircle: Circle = { x, y }
    this.circles.push(newCircle)
    this.updateCircles()
  }
}
