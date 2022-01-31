import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabricObserverComponent } from './fabric-observer.component';

describe('FabricObserverComponent', () => {
  let component: FabricObserverComponent;
  let fixture: ComponentFixture<FabricObserverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FabricObserverComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FabricObserverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
