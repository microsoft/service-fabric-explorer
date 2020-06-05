import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CandyBarCompactComponent } from './candy-bar-compact.component';

describe('CandyBarCompactComponent', () => {
  let component: CandyBarCompactComponent;
  let fixture: ComponentFixture<CandyBarCompactComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CandyBarCompactComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CandyBarCompactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
