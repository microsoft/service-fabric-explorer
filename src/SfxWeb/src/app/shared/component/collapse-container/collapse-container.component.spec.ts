import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollapseContainerComponent } from './collapse-container.component';

describe('CollapseContainerComponent', () => {
  let component: CollapseContainerComponent;
  let fixture: ComponentFixture<CollapseContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollapseContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollapseContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
