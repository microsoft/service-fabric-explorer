import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DetailTableResolverComponent } from './detail-table-resolver.component';

describe('DetailTableResolverComponent', () => {
  let component: DetailTableResolverComponent;
  let fixture: ComponentFixture<DetailTableResolverComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DetailTableResolverComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailTableResolverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
