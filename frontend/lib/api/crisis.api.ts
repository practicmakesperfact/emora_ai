// ============================================================
// Emora AI — Crisis API
// GET /crisis/incidents, GET /crisis/incidents/{id}, PUT /crisis/incidents/{id}/resolve
// Requires Counselor or Admin role
// ============================================================

import apiClient from './client';
import type { Incident, IncidentResolve } from '@/types';

export const crisisApi = {
  /** GET /crisis/incidents — List all incidents (Counselor/Admin) */
  listIncidents: async (skip = 0, limit = 100): Promise<Incident[]> => {
    const res = await apiClient.get<Incident[]>('/crisis/incidents', {
      params: { skip, limit },
    });
    return res.data;
  },

  /** GET /crisis/incidents/{id} — Get a specific incident */
  getIncident: async (incidentId: number): Promise<Incident> => {
    const res = await apiClient.get<Incident>(`/crisis/incidents/${incidentId}`);
    return res.data;
  },

  /** PUT /crisis/incidents/{id}/resolve — Resolve an incident */
  resolveIncident: async (
    incidentId: number,
    data: IncidentResolve
  ): Promise<Incident> => {
    const res = await apiClient.put<Incident>(
      `/crisis/incidents/${incidentId}/resolve`,
      data
    );
    return res.data;
  },
};
