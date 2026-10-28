import { dashboardService } from '../services/dashboardService.js'

export const dashboardController = {
  async getDashboardSummary(_req, res, next) {
    try {
      const summary = await dashboardService.getDashboardSummary()
      res.status(200).json(summary)
    } catch (error) {
      next(error)
    }
  },
}
