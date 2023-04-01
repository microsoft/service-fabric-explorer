import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FederationComponent } from './federation.component';

describe('FederationComponent', () => {
  let component: FederationComponent;
  let fixture: ComponentFixture<FederationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FederationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FederationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
