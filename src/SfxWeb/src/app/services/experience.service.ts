import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ExperienceService {
  private storage = inject(StorageService);
  readonly isNew = signal(this.storage.getValueBoolean('sfxNewExperience', true));

  setNew(value: boolean) {
    this.storage.setValue('sfxNewExperience', value);
    this.isNew.set(value);
  }
}
