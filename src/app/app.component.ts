import { Component, computed, signal, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ItemComponent } from "./item/item.component";
import { IZoo } from './zoo.interface';

import forms from './../assets/forms.json';
import items from './../assets/items.json';
import other from './../assets/other.json';
import tree from './../assets/tree.json';

// function lzw_encode(s: string) {
//   var dict = new Map();
//   var data = (s + "").split("");
//   var out = [];
//   var currChar;
//   var phrase = data[0];
//   var code = 256;
//   for (var i=1; i<data.length; i++) {
//       currChar=data[i];
//       if (dict.has(phrase + currChar)) {
//           phrase += currChar;
//       }
//       else {
//           out.push(phrase.length > 1 ? dict.get(phrase) : phrase.charCodeAt(0));
//           dict.set(phrase + currChar, code);
//           code++;
//           phrase=currChar;
//       }
//   }
//   out.push(phrase.length > 1 ? dict.get(phrase) : phrase.charCodeAt(0));
//   for (var i=0; i<out.length; i++) {
//       out[i] = String.fromCharCode(out[i]);
//   }
//   return out.join("");
// }
// function lzw_decode(s: string) {
//   var dict = new Map();
//   var data = (s + "").split("");
//   var currChar = data[0];
//   var oldPhrase = currChar;
//   var out = [currChar];
//   var code = 256;
//   var phrase;
//   for (var i=1; i<data.length; i++) {
//       var currCode = data[i].charCodeAt(0);
//       if (currCode < 256) {
//           phrase = data[i];
//       }
//       else {
//          phrase = dict.has(currCode) ? dict.get(currCode) : (oldPhrase + currChar);
//       }
//       out.push(phrase);
//       currChar = phrase.charAt(0);
//       dict.set(code, oldPhrase + currChar);
//       code++;
//       oldPhrase = phrase;
//   }
//   return out.join("");
// }

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ItemComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  forms: WritableSignal<IZoo[]> = signal(forms.map(this.initZoo));
  items: WritableSignal<IZoo[]> = signal(items.map(this.initZoo));
  other: WritableSignal<IZoo[]> = signal(other.map(this.initZoo));
  tree: WritableSignal<IZoo[]> = signal(tree.map(this.initZoo));
  sherpas;
  currencies;
  spoilers = !!localStorage.getItem('karmazoo.spoilers');

  neededKarmaForms;
  neededKarmaItems;
  neededKarmaOther;
  neededKarmaTotal;

  karmaForms = computed(() => {
    return this.sumCurrencies(this.forms().filter(x => x.state ?? 0 > 0));
  });
  karmaItems = computed(() => {
    return this.sumCurrencies(this.items().filter(x => x.state ?? 0 > 0));
  });
  karmaOther = computed(() => {
    return this.sumCurrencies(this.other().filter(x => x.state ?? 0 > 0));
  });
  karma = computed(() => {
    return this.karmaForms() + this.karmaItems() + this.karmaOther();
  });
  karmaFormsDisplay = computed(() => this.karmaForms().toLocaleString());
  karmaItemsDisplay = computed(() => this.karmaItems().toLocaleString());
  karmaOtherDisplay = computed(() => this.karmaOther().toLocaleString());
  karmaDisplay = computed(() => this.karma().toLocaleString());
  secrets = computed(() => {
    return this.forms().filter(x => (x.state ?? 0 > 0) && x.secret).length
      + this.items().filter(x => (x.state ?? 0 > 0) && x.secret).length
      + this.tree().filter(x => (x.state ?? 0 > 0) ).length;
  });

  constructor() {
    this.currencies = [
      this.sumCurrencies(this.forms()),
      this.sumCurrencies(this.items()),
      this.sumCurrencies(this.other()),
    ]

    this.neededKarmaForms = this.currencies[0].toLocaleString();
    this.neededKarmaItems = this.currencies[1].toLocaleString();
    this.neededKarmaOther = this.currencies[2].toLocaleString();
    this.neededKarmaTotal = this.currencies.reduce((a, b) => a + b).toLocaleString();

    this.sherpas = [
      this.getSherpa("Panda"),
      this.getSherpa("Peacock"),
      this.getSherpa("Snail"),
      this.getSherpa("Tiger"),
    ];
    this.loadState();
  }

  unlockSherpa(index: number) {
    const forms = this.sherpas[index].forms;
    forms.forEach(form => {
      form.state = 7;
    });
    this.forms.update((f) => [...f]);
    this.saveState();
  }

  unlockItems(sig: WritableSignal<IZoo[]>) {
    sig().forEach(item => item.state = 1);
    sig.update((f) => [...f]);
    this.saveState();
  }

  unlock(state: number, item: IZoo, sig: WritableSignal<IZoo[]>) {
    item.state = state;
    sig.update((f) => [...f]);
    this.saveState();
  }

  showSecrets() {
    this.spoilers = true;
    localStorage.setItem('karmazoo.spoilers', '1');
  }

  private getSherpa(name: string): {name: string, forms: IZoo[]} {
    return {
      name,
      forms: this.forms().filter(x => x.star === name),
    }
  }

  private sumCurrencies(items: IZoo[]): number {
    return items.reduce((acc, cur) => acc + (cur.price ?? 0), 0);
  }

  private initZoo(x: IZoo): IZoo {
    return {...x, state: 0};
  }

  private saveState(): void {
    const state = {
      forms: this.forms().map(x => x.state ?? 0),
      items: this.items().map(x => x.state ?? 0),
      other: this.other().map(x => x.state ?? 0),
      tree: this.tree().map(x => x.state ?? 0),
    };
    localStorage.setItem('karmazoo.save', JSON.stringify(state));

    // const abc = [
    //   ...this.forms().map(x => x.state ?? 0),
    //   ...this.items().map(x => x.state ?? 0),
    //   ...this.other().map(x => x.state ?? 0),
    //   ...this.tree().map(x => x.state ?? 0),
    // ];
    // const encoded = lzw_encode(abc.join(','));
    // const url = new URL(location.toString());
    // url.searchParams.set('save', encoded);
    // history.pushState({}, '', url);
  }

  private loadState(): void {
    const state = JSON.parse(localStorage.getItem('karmazoo.save') ?? '{}');
    state.forms && this.forms().forEach((x, i) => x.state = state.forms[i]);
    state.items && this.items().forEach((x, i) => x.state = state.items[i]);
    state.other && this.other().forEach((x, i) => x.state = state.other[i]);
    state.tree && this.tree().forEach((x, i) => x.state = state.tree[i]);
  }
}
