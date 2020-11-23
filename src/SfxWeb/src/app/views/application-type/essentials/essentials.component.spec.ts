import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EssentialsComponent } from './essentials.component';

describe('EssentialsComponent', () => {
  let component: EssentialsComponent;
  let fixture: ComponentFixture<EssentialsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EssentialsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EssentialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
