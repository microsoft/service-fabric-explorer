import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadCellComponent } from './load-cell.component';

describe('LoadCellComponent', () => {
  let component: LoadCellComponent;
  let fixture: ComponentFixture<LoadCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadCellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
