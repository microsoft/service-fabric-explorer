import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EssentialComponent } from './essential.component';

describe('EssentialComponent', () => {
  let component: EssentialComponent;
  let fixture: ComponentFixture<EssentialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EssentialComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EssentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
