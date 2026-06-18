import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest.guard';
import { AuthLayoutComponent } from './pages/auth-layout';

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
      {
        path: 'sign-in',
        loadComponent: () =>
          import('./pages/sign-in').then((m) => m.SignInComponent),
      },
      {
        path: 'sign-up',
        loadComponent: () =>
          import('./pages/sign-up').then((m) => m.SignUpComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/forgot-password').then((m) => m.ForgotPasswordComponent),
      },
    ],
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./pages/auth-callback').then((m) => m.AuthCallbackComponent),
  },
];
