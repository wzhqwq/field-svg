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
      .attr("marker-end", "url(#arrowhead)")

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
      .attr("marker-end", "url(#arrowhead)")

    // Remove old vectors
    arrow.exit().remove()
  }
}
