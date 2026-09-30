// ============================================================
// Emora AI — useCrisis Hook
// React Query hooks for crisis incident management
// Requires Counselor or Admin role
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crisisApi } from '@/lib/api/crisis.api';
import type { IncidentResolve } from '@/types';

export const INCIDENTS_KEY = ['incidents'] as const;
export const INCIDENT_KEY = (id: number) => ['incident', id] as const;

/** List all crisis incidents */
export function useIncidents(skip = 0, limit = 100) {
  return useQuery({
    queryKey: [...INCIDENTS_KEY, { skip, limit }],
    queryFn: () => crisisApi.listIncidents(skip, limit),
  });
}

/** Get a single incident by ID */
export function useIncident(incidentId: number) {
  return useQuery({
    queryKey: INCIDENT_KEY(incidentId),
    queryFn: () => crisisApi.getIncident(incidentId),
    enabled: !isNaN(incidentId) && incidentId > 0,
  });
}

/** Resolve an incident (counselor action) */
export function useResolveIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IncidentResolve }) =>
      crisisApi.resolveIncident(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEY });
      queryClient.invalidateQueries({ queryKey: INCIDENT_KEY(variables.id) });
    },
  });
}
