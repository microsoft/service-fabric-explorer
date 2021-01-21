import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetBackupEnabledEntitiesComponent } from './get-backup-enabled-entities.component';

describe('GetBackupEnabledEntitiesComponent', () => {
  let component: GetBackupEnabledEntitiesComponent;
  let fixture: ComponentFixture<GetBackupEnabledEntitiesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GetBackupEnabledEntitiesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GetBackupEnabledEntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
