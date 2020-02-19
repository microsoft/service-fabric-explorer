import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplicaAddressComponent } from './replica-address.component';

describe('ReplicaAddressComponent', () => {
  let component: ReplicaAddressComponent;
  let fixture: ComponentFixture<ReplicaAddressComponent>;

  beforeEach(async(() => {
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
