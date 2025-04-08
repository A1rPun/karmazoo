import { Component, input, output } from '@angular/core';

@Component({
  selector: 'zoo-toggle',
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.css',
})
export class ToggleComponent {
  title = input<string>('Unlock all');
  checked = input<boolean>(false);

  changed = output<boolean>();

  change(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.changed.emit(checked);
  }
}
