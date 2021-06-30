import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusResolverComponent } from './status-resolver.component';

describe('StatusResolverComponent', () => {
  let component: StatusResolverComponent;
  let fixture: ComponentFixture<StatusResolverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StatusResolverComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusResolverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
