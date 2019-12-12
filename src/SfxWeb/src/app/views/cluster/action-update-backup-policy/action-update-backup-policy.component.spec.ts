import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionUpdateBackupPolicyComponent } from './action-update-backup-policy.component';

describe('ActionUpdateBackupPolicyComponent', () => {
  let component: ActionUpdateBackupPolicyComponent;
  let fixture: ComponentFixture<ActionUpdateBackupPolicyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionUpdateBackupPolicyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionUpdateBackupPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
