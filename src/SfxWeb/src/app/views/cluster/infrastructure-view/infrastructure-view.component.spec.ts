import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrastructureViewComponent } from './infrastructure-view.component';

describe('InfrastructureViewComponent', () => {
  let component: InfrastructureViewComponent;
  let fixture: ComponentFixture<InfrastructureViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfrastructureViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfrastructureViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
