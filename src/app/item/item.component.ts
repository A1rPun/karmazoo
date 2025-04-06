import { Component, input, output } from '@angular/core';
import { IZoo } from '../zoo.interface';

@Component({
  selector: 'zoo-item',
  templateUrl: './item.component.html',
  styleUrl: './item.component.css',
})
export class ItemComponent {
  item = input<IZoo>();
  changed = output<number>();

  click(event: Event, state: number) {
    const checked = (event.target as HTMLInputElement).checked;
    const old = this.item()?.state ?? 0;

    if (state === 1 && !checked) {
      this.changed.emit(0);
    } else {
      const result = checked ? old + state : old - state;
      this.changed.emit(result);
    }
  }
}
