import { create } from 'zustand';

/**
 * Mobile navigation drawer state. Lifted out of Sidebar so the mobile
 * hamburger can live in the Topbar without prop-drilling, and so any
 * page-level escape (e.g. closing on route change) can drive it from one place.
 */
interface NavState {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const useNav = create<NavState>((set) => ({
  drawerOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
}));
