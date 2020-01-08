import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { TimeUtils } from 'src/app/Utils/TimeUtils';
import * as noUiSlider from "nouislider";
@Component({
  selector: 'app-double-slider',
  templateUrl: './double-slider.component.html',
  styleUrls: ['./double-slider.component.scss']
})
export class DoubleSliderComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() startDate: any;
  @Input() endDate: any;

  @Output() onDateChange = new EventEmitter();

  slider: noUiSlider.noUiSlider;

  @ViewChild('slider', { static: false }) container: ElementRef;


  constructor() { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    
    this.slider = noUiSlider.create(this.container.nativeElement, {
        format: {
            to : num => {
                const date = new Date(num);
                return date.toLocaleString("en-us");
            },
            from: Number
        },
        tooltips: true,
        connect: true,
        range: {
            min: TimeUtils.AddDays(new Date(), -30).getTime(),
            max: new Date().getTime(),
        },
        step: 60 * 1000, //let the steps be as granular as a minute.
        start: [new Date(this.startDate).getTime(), new Date(this.endDate).getTime()]
    });

    //watch for changes to dates to know when to attempt to update the scroll bar
    // note: when this updates the value it'll cycle back down and call this so making sure you have a check
    //for only updating on new values so it doesnt get stuck on an update loop.
    this.slider.on("set", (data) => {
        const start = new Date(data[0]);
        const end = new Date(data[1]);

        if (this.endDate.toUTCString() !== end.toUTCString()) {
            this.endDate = end;
        }
        if (this.startDate.toUTCString() !== start.toUTCString()) {
            this.startDate = start;
        }

        this.onDateChange.emit({
          endDate: this.endDate,
          startDate: this.startDate
        })
    });

                //watch for changes to dates to know when to attempt to update the scroll bar
            // note: when this updates the value it'll cycle back down and call this so making sure you have a check
            //for only updating on new values so it doesnt get stuck on an update loop.
          //   $scope.$watchGroup(["startDate", "endDate"], () => {
          //     if ($scope.startDate &&  $scope.endDate) {
          //         //create the slider if one doesnt exist on this element
          //         //noUiSlider throws an error if you attempt to create on an element that already has it.
          //         if (!$scope.slider) {
          //             $scope.slider = noUiSlider.create(element[0], {
          //                 format: {
          //                     to : num => {
          //                         const date = new Date(num);
          //                         return date.toLocaleString("en-us");
          //                     },
          //                     from: Number
          //                 },
          //                 tooltips: true,
          //                 connect: true,
          //                 range: {
          //                     min: TimeUtils.AddDays(new Date(), -30).getTime(),
          //                     max: new Date().getTime(),
          //                 },
          //                 step: 60 * 1000, //let the steps be as granular as a minute.
          //                 start: [new Date($scope.startDate).getTime(), new Date($scope.endDate).getTime()]
          //             });

          //             $scope.slider.on("set", (data) => {
          //                 const end = new Date(data[1]);
          //                 const start = new Date(data[0]);

          //                 if ($scope.endDate.toUTCString() !== end.toUTCString()) {
          //                     $scope.endDate = end;
          //                     forceUpdate();
          //                 }
          //                 if ($scope.startDate.toUTCString() !== start.toUTCString()) {
          //                     $scope.startDate = start;
          //                     forceUpdate();
          //                 }
          //             });
          //         }
          //     }
          // });
          console.log(this)
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
    if(this.slider){
      this.slider.set([new Date(this.startDate).getTime(), new Date(this.endDate).getTime()]);
    }
  }

}
