import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AllNodesComponent } from './all-nodes.component';

describe('AllNodesComponent', () => {
  let component: AllNodesComponent;
  let fixture: ComponentFixture<AllNodesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AllNodesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllNodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
