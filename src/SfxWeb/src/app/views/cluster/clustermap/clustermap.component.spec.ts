import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ClustermapComponent } from './clustermap.component';

describe('ClustermapComponent', () => {
  let component: ClustermapComponent;
  let fixture: ComponentFixture<ClustermapComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ClustermapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClustermapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
