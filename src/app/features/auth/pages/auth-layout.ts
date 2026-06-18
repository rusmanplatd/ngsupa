import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <div class="flex min-h-dvh items-center justify-center bg-[var(--surface-grouped)] px-4 py-8">
      <div class="w-full max-w-md">
        <!-- Branding -->
        <div class="mb-8 text-center">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-system-blue shadow-md">
            <span class="text-2xl font-bold text-white">N</span>
          </div>
          <h1 class="mt-3 text-lg font-semibold text-[var(--text-primary)]">NgSupa</h1>
        </div>

        <!-- Content card -->
        <div class="rounded-2xl bg-[var(--glass-bg)] p-8 shadow-lg backdrop-blur-xl border border-[var(--glass-border)]">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {}
