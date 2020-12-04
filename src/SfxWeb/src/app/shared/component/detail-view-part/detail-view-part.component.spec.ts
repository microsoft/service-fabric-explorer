import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DetailViewPartComponent } from './detail-view-part.component';

describe('DetailViewPartComponent', () => {
  let component: DetailViewPartComponent;
  let fixture: ComponentFixture<DetailViewPartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DetailViewPartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailViewPartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
