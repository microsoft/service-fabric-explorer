import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PartitionInfoComponent } from './partition-info.component';

describe('PartitionInfoComponent', () => {
  let component: PartitionInfoComponent;
  let fixture: ComponentFixture<PartitionInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PartitionInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PartitionInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
