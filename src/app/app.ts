import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/ui/toast/toast';
import { ThemeState } from './core/state/theme.state';
import { CommandPaletteComponent } from './shared/ui/command-palette/command-palette';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, CommandPaletteComponent],
  template: `
    <app-toast-container />
    <app-command-palette />
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
