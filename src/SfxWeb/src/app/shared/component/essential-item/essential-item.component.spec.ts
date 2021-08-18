import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EssentialItemComponent } from './essential-item.component';

describe('EssentialItemComponent', () => {
  let component: EssentialItemComponent;
  let fixture: ComponentFixture<EssentialItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EssentialItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EssentialItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
