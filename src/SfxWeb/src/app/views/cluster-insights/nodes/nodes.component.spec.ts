import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FMMNodesComponent } from './nodes.component';

describe('FMMNodesComponent', () => {
  let component: FMMNodesComponent;
  let fixture: ComponentFixture<FMMNodesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FMMNodesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FMMNodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
