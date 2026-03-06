import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpandedDetailsComponent } from './expanded-details.component';

describe('ExpandedDetailsComponent', () => {
  let component: ExpandedDetailsComponent;
  let fixture: ComponentFixture<ExpandedDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpandedDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpandedDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
