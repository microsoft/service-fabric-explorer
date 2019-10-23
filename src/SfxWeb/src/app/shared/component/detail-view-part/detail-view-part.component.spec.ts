import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailViewPartComponent } from './detail-view-part.component';

describe('DetailViewPartComponent', () => {
  let component: DetailViewPartComponent;
  let fixture: ComponentFixture<DetailViewPartComponent>;

  beforeEach(async(() => {
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
