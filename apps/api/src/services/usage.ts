import { prisma } from "@revestia/db";
import { PLANS, type PlanCode } from "@revestia/shared";

/** Uso del plan en el mes en curso. */
export async function planUsage(commerceId: string, plan: string) {
  const def = PLANS[(plan as PlanCode) in PLANS ? (plan as PlanCode) : "FREE"];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [visualizations, products] = await Promise.all([
    prisma.visualization.count({ where: { commerceId, createdAt: { gte: monthStart } } }),
    prisma.product.count({ where: { commerceId } }),
  ]);
  return {
    plan: def,
    visualizationsThisMonth: visualizations,
    visualizationsLeft: def.visualizationsPerMonth == null ? null : Math.max(0, def.visualizationsPerMonth - visualizations),
    products,
    productsLeft: def.maxProducts == null ? null : Math.max(0, def.maxProducts - products),
  };
}
