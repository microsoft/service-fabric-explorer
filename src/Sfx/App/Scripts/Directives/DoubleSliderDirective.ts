//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export class DoubleSliderDirective implements ng.IDirective {
        public restrict = "E";
        public replace = true;
        // public controller = TimeLineChartController;
        public controllerAs = "ctrl";
        public templateUrl = "partials/double-slider-directive.html";
        public scope = {
            startDate: "=",
            endDate: "=",
        };
        public transclude = true;

        public link($scope: any, element: JQuery, attributes: any) {

            //given we are using an event emitter below, angular doesnt hook over those events so we need to request an update
            //the easiest way to do this is use an async api and ask for $apply to make angular run a digest cycle
            const forceUpdate = () => {
                _.defer(function(){$scope.$apply();})
            }
            //watch for changes to dates to know when to attempt to update the scroll bar
            // note: when this updates the value it'll cycle back down and call this so making sure you have a check
            //for only updating on new values so it doesnt get stuck on an update loop.
            $scope.$watchGroup(['startDate','endDate'],() =>{
                if($scope.startDate &&  $scope.endDate){
                    
                    //create the slider if one doesnt exist on this element
                    //noUiSlider throws an error if you attempt to create on an element that already has it.
                    if(!$scope.slider){
                        $scope.slider = noUiSlider.create(element[0], {
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
                            step: 60 * 60 * 1000,
                            start: [new Date($scope.startDate).getTime(), new Date($scope.endDate).getTime()]
                        });
                    
                        $scope.slider.on('set', (data) => {
                            const end = new Date(data[1]);
                            const start = new Date(data[0]);

                            if($scope.endDate.toUTCString() !== end.toUTCString()){
                                $scope.endDate = end;
                                forceUpdate();
                            }
                            if($scope.startDate.toUTCString() !== start.toUTCString()){
                                $scope.startDate = start;
                                forceUpdate();
                            }
                        })
                    }
                    $scope.slider.set([new Date($scope.startDate).getTime(), new Date($scope.endDate).getTime()]);
                }
            });
        }
    }
}
