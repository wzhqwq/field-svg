import type { FieldResult, Particle, ParticleWithResult } from "./base";

export function calculateTensionMatrix(particle: Particle, surfacePoints: FieldResult[]): ParticleWithResult {
  let gradX = 0, gradY = 0;
  let t00 = 0, t11 = 0, t01 = 0;
  let h00 = 0, h11 = 0, h01 = 0;
  let sum_d_mag = 0, sum_d_mag_sq = 0;

  const px = particle.x;
  const py = particle.y;
  const q = particle.q;

  for (let i = 0; i < surfacePoints.length; i++) {
    const point = surfacePoints[i];
    
    const rx = point.x - px;
    const ry = point.y - py;
    const r2 = rx * rx + ry * ry + 1e-12;
    const rn = 1 / Math.sqrt(r2);
    const r3n = rn / r2;

    const coef_J = q * r3n;
    const r2_inv = 1 / r2;
    const j00 = coef_J * (3 * rx * rx * r2_inv - 1);
    const j11 = coef_J * (3 * ry * ry * r2_inv - 1);
    const j01 = coef_J * (3 * rx * ry * r2_inv); 

    const ex = point.field[0];
    const ey = point.field[1];
    const e_mag_sq = ex * ex + ey * ey + 1e-12;
    const inv_e_mag = 1 / Math.sqrt(e_mag_sq);
    const e_hat_x = ex * inv_e_mag;
    const e_hat_y = ey * inv_e_mag;

    const nx = point.nx;
    const ny = point.ny;
    const p00 = 1 - nx * nx;
    const p11 = 1 - ny * ny;
    const p01 = -nx * ny;

    const vx = p00 * e_hat_x + p01 * e_hat_y;
    const vy = p01 * e_hat_x + p11 * e_hat_y;

    const v_dot_ehat = vx * e_hat_x + vy * e_hat_y;
    const coef_g = 2 * inv_e_mag;
    const gx = coef_g * (vx - v_dot_ehat * e_hat_x);
    const gy = coef_g * (vy - v_dot_ehat * e_hat_y);

    const dx = j00 * gx + j01 * gy;
    const dy = j01 * gx + j11 * gy;

    gradX += dx;
    gradY += dy;

    t00 += dx * dx;
    t11 += dy * dy;
    t01 += dx * dy;

    const d_mag_sq = dx * dx + dy * dy;
    sum_d_mag_sq += d_mag_sq;
    sum_d_mag += Math.sqrt(d_mag_sq);

    const dot0 = j00 * e_hat_x + j01 * e_hat_y;
    const c0x = (j00 - dot0 * e_hat_x) * inv_e_mag;
    const c0y = (j01 - dot0 * e_hat_y) * inv_e_mag;
    const u0x = p00 * c0x + p01 * c0y;
    const u0y = p01 * c0x + p11 * c0y;

    const dot1 = j01 * e_hat_x + j11 * e_hat_y;
    const c1x = (j01 - dot1 * e_hat_x) * inv_e_mag;
    const c1y = (j11 - dot1 * e_hat_y) * inv_e_mag;
    const u1x = p00 * c1x + p01 * c1y;
    const u1y = p01 * c1x + p11 * c1y;

    h00 += 2 * (u0x * u0x + u0y * u0y);
    h11 += 2 * (u1x * u1x + u1y * u1y);
    h01 += 2 * (u0x * u1x + u0y * u1y); // 对称，H_xy = H_yx
  }

  if (sum_d_mag > 1e-12) {
    const lambda_trans = sum_d_mag_sq / (sum_d_mag * sum_d_mag);
    if (lambda_trans < 0.999) {
      t00 -= lambda_trans * gradX * gradX;
      t11 -= lambda_trans * gradY * gradY;
      t01 -= lambda_trans * gradX * gradY;
    } else {
      t00 = 0; t11 = 0; t01 = 0;
    }
  } else {
    t00 = 0; t11 = 0; t01 = 0;
  }

  return {
    ...particle,
    gradient: [gradX, gradY],
    hessian: [
      [h00, h01],
      [h01, h11],
    ], 
    tension: [
      [t00, t01],
      [t01, t11],
    ],
  };
}