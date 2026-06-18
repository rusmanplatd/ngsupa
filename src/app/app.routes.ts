import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./features/profile/profile.routes').then((m) => m.profileRoutes),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./features/settings/settings.routes').then((m) => m.settingsRoutes),
  },
  {
    path: 'showcase',
    loadComponent: () =>
      import('./features/showcase/showcase').then((m) => m.ShowcaseComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
