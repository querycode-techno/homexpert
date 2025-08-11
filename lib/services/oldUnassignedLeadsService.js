// Service for managing old unassigned leads
class OldUnassignedLeadsService {
  // Fetch old unassigned leads
  async fetchOldUnassignedLeads(page = 1, limit = 20, daysOld = 3) {
    try {
      const response = await fetch(
        `/api/leads/old-unassigned?page=${page}&limit=${limit}&daysOld=${daysOld}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch old unassigned leads');
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Failed to fetch old unassigned leads');
      }
    } catch (error) {
      console.error('Error in fetchOldUnassignedLeads:', error);
      throw error;
    }
  }

  // Delete old unassigned leads
  async deleteOldUnassignedLeads(leadIds, reason = '', deleteAll = false) {
    try {
      const response = await fetch('/api/leads/old-unassigned', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadIds: deleteAll ? [] : leadIds,
          reason: reason || 'Admin cleanup of old unassigned leads',
          deleteAll: deleteAll
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete old unassigned leads');
      }

      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Failed to delete old unassigned leads');
      }
    } catch (error) {
      console.error('Error in deleteOldUnassignedLeads:', error);
      throw error;
    }
  }

  // Delete all old unassigned leads
  async deleteAllOldUnassignedLeads(reason = '') {
    return this.deleteOldUnassignedLeads([], reason, true);
  }

  // Get summary statistics for old unassigned leads
  async getOldUnassignedStats(daysOld = 3) {
    try {
      const response = await fetch(`/api/leads/old-unassigned?daysOld=${daysOld}&limit=1`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch old unassigned leads stats');
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.stats;
      } else {
        throw new Error(data.error || 'Failed to fetch old unassigned leads stats');
      }
    } catch (error) {
      console.error('Error in getOldUnassignedStats:', error);
      throw error;
    }
  }
}

export default new OldUnassignedLeadsService();
