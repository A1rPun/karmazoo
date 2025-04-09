import { Component, computed, effect, Signal, signal, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ItemComponent } from "./item/item.component";
import { IZoo } from './zoo.interface';

import forms from './../assets/forms.json';
import items from './../assets/items.json';
import other from './../assets/other.json';
import tree from './../assets/tree.json';
import trophies from './../assets/achievements.json';
import { ToggleComponent } from "./toggle/toggle.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ItemComponent, ToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  forms: WritableSignal<IZoo[]> = signal(forms.map(this.initZoo));
  items: WritableSignal<IZoo[]> = signal(items.map(this.initZoo));
  other: WritableSignal<IZoo[]> = signal(other.map(this.initZoo));
  tree: WritableSignal<IZoo[]> = signal(tree.map(this.initZoo));
  trophies: WritableSignal<IZoo[]> = signal(trophies.map(this.initZoo));
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
  missions = computed(() => this.forms().reduce((acc, cur) => {
    return acc + this.getMissionCount(cur.state);
  }, 0));

  hasAllItems = computed(() => this.items().every((x) => x.state === 1));
  hasAllOther = computed(() => this.other().every((x) => x.state === 1));
  hasAllTree = computed(() => this.tree().every((x) => x.state === 1));
  hasAllTrophies = computed(() => this.trophies().every((x) => x.state === 1));

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

    effect(()=> {
      this.trophies.update(t => {
        // First Time
        t[0].state = this.missions() > 0 ? 1 : 0;
        // Find a secret statue in your Sanctuary
        t[6].state = this.forms().some(x => x.secret && (x.state ?? 0 > 0)) ? 1 : t[6].state;
        // Bookworm
        t[9].state = this.other()[6].state === 1 && this.other()[7].state === 1 ? 1 : 0;
        // Reveal 10 Stars
        t[12].state = this.forms().filter(x => x.state ?? 0 > 0).length >= 10 ? 1 : 0;
        // Reveal 20 Stars
        t[13].state = this.forms().filter(x => x.state ?? 0 > 0).length >= 20 ? 1 : 0;
        // Have 10 Stars shining
        t[14].state = this.forms().filter(x => x.state === 15).length >= 10 ? 1 : 0;
        // Have 20 Stars shining
        t[15].state = this.forms().filter(x => x.state === 15).length >= 20 ? 1 : 0;
        // Enlighten 20 planets
        t[16].state = this.missions() >= 20 ? 1 : 0;
        // Enlighten 40 planets
        t[17].state = this.missions() >= 40 ? 1 : 0;
        return [...t];
      });
    });

    this.sherpas = [
      this.getSherpa("Panda"),
      this.getSherpa("Peacock"),
      this.getSherpa("Snail"),
      this.getSherpa("Tiger"),
    ];
    this.loadState();
    this.versionCheck();
  }

  unlockSherpa(index: number, unlock: boolean) {
    const state = unlock ? 15 : 0;
    const forms = this.sherpas[index].forms;
    forms.forEach(form => form.state = state);
    this.forms.update((f) => [...f]);
    this.saveState();
  }

  unlockItems(sig: WritableSignal<IZoo[]>, unlock: boolean) {
    const state = unlock ? 1 : 0;
    sig().forEach(item => item.state = state);
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

  private getSherpa(name: string): {
    name: string,
    forms: IZoo[],
    hasAll: Signal<boolean>,
    missions: Signal<number>,
    totalMissions: number
  } {
    const forms = this.forms().filter(x => x.star === name);
    return {
      name,
      forms,
      totalMissions: forms.length * 3,
      hasAll: computed(() => this.forms().filter(x => x.star === name).every(x => x.state === 15)),
      missions: computed(() =>
        this.forms()
          .filter(x => x.star === name)
          .reduce((acc, cur) =>
            acc + this.getMissionCount(cur.state), 0)),
    }
  }

  private sumCurrencies(items: IZoo[]): number {
    return items.reduce((acc, cur) => acc + (cur.price ?? 0), 0);
  }

  private initZoo(x: IZoo): IZoo {
    return {...x, state: 0};
  }

  private getMissionCount(state: number = 0) {
    let missionCount = 0;
    if (state & 2) missionCount += 1;
    if (state & 4) missionCount += 1;
    if (state & 8) missionCount += 1;
    return missionCount;
  }

  private saveState(): void {
    const state = {
      forms: this.forms().map(x => x.state ?? 0),
      items: this.items().map(x => x.state ?? 0),
      other: this.other().map(x => x.state ?? 0),
      tree: this.tree().map(x => x.state ?? 0),
      trophies: this.trophies().map(x => x.state ?? 0),
    };
    localStorage.setItem('karmazoo.save', JSON.stringify(state));
  }

  private loadState(): void {
    const state = JSON.parse(localStorage.getItem('karmazoo.save') ?? '{}');
    state.forms && this.forms().forEach((x, i) => x.state = state.forms[i]);
    state.items && this.items().forEach((x, i) => x.state = state.items[i]);
    state.other && this.other().forEach((x, i) => x.state = state.other[i]);
    state.tree && this.tree().forEach((x, i) => x.state = state.tree[i]);
    state.trophies && this.trophies().forEach((x, i) => x.state = state.trophies[i]);
  }

  private versionCheck(): void {
    const version = localStorage.getItem('karmazoo.version');

    // migration from v1.0.0 -> v1.0.1
    if (!version) {
      this.forms().forEach(x => {
        if (x.state === 3) x.state = 5;
        else if (x.state === 5) x.state = 9;
        else if (x.state === 7) x.state = 15;
      });
      this.saveState();
    }
    localStorage.setItem('karmazoo.version', '1.0.1');
  }
}
