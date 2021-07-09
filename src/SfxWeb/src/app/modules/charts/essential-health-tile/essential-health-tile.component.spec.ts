import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EssentialHealthTileComponent } from './essential-health-tile.component';

describe('EssentialHealthTileComponent', () => {
  let component: EssentialHealthTileComponent;
  let fixture: ComponentFixture<EssentialHealthTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EssentialHealthTileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EssentialHealthTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
