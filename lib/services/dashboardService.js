/*
Here we will fetch the data for the dashboard
*/

class DashboardService {
    async getRecentLeads() {
        try {
            const response = await fetch('/api/admin/dashboard/recent-leads');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching recent leads:', error);
            throw error;
 
        }
    }
    async getRecentVendors() {
        try {
            const response = await fetch('/api/admin/dashboard/recent-vendors');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching recent vendors:', error);
            throw error;
        }
    }

    async getChartData() {
        try {
            const response = await fetch('/api/admin/dashboard/lead-chart-data');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching chart data:', error);
            throw error;
        }
    }

    async getRevenueChartData() {
        try {
            const response = await fetch('/api/admin/dashboard/revenue-chart-data');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching revenue chart data:', error);
            throw error;
        }
    }
   
}

export default new DashboardService();
