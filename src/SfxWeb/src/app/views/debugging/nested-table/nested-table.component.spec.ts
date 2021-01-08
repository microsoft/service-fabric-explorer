import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NestedTableComponent } from './nested-table.component';

describe('NestedTableComponent', () => {
  let component: NestedTableComponent;
  let fixture: ComponentFixture<NestedTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NestedTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NestedTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
