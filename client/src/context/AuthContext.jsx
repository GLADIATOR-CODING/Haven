import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [currentOrgSlug, setCurrentOrgSlug] = useState(() => {
    return localStorage.getItem('haven_active_org_slug') || null;
  });

  const {
    data: authData,
    isLoading,
    isError,
    refetch: refetchMe,
  } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      try {
        return await api.get('/api/auth/me');
      } catch (err) {
        if (err.status === 401) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const user = authData?.user || null;
  const memberships = authData?.memberships || [];

  // Sync active org
  useEffect(() => {
    if (memberships.length > 0) {
      const match = memberships.find((m) => m.orgSlug === currentOrgSlug);
      if (!match) {
        setCurrentOrgSlug(memberships[0].orgSlug);
        localStorage.setItem('haven_active_org_slug', memberships[0].orgSlug);
      }
    } else {
      setCurrentOrgSlug(null);
      localStorage.removeItem('haven_active_org_slug');
    }
  }, [memberships, currentOrgSlug]);

  const selectOrgSlug = (slug) => {
    setCurrentOrgSlug(slug);
    localStorage.setItem('haven_active_org_slug', slug);
  };

  const loginMutation = useMutation({
    mutationFn: (credentials) => api.post('/api/auth/login', credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(['authMe'], data);
      refetchMe();
    },
  });

  const signupMutation = useMutation({
    mutationFn: (userData) => api.post('/api/auth/signup', userData),
    onSuccess: (data) => {
      queryClient.setQueryData(['authMe'], data);
      refetchMe();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/api/auth/logout'),
    onSuccess: () => {
      queryClient.setQueryData(['authMe'], null);
      setCurrentOrgSlug(null);
      localStorage.removeItem('haven_active_org_slug');
    },
  });

  const value = {
    user,
    memberships,
    currentOrgSlug,
    selectOrgSlug,
    isLoading,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    refetchMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
