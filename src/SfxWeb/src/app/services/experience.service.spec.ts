import { TestBed } from '@angular/core/testing';
import { ExperienceService } from './experience.service';
import { StorageService } from './storage.service';

describe('ExperienceService', () => {
  it('loads and persists the shared preference', () => {
    const storage = jasmine.createSpyObj('StorageService', ['getValueBoolean', 'setValue']);
    storage.getValueBoolean.and.returnValue(false);
    TestBed.configureTestingModule({ providers: [{ provide: StorageService, useValue: storage }] });
    const service = TestBed.inject(ExperienceService);
    expect(service.isNew()).toBeFalse();
    service.setNew(true);
    expect(service.isNew()).toBeTrue();
    expect(storage.setValue).toHaveBeenCalledWith('sfxNewExperience', true);
  });
});
