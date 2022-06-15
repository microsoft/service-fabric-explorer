import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeTypesComponent } from './node-types.component';

describe('NodeTypesComponent', () => {
  let component: NodeTypesComponent;
  let fixture: ComponentFixture<NodeTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodeTypesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
