import * as d3 from "d3"

export type Vector = {
  start: [number, number]
  value: [number, number]
  color: string
}

export class VectorRenderer {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
  private width: string
  private vectors: Vector[] = []
  public arrowHeadIndex: number = 1

  constructor(svgNode: SVGSVGElement, width: string) {
    this.svg = d3.select(svgNode)
    this.width = width
  }

  update(vectors: Vector[]) {
    this.vectors = vectors

    const arrow = this.svg.selectAll<SVGLineElement, Vector>(".vector").data(this.vectors)

    // Update existing vectors
    arrow
      .attr("x1", d => d.start[0])
      .attr("y1", d => d.start[1])
      .attr("x2", d => d.start[0] + d.value[0])
      .attr("y2", d => d.start[1] + d.value[1])
      .attr("stroke", d => d.color)
      .attr("fill", d => d.color)
      .attr("marker-end", `url(#arrowhead-${this.arrowHeadIndex})`)

    // Add new vectors
    arrow
      .enter()
      .append("line")
      .attr("class", "vector")
      .attr("x1", d => d.start[0])
      .attr("y1", d => d.start[1])
      .attr("x2", d => d.start[0] + d.value[0])
      .attr("y2", d => d.start[1] + d.value[1])
      .attr("stroke", d => d.color)
      .attr("fill", d => d.color)
      .attr("stroke-width", this.width)
      .attr("marker-end", `url(#arrowhead-${this.arrowHeadIndex})`)

    // Remove old vectors
    arrow.exit().remove()
  }
}

export type Axis = {
  center: [number, number]
  primary: [number, number]
  secondary: [number, number]
}

export class AxisRenderer {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
  private width: string
  private axisLength: number
  private axes: Axis[] = []

  constructor(svgNode: SVGSVGElement, width: string, axisLength: number = 20) {
    this.svg = d3.select(svgNode)
    this.width = width
    this.axisLength = axisLength
  }

  update(axes: Axis[]) {
    this.axes = axes

    const primaries = this.svg.selectAll<SVGLineElement, Axis>(".axis-primary").data(this.axes)
    const secondaries = this.svg.selectAll<SVGLineElement, Axis>(".axis-secondary").data(this.axes)

    // Update existing primary axes
    primaries
      .attr("x1", d => d.center[0] - (d.primary[0] * this.axisLength) / 2)
      .attr("y1", d => d.center[1] - (d.primary[1] * this.axisLength) / 2)
      .attr("x2", d => d.center[0] + (d.primary[0] * this.axisLength) / 2)
      .attr("y2", d => d.center[1] + (d.primary[1] * this.axisLength) / 2)
      .attr("stroke", "red")
      .attr("stroke-width", this.width)

    // Update existing secondary axes
    secondaries
      .attr("x1", d => d.center[0] - (d.secondary[0] * this.axisLength) / 2)
      .attr("y1", d => d.center[1] - (d.secondary[1] * this.axisLength) / 2)
      .attr("x2", d => d.center[0] + (d.secondary[0] * this.axisLength) / 2)
      .attr("y2", d => d.center[1] + (d.secondary[1] * this.axisLength) / 2)
      .attr("stroke", "blue")
      .attr("stroke-width", this.width)

    // Add new primary axes
    primaries
      .enter()
      .append("line")
      .attr("class", "axis-primary")
      .attr("x1", d => d.center[0] - (d.primary[0] * this.axisLength) / 2)
      .attr("y1", d => d.center[1] - (d.primary[1] * this.axisLength) / 2)
      .attr("x2", d => d.center[0] + (d.primary[0] * this.axisLength) / 2)
      .attr("y2", d => d.center[1] + (d.primary[1] * this.axisLength) / 2)
      .attr("stroke", "red")
      .attr("stroke-width", this.width)
    
    // Add new secondary axes
    secondaries
      .enter()
      .append("line")
      .attr("class", "axis-secondary")
      .attr("x1", d => d.center[0] - (d.secondary[0] * this.axisLength) / 2)
      .attr("y1", d => d.center[1] - (d.secondary[1] * this.axisLength) / 2)
      .attr("x2", d => d.center[0] + (d.secondary[0] * this.axisLength) / 2)
      .attr("y2", d => d.center[1] + (d.secondary[1] * this.axisLength) / 2)
      .attr("stroke", "blue")
      .attr("stroke-width", this.width)

    // Remove old axes
    primaries.exit().remove()
    secondaries.exit().remove()
  }
}
