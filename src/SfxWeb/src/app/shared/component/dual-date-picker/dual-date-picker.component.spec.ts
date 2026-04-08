import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbDatepickerModule, NgbDate } from '@ng-bootstrap/ng-bootstrap';

import { DualDatePickerComponent } from './dual-date-picker.component';

describe('DualDatePickerComponent', () => {
  let component: DualDatePickerComponent;
  let fixture: ComponentFixture<DualDatePickerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DualDatePickerComponent ],
      imports: [ FormsModule, NgbDatepickerModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DualDatePickerComponent);
    component = fixture.componentInstance;
    
    // Initialize required inputs
    component.minDate = new Date('2025-01-01');
    component.maxDate = new Date('2025-12-31');
    component.currentStartDate = new Date('2025-01-01');
    component.currentEndDate = new Date('2025-01-31');
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onDateInputChange', () => {
    it('should emit dateChanged when both dates are valid and fromDate <= toDate', () => {
      // Arrange
      component.fromDate = NgbDate.from({year: 2025, month: 1, day: 1});
      component.toDate = NgbDate.from({year: 2025, month: 1, day: 31});
      component.currentStartDate = new Date('2025-01-01');
      component.currentEndDate = new Date('2025-01-31');
      
      spyOn(component.dateChanged, 'emit');
      
      // Act
      component.onDateInputChange();
      
      // Assert
      expect(component.dateChanged.emit).toHaveBeenCalledWith({
        endDate: component.currentEndDate,
        startDate: component.currentStartDate
      });
    });

    it('should not emit dateChanged when fromDate is null', () => {
      // Arrange
      component.fromDate = null;
      component.toDate = NgbDate.from({year: 2025, month: 1, day: 31});
      
      spyOn(component.dateChanged, 'emit');
      
      // Act
      component.onDateInputChange();
      
      // Assert
      expect(component.dateChanged.emit).not.toHaveBeenCalled();
    });

    it('should not emit dateChanged when toDate is null', () => {
      // Arrange
      component.fromDate = NgbDate.from({year: 2025, month: 1, day: 1});
      component.toDate = null;
      
      spyOn(component.dateChanged, 'emit');
      
      // Act
      component.onDateInputChange();
      
      // Assert
      expect(component.dateChanged.emit).not.toHaveBeenCalled();
    });

    it('should not emit dateChanged when fromDate is after toDate', () => {
      // Arrange: Start date after end date (invalid range)
      component.fromDate = NgbDate.from({year: 2025, month: 1, day: 31});
      component.toDate = NgbDate.from({year: 2025, month: 1, day: 1});
      component.currentStartDate = new Date('2025-01-31');
      component.currentEndDate = new Date('2025-01-01');
      
      spyOn(component.dateChanged, 'emit');
      
      // Act
      component.onDateInputChange();
      
      // Assert
      expect(component.dateChanged.emit).not.toHaveBeenCalled();
    });

    it('should emit dateChanged when fromDate equals toDate (same day)', () => {
      // Arrange: Same day is valid
      component.fromDate = NgbDate.from({year: 2025, month: 1, day: 15});
      component.toDate = NgbDate.from({year: 2025, month: 1, day: 15});
      component.currentStartDate = new Date('2025-01-15');
      component.currentEndDate = new Date('2025-01-15');
      
      spyOn(component.dateChanged, 'emit');
      
      // Act
      component.onDateInputChange();
      
      // Assert
      expect(component.dateChanged.emit).toHaveBeenCalledWith({
        endDate: component.currentEndDate,
        startDate: component.currentStartDate
      });
    });
  });
});
