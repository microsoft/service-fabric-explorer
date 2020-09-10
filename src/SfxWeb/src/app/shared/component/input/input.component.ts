import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent implements OnInit, OnDestroy {

  debounceHandler: Subject<string> = new Subject<string>();
  debouncerHandlerSubscription: Subscription;

  modelValue: string;

  @Input() placeholder = 'Search list';
  @Input()
  get model(){
    return this.modelValue;
  }

  set model(val: string) {
    this.modelValue = val;
    this.onValueChange(val);
  }


  @Output() onChange: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {
    this.debouncerHandlerSubscription = this.debounceHandler
   .pipe(debounceTime(200), distinctUntilChanged())
   .subscribe(val => {
      this.onChange.emit(val);
   });
  }

  ngOnDestroy() {
    if (this.debouncerHandlerSubscription){
      this.debouncerHandlerSubscription.unsubscribe();
    }
  }

  onValueChange(event: string) {
    this.debounceHandler.next(event);
  }

}
