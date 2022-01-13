import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadConfigurationComponent } from './bad-configuration.component';

describe('BadConfigurationComponent', () => {
  let component: BadConfigurationComponent;
  let fixture: ComponentFixture<BadConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BadConfigurationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BadConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
