import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradingComponent } from './upgrading.component';

describe('UpgradingComponent', () => {
  let component: UpgradingComponent;
  let fixture: ComponentFixture<UpgradingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpgradingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
