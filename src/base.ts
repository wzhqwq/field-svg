import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

export interface Particle {
  x: number
  y: number
  q: number
}

export interface SurfacePoint {
  x: number
  y: number
  nx: number
  ny: number
}

export interface ParticleWithResult extends Particle {
  gradient: [number, number]
  hessian: [[number, number], [number, number]]
  tension: [[number, number], [number, number]]
}

export interface FieldResult extends SurfacePoint {
  field: [number, number]
}

export interface PortfolioData {
  id: string
  name: string
  data: string
}

export const currentPortfolioAtom = atom<PortfolioData | null>(null)
export const portfoliosAtom = atomWithStorage<PortfolioData[]>("portfolios", [])
