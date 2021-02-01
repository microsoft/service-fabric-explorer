import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BackupinfoComponent } from './backupinfo.component';

describe('BackupinfoComponent', () => {
  let component: BackupinfoComponent;
  let fixture: ComponentFixture<BackupinfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BackupinfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupinfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
