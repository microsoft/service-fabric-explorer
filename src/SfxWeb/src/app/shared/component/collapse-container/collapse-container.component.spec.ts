import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CollapseContainerComponent } from './collapse-container.component';

describe('CollapseContainerComponent', () => {
  let component: CollapseContainerComponent;
  let fixture: ComponentFixture<CollapseContainerComponent>;

  beforeEach(waitForAsync(() => {
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
