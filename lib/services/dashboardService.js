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

   
}

export default new DashboardService();
