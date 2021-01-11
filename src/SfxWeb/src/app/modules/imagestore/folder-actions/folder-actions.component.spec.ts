import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FolderActionsComponent } from './folder-actions.component';

describe('FolderActionsComponent', () => {
  let component: FolderActionsComponent;
  let fixture: ComponentFixture<FolderActionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FolderActionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FolderActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
