import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailListComponent } from './detail-list.component';

describe('DetailListComponent', () => {
  let component: DetailListComponent;
  let fixture: ComponentFixture<DetailListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetailListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
