import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { mfaGuard } from '../../core/guards/mfa.guard';

export const settingsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, mfaGuard],
    loadComponent: () =>
      import('./pages/settings').then((m) => m.SettingsComponent),
  },
];
