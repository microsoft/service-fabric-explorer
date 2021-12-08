import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeFilterComponent } from './node-filter.component';

describe('NodeFilterComponent', () => {
  let component: NodeFilterComponent;
  let fixture: ComponentFixture<NodeFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodeFilterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
