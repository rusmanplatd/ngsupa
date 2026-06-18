import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/ui/toast/toast';
import { ThemeState } from './core/state/theme.state';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <app-toast-container />
    <router-outlet />
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
    }
  `,
})
export class App {
  // Injecting ThemeState triggers its constructor + effects, which sync the theme to DOM
  private readonly themeState = inject(ThemeState);
}
