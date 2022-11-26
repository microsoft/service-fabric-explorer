import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewtabComponent } from './newtab.component';

describe('NewtabComponent', () => {
  let component: NewtabComponent;
  let fixture: ComponentFixture<NewtabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewtabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewtabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
