//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {

    export interface IDashboardChartViewModel extends angular.IScope {
        data: IDashboardViewModel;
    }

    export class DashboardChartDirective implements ng.IDirective {
        public restrict = "AE";
        public replace = true;
        public templateUrl = "partials/dashboard.html";
        public scope = {
            data: "="
        };

        public static factory(): ng.IDirectiveFactory {
            let directive = () => new DashboardChartDirective();
            directive.$inject = [];
            return directive;
        }

        public link: ng.IDirectiveLinkFn = ($scope: IDashboardChartViewModel, element: JQuery, attributes: ng.IAttributes) => {
            let margin = 3;
            let width = ($scope.data.largeTile ? 200 : 120) + margin * 2;
            let height = width;
            let arcWidth = ($scope.data.largeTile ? 10 : 8);
            let outerRadius = width / 2 - margin;
            let innerRadius = width / 2 - arcWidth - margin;
            let transitionDuration = Constants.SvgTransitionDurationSlow;

            function convertAngle(angle) {
                return angle / 360 * 270 - Math.PI / 4;
            };

            let pie = d3.layout.pie<IDashboardDataPointViewModel>()
                .value(d => d.adjustedCount)
                .sort(null);

            let arc = d3.svg.arc()
                .startAngle(d => convertAngle(d.startAngle))
                .endAngle(d => convertAngle(d.endAngle))
                .outerRadius(outerRadius)
                .innerRadius(innerRadius);

            let svg = d3.select(element[0])
                .select(".dashboard-donut-chart")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            // Add title and number
            let textOffset = $scope.data.largeTile ? 40 : 32;
            let textGroup = svg.append("g")
                .attr("transform", "translate(-" + width / 2 + ", -6)");
            let number = textGroup.append("text")
                .attr("class", "dashboard-number");
            let title = textGroup.append("text")
                .attr("transform", "translate(8, " + textOffset + ")")
                .attr("class", "dashboard-title");

            // Add the background arc
            let bgArc = svg.append("path");
            bgArc.datum({ startAngle: 0, endAngle: Math.PI * 2 })
                .transition()
                .duration(transitionDuration)
                .attr("class", "dashboard-arc-bg")
                .attr("d", <any>arc)
                .attrTween("d", arcTween);

            // Conditionally add padding between non-zero sections after draw background arc
            arc.padAngle((d, i) => {
                if ((<any>d).data) {
                    return (<any>d).data.adjustedCount === 0 ? 0 : .03;
                }
                return 0;
            });

            function arcTween(d, index) {
                if (!this._current) {
                    this._current = {
                        startAngle: 0,
                        endAngle: 0
                    };
                }
                let interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function (t) {
                    return arc(<any>interpolate(t));
                };
            };

            $scope.$watch("data", () => {
                let data = pie($scope.data.dataPoints);
                let path = svg.selectAll(".dashboard-arc");
                let prevData = path.data().length > 0 ? path.data() : pie([]);
                let join = path.data(data, d => d.data.title);

                // Need to match $dashboard-number-font-size, $dashboard-small-number-font-size in _dashboard.scss
                let fontSize = $scope.data.largeTile ? 72 : 50;
                let fontSizeFactor = $scope.data.largeTile ? 160 : 112;

                // Change title and number
                title.text($scope.data.displayTitle.toUpperCase());
                number.text($scope.data.count)
                    .style("font-size", function (d) {
                        // Resize the number based on the string length
                        return Math.min(fontSize, Math.floor(fontSizeFactor / $scope.data.count.toString().length) * 1.9) + "px";
                    });
                if ($scope.data.count.toString().length > 6) {
                    number.attr("transform", "translate(6, 10)");
                } else {
                    number.attr("transform", "translate(6, 18)");
                }

                // Hide the background arc when there are data points available
                bgArc.attr("display", () => $scope.data.count > 0 ? "none" : null);

                // Add arc
                let section = join.enter()
                    .append("path");
                section.append("title")
                    .text(d => $scope.data.getDataPointTooltip(d.data));
                section.attr("class", d => "dashboard-arc " + d.data.state.badgeClass)
                    .transition()
                    .duration(transitionDuration)
                    .attr("d", <any>arc)
                    .attrTween("d", arcTween)
                    .each(function (d, index) {
                        // Find the correct entrypoint for the new arc
                        let startAngle = 0;
                        if (index > 0 && prevData.length >= index) {
                            startAngle = prevData[index - 1].endAngle + prevData[index - 1].padAngle;
                        }
                        this._current = { startAngle: startAngle, endAngle: startAngle };
                    });

                // Update arc
                join.transition()
                    .duration(transitionDuration)
                    .attrTween("d", arcTween);
                join.select("title")
                    .text(d => $scope.data.getDataPointTooltip(d.data));

                // Remove arc
                join.exit()
                    .datum((d, index) => {
                        // Find the correct exit point for the arc to be removed
                        let startAngle = convertAngle(Math.PI * 2);
                        if (index > 0 && data.length >= index) {
                            startAngle = data[index - 1].endAngle;
                        }
                        return { startAngle: startAngle, endAngle: startAngle };
                    })
                    .transition()
                    .duration(transitionDuration)
                    .attrTween("d", arcTween)
                    .remove();

            }, true);
        }
    }
}
