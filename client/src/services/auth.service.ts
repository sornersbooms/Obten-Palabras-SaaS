export const authService = {
  setToken: (token: string) => localStorage.setItem('stat_iq_token', token),
  getToken: () => localStorage.getItem('stat_iq_token'),
  setUser: (user: any) => localStorage.setItem('stat_iq_user', JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem('stat_iq_user');
    return user ? JSON.parse(user) : null;
  },
  setTenant: (tenant: any) => localStorage.setItem('stat_iq_tenant', JSON.stringify(tenant)),
  getTenant: () => {
    const tenant = localStorage.getItem('stat_iq_tenant');
    return tenant ? JSON.parse(tenant) : null;
  },
  logout: () => {
    localStorage.removeItem('stat_iq_token');
    localStorage.removeItem('stat_iq_user');
    localStorage.removeItem('stat_iq_tenant');
    window.location.href = '/login';
  },
  isAuthenticated: () => !!localStorage.getItem('stat_iq_token')
};
