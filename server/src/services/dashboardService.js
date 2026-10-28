import { dashboardRepository } from '../repositories/dashboardRepository.js'

export const dashboardService = {
  async getDashboardSummary() {
    const [metrics, inventoryByCategory, recentOrders, recentMovements, lowStockAlerts, salesTrend] =
      await Promise.all([
        dashboardRepository.getMetrics(),
        dashboardRepository.getInventoryByCategory(),
        dashboardRepository.getRecentOrders(5),
        dashboardRepository.getRecentMovements(6),
        dashboardRepository.getLowStockAlerts(6),
        dashboardRepository.getSalesTrend(),
      ])

    return {
      metrics,
      inventoryByCategory,
      recentOrders,
      recentMovements,
      lowStockAlerts,
      salesTrend,
    }
  },
}
