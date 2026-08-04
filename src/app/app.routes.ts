import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { mfaGuard } from './core/guards/mfa.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, mfaGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },
  {
    path: 'profile',
    canActivate: [authGuard, mfaGuard],
    loadChildren: () =>
      import('./features/profile/profile.routes').then((m) => m.profileRoutes),
  },
  {
    path: 'settings',
    canActivate: [authGuard, mfaGuard],
    loadChildren: () =>
      import('./features/settings/settings.routes').then((m) => m.settingsRoutes),
  },
  {
    path: 'showcase',
    // canActivate: [authGuard, mfaGuard],
    loadComponent: () =>
      import('./features/showcase/showcase').then((m) => m.ShowcaseComponent),
  },
  {
    path: 'sidenav-demo',
    // canActivate: [authGuard, mfaGuard],
    loadComponent: () =>
      import('./features/sidenav-demo/sidenav-demo').then((m) => m.SidenavDemoComponent),
  },
  {
    path: 'resizable-demo',
    loadComponent: () =>
      import('./features/resizable-demo/resizable-demo').then((m) => m.ResizableDemoComponent),
  },
  {
    path: 'gantt-demo',
    loadComponent: () =>
      import('./features/gantt-demo/gantt-demo.component').then((m) => m.GanttDemoComponent),
  },
  {
    path: 'chart-demo',
    loadComponent: () =>
      import('./features/chart-demo/chart-demo.component').then((m) => m.ChartDemoComponent),
  },
  {
    path: 'map-demo',
    loadComponent: () =>
      import('./features/map-demo/map-demo.component').then((m) => m.MapDemoComponent),
  },
  {
    path: 'route-demo',
    loadComponent: () =>
      import('./features/route-demo/route-demo.component').then((m) => m.RouteDemoComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];

