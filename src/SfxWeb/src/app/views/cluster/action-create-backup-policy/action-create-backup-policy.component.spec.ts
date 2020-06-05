import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionCreateBackupPolicyComponent } from './action-create-backup-policy.component';

describe('ActionCreateBackupPolicyComponent', () => {
  let component: ActionCreateBackupPolicyComponent;
  let fixture: ComponentFixture<ActionCreateBackupPolicyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionCreateBackupPolicyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionCreateBackupPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
