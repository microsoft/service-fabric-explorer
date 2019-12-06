import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlainTextComponent } from './plain-text.component';

describe('PlainTextComponent', () => {
  let component: PlainTextComponent;
  let fixture: ComponentFixture<PlainTextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlainTextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlainTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
