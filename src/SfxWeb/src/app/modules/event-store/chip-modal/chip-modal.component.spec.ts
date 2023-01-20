import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChipModalComponent } from './chip-modal.component';

describe('ChipModalComponent', () => {
  let component: ChipModalComponent;
  let fixture: ComponentFixture<ChipModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChipModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChipModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
