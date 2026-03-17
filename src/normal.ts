import * as d3 from "d3"
import { PCA } from "ml-pca"

interface Point {
  x: number
  y: number
  nx: number
  ny: number
}

export class PointNormalEstimator {
  private points: Point[] = []
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>

  constructor(svgNode: SVGSVGElement) {
    this.svg = d3.select(svgNode)
  }

  updatePoints(newPoints: Point[]): void {
    this.points = newPoints
    this.estimateAndDrawNormals()
  }

  private estimateAndDrawNormals(): void {
    if (this.points.length < 5) return

    const knn = 5 // Number of neighbors for KNN

    // Estimate normals using PCA and KNN
    for (const point of this.points) {
      const neighbors = this.getKNearestNeighbors(point, knn)
      const [nx, ny] = this.estimateNormalUsingPCA(neighbors)
      point.nx = nx
      point.ny = ny
    }

    // Draw normals
    this.drawNormals(this.points)
  }

  private getKNearestNeighbors(target: Point, k: number): Point[] {
    return this.points
      .map(p => ({
        point: p,
        distance: Math.sqrt((p.x - target.x) ** 2 + (p.y - target.y) ** 2),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(1, k + 1) // Exclude the target point itself
      .map(entry => entry.point)
  }

  private estimateNormalUsingPCA(neighbors: Point[]): [number, number] {
    const data = neighbors.map(p => [p.x, p.y])
    const pca = new PCA(data)
    const eigenvectors = pca.getEigenvectors()
    const eigenvalues = pca.getEigenvalues()
    const shortestIndex = Math.abs(eigenvalues[0]) < Math.abs(eigenvalues[1]) ? 0 : 1

    const normal = eigenvectors.getColumn(shortestIndex) // Get the first eigenvector

    // Normalize the normal vector
    const length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2)
    return [normal[0] / length, normal[1] / length]
  }

  private drawNormals(normals: Point[]): void {
    const lineLength = 16

    const lines = this.svg.selectAll("line").data(normals)

    // Update existing lines
    lines
      .attr("x1", d => d.x - d.nx * lineLength)
      .attr("y1", d => d.y - d.ny * lineLength)
      .attr("x2", d => d.x + d.nx * lineLength)
      .attr("y2", d => d.y + d.ny * lineLength)

    // Add new lines
    lines
      .enter()
      .append("line")
      .attr("x1", d => d.x - d.nx * lineLength)
      .attr("y1", d => d.y - d.ny * lineLength)
      .attr("x2", d => d.x + d.nx * lineLength)
      .attr("y2", d => d.y + d.ny * lineLength)
      .attr("stroke", "#DB9301")
      .attr("stroke-width", "0.5pt")

    // Remove old lines
    lines.exit().remove()
  }

  public clean() {
    this.points = []
    this.svg.selectAll("line").remove()
  }
}
