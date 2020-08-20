import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeUpgradeProgressComponent } from './node-upgrade-progress.component';

describe('NodeUpgradeProgressComponent', () => {
  let component: NodeUpgradeProgressComponent;
  let fixture: ComponentFixture<NodeUpgradeProgressComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodeUpgradeProgressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeUpgradeProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
