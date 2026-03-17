function eigenvector(a:number,b:number,c:number,d:number,lambda:number):[number,number]{
  if (Math.abs(b) > Math.abs(c)) {
    return [b, lambda - a]
  } else {
    return [lambda - d, c]
  }
}

export function eigen_2d(matrix:[[number,number],[number,number]]) {
  const a = matrix[0][0]
  const b = matrix[0][1]
  const c = matrix[1][0]
  const d = matrix[1][1]

  const trace = a + d
  const det = a*d - b*c
  const disc = Math.max(0, trace*trace - 4*det)

  const s = Math.sqrt(disc)

  const l1 = (trace + s)/2
  const l2 = (trace - s)/2

  const v1 = eigenvector(a,b,c,d,l1)
  const v2 = eigenvector(a,b,c,d,l2)

  return {
    eigenvalues:[l1,l2],
    eigenvectors:[v1,v2] as [[number,number],[number,number]]
  }
}
function normalizeAndScale(vector: number[], scale: number): [number, number] {
  const length = Math.hypot(vector[0], vector[1])
  if (length === 0) return [0, 0]
  return [vector[0] / length * scale, vector[1] / length * scale] as [number, number]
}

export function axisFromMatrix(matrix: [[number, number], [number, number]]): { primary: [number, number]; secondary: [number, number] } {
  const { eigenvalues, eigenvectors } = eigen_2d(matrix)
  const primaryIndex = (eigenvalues[0]) > (eigenvalues[1]) ? 0 : 1
  const secondaryIndex = 1 - primaryIndex

  return {
    primary: normalizeAndScale(eigenvectors[primaryIndex], eigenvalues[primaryIndex]),
    secondary: normalizeAndScale(eigenvectors[secondaryIndex], eigenvalues[secondaryIndex]),
  }
}