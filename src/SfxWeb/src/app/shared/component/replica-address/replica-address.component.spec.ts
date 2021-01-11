import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReplicaAddressComponent } from './replica-address.component';

describe('ReplicaAddressComponent', () => {
  let component: ReplicaAddressComponent;
  let fixture: ComponentFixture<ReplicaAddressComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReplicaAddressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReplicaAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
