import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HyperLinkComponent } from './hyper-link.component';

describe('HyperLinkComponent', () => {
  let component: HyperLinkComponent;
  let fixture: ComponentFixture<HyperLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HyperLinkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HyperLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
