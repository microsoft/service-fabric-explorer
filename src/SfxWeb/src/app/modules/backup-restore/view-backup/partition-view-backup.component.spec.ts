import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewBackupComponent } from './view-backup.component';

describe('PartitionViewBackupComponent', () => {
  let component: ViewBackupComponent;
  let fixture: ComponentFixture<ViewBackupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewBackupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewBackupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
