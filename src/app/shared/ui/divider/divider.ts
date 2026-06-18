import { Component, input } from '@angular/core';

@Component({
  selector: 'app-divider',
  host: {
    role: 'separator',
    class: 'block',
  },
  template: ``,
  styles: `
    :host {
      height: 1px;
      background-color: var(--separator);
    }
    :host(.inset) {
      margin-left: 1rem;
    }
  `,
})
export class DividerComponent {
  readonly inset = input(false);
}
