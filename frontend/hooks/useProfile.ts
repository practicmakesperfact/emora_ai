// ============================================================
// Emora AI — useProfile Hook
// React Query hooks for user profile access and updates
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users.api';
import type { UserUpdate } from '@/types';

export const ME_KEY = ['me'] as const;

/** Get the current user's profile */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => usersApi.getMe(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/** Update the current user's profile */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserUpdate) => usersApi.updateMe(data),
    onSuccess: (updatedUser) => {
      // Update cache directly to avoid unnecessary re-fetch
      queryClient.setQueryData(ME_KEY, updatedUser);
    },
  });
}
