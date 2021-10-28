import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeProgressComponent } from './node-progress.component';

describe('NodeProgressComponent', () => {
  let component: NodeProgressComponent;
  let fixture: ComponentFixture<NodeProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NodeProgressComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
