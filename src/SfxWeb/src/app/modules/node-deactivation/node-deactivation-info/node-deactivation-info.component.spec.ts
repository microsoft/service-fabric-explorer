import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeDeactivationInfoComponent } from './node-deactivation-info.component';

describe('NodeDeactivationInfoComponent', () => {
  let component: NodeDeactivationInfoComponent;
  let fixture: ComponentFixture<NodeDeactivationInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodeDeactivationInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDeactivationInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
