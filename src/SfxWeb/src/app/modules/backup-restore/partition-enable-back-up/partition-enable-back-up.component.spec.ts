import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PartitionEnableBackUpComponent } from './partition-enable-back-up.component';

describe('PartitionEnableBackUpComponent', () => {
  let component: PartitionEnableBackUpComponent;
  let fixture: ComponentFixture<PartitionEnableBackUpComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PartitionEnableBackUpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartitionEnableBackUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
