import client from "./client";

export const adminApi = {
  login: (phone: string, password: string) =>
    client.post("/auth/login", { phone, password }),

  getDashboard: () => client.get("/admin/dashboard"),
  getBusinesses: () => client.get("/admin/businesses"),
  verifyBusiness: (businessId: string, verified: boolean) =>
    client.patch(`/admin/businesses/${businessId}/verify?verified=${verified}`),
  getUsers: () => client.get("/admin/users"),
  getSubscriptions: () => client.get("/admin/subscriptions"),
  getPlans: () => client.get("/subscriptions/plans"),
  updatePlan: (planKey: string, data: any) => client.put(`/subscriptions/plans/${planKey}`, data),
  getAgents: () => client.get("/admin/agents"),

  // -- Agent applications (real backend endpoints, under /agents/admin/*) --
  getAllAgents: (status?: string) =>
    client.get("/agents/admin/all", { params: status ? { status } : {} }),

  getAgentStats: () => client.get("/agents/admin/stats"),

  // -- Agent commission window (months of commission per business) --
  getCommissionWindows: () => client.get("/admin/agents/commission-months"),
  setCommissionWindow: (agentId: string, months: number) =>
    client.patch(`/admin/agents/${agentId}/commission-months`, { months }),

  reviewAgent: (agentId: string, action: "approved" | "rejected" | "suspended", reason?: string) =>
    client.patch(`/agents/admin/${agentId}/review`, { action, reason }),

  // -- Agent payouts --
  getPayouts: (period?: string) =>
    client.get("/agents/admin/payouts", { params: period ? { period } : {} }),
  calculatePayouts: (period: string) =>
    client.post("/agents/admin/payouts/calculate", null, { params: { period } }),
  markPayoutPaid: (payoutId: string, momoRef: string) =>
    client.patch(`/agents/admin/payouts/${payoutId}/mark-paid`, null, { params: { momoRef } }),
  voidPayout: (payoutId: string, reason: string) =>
    client.patch(`/agents/admin/payouts/${payoutId}/void`, null, { params: { reason } }),

  toggleUserStatus: (userId: string, active: boolean) =>
    client.patch(`/admin/users/${userId}/toggle-status?active=${active}`),

  // -- Admin Staff / RBAC (SUPER_ADMIN only) --
  getAllStaff: () => client.get("/admin/staff"),
  createStaff: (data: { fullName: string; phone: string; email: string; password: string; role: string }) =>
    client.post("/admin/staff", data),
  updateStaffRole: (userId: string, role: string) =>
    client.patch(`/admin/staff/${userId}/role`, { role }),

  activateSubscription: (data: { businessId: string; planKey: string; billingCycle: string }) =>
    client.post("/admin/subscriptions/activate", data),

  cancelSubscription: (businessId: string) =>
    client.delete(`/admin/subscriptions/${businessId}`),

  sendNotification: (data: { title: string; body: string; targetType: string; targetValue: string }) =>
    client.post("/admin/notifications/send", data),

  // -- Support tickets --
  getTickets: (status?: string) => client.get("/admin/support/tickets", { params: status ? { status } : {} }),
  getTicketStats: () => client.get("/admin/support/stats"),
  createManualTicket: (data: { businessId?: string; contactName: string; contactPhone?: string; contactEmail?: string; subject: string; message: string; priority?: string }) =>
    client.post("/admin/support/tickets", data),
  respondToTicket: (ticketId: string, data: { status: string; adminResponse?: string }) =>
    client.patch(`/admin/support/tickets/${ticketId}`, data),
};