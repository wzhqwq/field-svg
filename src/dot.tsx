import * as d3 from "d3"

export interface Circle {
  x: number
  y: number
  label?: string
}
export interface CircleStyle {
  radius: string
  fill: string
  stroke: string
  strokeWidth: string
}

type UpdateCallback = (updatedCircles: Circle[]) => void
type DeleteCallback = (deletedIndex: number) => void

export class DraggableCircles {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
  private circles: Circle[]
  private onUpdate?: UpdateCallback
  private onDelete?: DeleteCallback
  private style: CircleStyle

  constructor(
    svgNode: SVGSVGElement,
    style: CircleStyle,
    onUpdate?: UpdateCallback,
    onDelete?: DeleteCallback
  ) {
    this.svg = d3.select(svgNode)
    this.circles = []
    this.style = style
    this.onUpdate = onUpdate
    this.onDelete = onDelete
  }

  private updateCircles() {
    const { svg, style, circles, onDelete, onUpdate } = this

    const circleSelection = svg.selectAll<SVGGElement, Circle>("g").data(circles)

    const remove = (index: number) => {
      this.circles.splice(index, 1)
      this.updateCircles()
      if (onDelete) {
        onDelete(index)
      }
    }

    const circleGroups = circleSelection
      .enter()
      .append("g")
      .merge(circleSelection)
      .attr("transform", d => `translate(${d.x}, ${d.y})`)
      .on("contextmenu", function (event, d) {
        event.preventDefault()
        const index = circles.indexOf(d)
        if (index > -1) {
          remove(index)
        }
      })
      .call(
        d3
          .drag<SVGGElement, Circle>()
          .on("start", function () {
            d3.select(this).raise().select("circle").attr("stroke", "red")
            svg.attr("cursor", "grabbing")
          })
          .on("drag", function (event, d) {
            d.x = event.x
            d.y = event.y
            d3.select(this).attr("transform", `translate(${d.x}, ${d.y})`)
            if (onUpdate) {
              onUpdate(circles)
            }
          })
          .on("end", function () {
            d3.select(this).select("circle").attr("stroke", style.stroke)
            svg.attr("cursor", "default")
          })
      )

    circleGroups
      .append("circle")
      .attr("r", this.style.radius)
      .attr("fill", this.style.fill)
      .attr("stroke", this.style.stroke)
      .attr("stroke-width", this.style.strokeWidth)
    
    circleGroups
      .append("text")
      .text(d => d.label || "")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "0.3cm")
      .attr("fill", "black")
      .attr("pointer-events", "none")

    circleSelection.exit().remove()
  }

  public addCircle(x: number, y: number, label?: string) {
    const newCircle: Circle = { x, y, label }
    this.circles.push(newCircle)
    this.updateCircles()
  }
}
