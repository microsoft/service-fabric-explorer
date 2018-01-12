//-----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

module Sfx {
    export class MetricsBarChartDirective implements ng.IDirective {

        public restrict = "A";

        public static factory(): ng.IDirectiveFactory {
            let directive = ($compile: angular.ICompileService) => new MetricsBarChartDirective($compile);
            directive.$inject = ["$compile"];
            return directive;
        }

        public constructor(public $compile: angular.ICompileService) {
        }

        public link: ng.IDirectiveLinkFn = ($scope: IMetricsViewScope, element: JQuery, attributes: ng.IAttributes) => {
            let self = this;
            let maxBarsShownInOneScreen = 20;

            let margin = { bottom: 100, left: 60 };

            // DO NOT try to get element's size at runtime because during page load the
            // css might not be loaded when the directive is linked.

            // Keep the chart size consistent with _metrics.scss
            // $metric-chart-body-width: 760px;
            let containerWidth = 760;
            let width = containerWidth;
            // $metric-chart-height: 630px;
            // 25px is space for horizontal scrollbar
            let height = 630 - 25 - margin.bottom;

            let transitionDuration = Constants.SvgTransitionDuration;

            let x0 = d3.scale.ordinal<string, number>().rangeBands([0, width]);

            let x1 = d3.scale.ordinal<number>();

            let y = d3.scale.linear()
                .range([height, 0]);

            let xAxis = d3.svg.axis()
                .scale(x0)
                .outerTickSize(0)
                .orient("bottom");

            let yAxis = d3.svg.axis()
                .scale(y)
                .ticks(0)
                .outerTickSize(0)
                .orient("left");

            // Add svg left which contains Y Axis and it is not scrollable
            let svgLeft = d3.select(element[0])
                .append("svg")
                .attr("class", "metrics-chart-left")
                .append("g")
                .attr("transform", `translate(${margin.left}, 0)`);

            // Add svg body container which has fixed width as scroll parent of the chart
            let svgBodyContainer = d3.select(element[0])
                .append("div")
                .attr("class", "metrics-chart-body-container");

            // Add svg body inside a scrollable parent container, which contains the X axis and the chart body.
            let svg = svgBodyContainer
                .append("svg")
                .attr("class", "metrics-chart-body")
                .attr("width", "100%"); // Intial width must be set to prevent chart flicking during loading

            // Add svg right which contains the labels and it is not scrollable
            let svgRight = d3.select(element[0])
                .append("svg")
                .attr("class", "metrics-chart-right")
                .append("g");

            // Add groups to make sure elements painted in the correct order
            // (groups appended last painted on top of previous groups)
            let svgNodeTypeMetricCapacitiesGroup = svg.append("g");
            let svgNodeGroup = svg.append("g");

            // X axis
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            // Y axis
            let yLabel = svgLeft.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end");

            // Message text
            let message = svg.append("text")
                .style("text-anchor", "middle")
                .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")
                .text("Loading...");

            function getColor(value: string): string {
                return $scope.metrics.getLegendColor(value);
            }

            // Work around to show ellipsis for text on X axis
            function wrapXAxisLabel(text) {
                let self = d3.select(this);
                let maxRotatedLength = 120;

                // Remove old text, add rotating
                self.text(null).attr("transform", "rotate(-45)").style("text-anchor", "end").attr("dx", "-0.5em").attr("dy", "0.5em");

                // Add tspan
                let tspan = self.append("tspan").text(text),
                    textLength = (<any>(tspan.node())).getComputedTextLength();

                // Add tooltip
                self.append("title").text(text);

                // Add elipse when needed
                if (textLength > maxRotatedLength) {

                    while (textLength > maxRotatedLength && text.length > 0) {
                        text = text.slice(1);
                        tspan.text("..." + text);
                        textLength = (<any>(tspan.node())).getComputedTextLength();
                    }
                }
            }

            // Watch refresh token and do updates
            $scope.$watch("metrics.refreshToken", (newValue, oldValue) => {
                // Make sure only do refresh when the refreshToken is ACTUALLY increased, which means the metrics.refresh() is actually invoked.
                // All other refreshes caused by initialization of variables (metrics, metrics.refreshToken) are redundant.
                if (!$scope.metrics || !$scope.metrics.filteredNodeLoadInformation || _.isUndefined(oldValue)) {
                    return;
                }

                // Find out all selected node metrics
                let nodeMetrics = _.sortBy($scope.metrics.filteredNodeLoadInformation, nli => [nli.parent.raw.Type, nli.name]);

                let selectedMetrics = $scope.metrics.selectedMetrics;
                let selectedMetricNames = _.map(selectedMetrics, m => m.raw.Name);

                // If selected metrics all have capacities and user checked the normalize option
                let hasCapacity = _.some(selectedMetrics, m => m.hasCapacity);
                let normalize = hasCapacity && $scope.metrics.normalizeMetricsData;

                // The outer padding is to make space for possibly rotated labels on X axis
                if (nodeMetrics.length <= maxBarsShownInOneScreen) {
                    $scope.metrics.isExpanderEnabled = false;

                    $(svgBodyContainer[0]).width(width);
                    $(svg[0]).width(width);
                    x0.rangeBands([0, width], .1, .5);

                } else {
                    $scope.metrics.isExpanderEnabled = true;

                    let contentWidth = nodeMetrics.length * width / maxBarsShownInOneScreen;

                    $(svgBodyContainer[0]).width($scope.metrics.isFullScreen ? contentWidth : containerWidth);
                    $(svg[0]).width(contentWidth);
                    x0.rangeBands([0, contentWidth], .1, .5);
                }
                x0.domain(nodeMetrics.map(d => d.name));

                x1.domain(selectedMetricNames).rangeBands([0, x0.rangeBand()], .1);
                let yMax = d3.max(nodeMetrics, n => {
                    return d3.max(_.filter(n.nodeLoadMetricInformation, l => _.includes(selectedMetricNames, l.name)),
                        d => {
                            if (normalize) {
                                return d.loadCapacityRatio;
                            } else if (hasCapacity) {
                                return Math.max(+d.raw.NodeLoad, +d.raw.NodeCapacity);
                            } else {
                                return +d.raw.NodeLoad;
                            }
                        });
                });
                if (normalize) {
                    yMax = Math.max(yMax, d3.max(selectedMetrics, m => m.loadCapacityRatio));
                }
                // Leave 10% space on the top of the chart for tooltip
                y.domain([0, yMax * 1.1]);

                //-------------------------------------------------------------------
                // Draw axis
                //-------------------------------------------------------------------
                let maxLabelWidth = x0.rangeBand();
                svg.selectAll("g.x.axis")
                    .call(xAxis);

                // If any of the label exceeds the max width, rotate all labels
                let labels = svg.selectAll("g.x.axis .tick text");
                let needsRotation = false;
                labels.each(function () {
                    let self = d3.select(this);
                    needsRotation = needsRotation || (<any>(self.node())).getComputedTextLength() >= maxLabelWidth;
                });
                if (needsRotation) {
                    labels.each(wrapXAxisLabel);
                } else {
                    labels.attr("transform", null);
                }

                // Y Axis
                if (normalize) {
                    yAxis.tickFormat(d3.format("%"))
                        .ticks(null);
                } else if (yMax <= 10) {
                    yAxis.tickFormat(d3.format("d"))
                        .ticks(yMax);
                } else {
                    yAxis.tickFormat(d3.format("s"))
                        .ticks(null);
                }
                svgLeft.selectAll("g.y.axis")
                    .transition().duration(transitionDuration)
                    .call(yAxis);

                yLabel.text(selectedMetricNames[0]);

                //-------------------------------------------------------------------
                // Draw metric capacity for node types
                //-------------------------------------------------------------------
                let nodeTypeLoadCaps: NodeTypeMetricCapacity[] = [];
                if (hasCapacity && !normalize) {
                    let selectedMetric = _.first(selectedMetrics);
                    nodeMetrics.forEach(n => {
                        let selectedNodeLoadMetricInfo = _.find(n.nodeLoadMetricInformation, lmi => lmi.name === selectedMetric.name);
                        let lastNodeTypeLoadCap = _.last(nodeTypeLoadCaps);
                        if (lastNodeTypeLoadCap && lastNodeTypeLoadCap.nodeTypeName === n.parent.raw.Type) {
                            lastNodeTypeLoadCap.nodeLoadMetrics.push(selectedNodeLoadMetricInfo);
                        } else {
                            let nodeTypeMetricCap = new NodeTypeMetricCapacity(n.parent.raw.Type, selectedMetric.name, +selectedNodeLoadMetricInfo.raw.NodeCapacity);
                            nodeTypeMetricCap.nodeLoadMetrics.push(selectedNodeLoadMetricInfo);
                            nodeTypeLoadCaps.push(nodeTypeMetricCap);
                        }
                    });
                }

                let metricCapRect = svgNodeTypeMetricCapacitiesGroup.selectAll(".metric-cap-rect")
                    .data(nodeTypeLoadCaps, d => d.nodeTypeName);

                // Add nodeType capacity
                metricCapRect.enter()
                    .append("rect")
                    .attr("class", "metric-cap-rect")
                    .attr("is-capacity-violation", (d: NodeTypeMetricCapacity) => d.isCapacityViolation)
                    .attr("width", (d: NodeTypeMetricCapacity) => x0(d.lastNodeName) - x0(d.firstNodeName) + x0.rangeBand())
                    .attr("x", (d: NodeTypeMetricCapacity) => x0(d.firstNodeName))
                    .attr("y", y(0))
                    .attr("height", Math.max(0, height - y(0)))
                    .transition().duration(transitionDuration)
                    .attr("y", (d: NodeTypeMetricCapacity) => y(d.capacity))
                    .attr("height", (d: NodeTypeMetricCapacity) => Math.max(0, height - y(d.capacity)))
                    .each(function (d: NodeTypeMetricCapacity) {
                        // Use bootstrap tooltip library instead of angular-bootstrap tooltip because the former supports
                        // specifying container and viewport so the tooltip won't show up outside of the scrollable parent.
                        $(this).tooltip({
                            placement: "top",
                            html: true,
                            animation: false,
                            container: ".metrics-chart-body-container",
                            viewport: ".metrics-chart-body-container",
                            title: () => {
                                return `${d.isCapacityViolation ? "<b>Capacity Violation</b><br />" : ""}`
                                    + `Capacity (${d.nodeTypeName}): ${d.capacity}`;
                            }
                        });
                    });

                // Update nodeType capacity
                metricCapRect
                    .transition().duration(transitionDuration)
                    .attr("is-capacity-violation", (d: NodeTypeMetricCapacity) => d.isCapacityViolation)
                    .attr("width", (d: NodeTypeMetricCapacity) => x0(d.lastNodeName) - x0(d.firstNodeName) + x0.rangeBand())
                    .attr("x", (d: NodeTypeMetricCapacity) => x0(d.firstNodeName))
                    .attr("y", (d: NodeTypeMetricCapacity) => y(d.capacity))
                    .attr("height", (d: NodeTypeMetricCapacity) => Math.max(0, height - y(d.capacity)));

                // Remove nodeType capacity
                metricCapRect
                    .exit()
                    .transition().duration(transitionDuration)
                    .attr("y", y(0))
                    .attr("height", Math.max(0, height - y(0)))
                    .style("fill-opacity", 1e-6)
                    .remove();

                //-------------------------------------------------------------------
                // Draw node range
                //-------------------------------------------------------------------
                let node = svgNodeGroup.selectAll(".node")
                    .data(nodeMetrics, d => d.name);

                // Add node
                node.enter()
                    .append("g")
                    .attr("class", "node")
                    .attr("transform", d => "translate(" + x0(d.name) + ",0)");

                // Update node
                node
                    .attr("transform", d => "translate(" + x0(d.name) + ",0)");

                // Remove node
                node.exit()
                    .transition().duration(transitionDuration)
                    .style("fill-opacity", 1e-6)
                    .remove();

                //-------------------------------------------------------------------
                // Draw metrics inside every node range
                //-------------------------------------------------------------------
                let metric = node.selectAll(".metric-rect")
                    .data((d: NodeLoadInformation) => _.filter(d.nodeLoadMetricInformation, l => _.includes(selectedMetricNames, l.name)), (d: NodeLoadMetricInformation) => d.raw.Name);

                // Add node/metric
                metric.enter().append("rect")
                    .attr("class", "metric-rect")
                    .attr("is-capacity-violation", (d: NodeLoadMetricInformation) => d.raw.IsCapacityViolation)
                    .attr("width", x1.rangeBand())
                    .attr("x", (d: NodeLoadMetricInformation) => x1(d.raw.Name))
                    .attr("y", y(0))
                    .attr("height", Math.max(0, height - y(0)))
                    .transition().duration(transitionDuration)
                    .attr("y", (d: NodeLoadMetricInformation) => y(normalize ? d.loadCapacityRatio : +d.raw.NodeLoad))
                    .attr("height", (d: NodeLoadMetricInformation) => Math.max(0, height - y(normalize ? d.loadCapacityRatio : +d.raw.NodeLoad)))
                    .style("fill", (d: NodeLoadMetricInformation) => d.raw.IsCapacityViolation ? null : getColor(d.raw.Name))
                    .each(function (d: NodeLoadMetricInformation) {
                        // Use bootstrap tooltip library instead of angular-bootstrap tooltip because the former supports
                        // specifying container and viewport so the tooltip won't show up outside of the scrollable parent.
                        $(this).tooltip({
                            placement: "top",
                            html: true,
                            animation: false,
                            container: ".metrics-chart-body-container",
                            viewport: ".metrics-chart-body-container",
                            title: () => {
                                return `${d.raw.IsCapacityViolation ? "<b>Capacity Violation</b><br />" : ""}`
                                    + `${d.parent.name}: ${d.raw.NodeLoad}${d.hasCapacity ? ` / ${d.raw.NodeCapacity} (${d.loadCapacityRatioString})` : ""}`;
                            }
                        });
                    });

                // Update node/metric
                metric
                    .transition().duration(transitionDuration)
                    .attr("is-capacity-violation", (d: NodeLoadMetricInformation) => d.raw.IsCapacityViolation)
                    .attr("width", x1.rangeBand())
                    .attr("x", (d: NodeLoadMetricInformation) => x1(d.raw.Name))
                    .attr("y", (d: NodeLoadMetricInformation) => y(normalize ? d.loadCapacityRatio : +d.raw.NodeLoad))
                    .attr("height", (d: NodeLoadMetricInformation) => Math.max(0, height - y(normalize ? d.loadCapacityRatio : +d.raw.NodeLoad)))
                    .style("fill", (d: NodeLoadMetricInformation) => d.raw.IsCapacityViolation ? null : getColor(d.raw.Name));

                // Remove node/metric
                metric.exit()
                    .transition().duration(transitionDuration)
                    .attr("y", y(0))
                    .attr("height", Math.max(0, height - y(0)))
                    .style("fill-opacity", 1e-6)
                    .remove();

                //-------------------------------------------------------------------
                // Draw even distribution lines for every selected metrics
                //-------------------------------------------------------------------
                let selectedMetricsData: LoadMetricInformation[] = [];
                if (normalize && nodeMetrics.length > 0) {
                    selectedMetricsData = _.filter(selectedMetrics, m => m.loadCapacityRatio > 0);
                }

                let meanLine = svg.selectAll(".mean-line")
                    .data(selectedMetricsData, d => d.name);
                let meanLabel = svgRight.selectAll(".mean-label")
                    .data(selectedMetricsData, d => d.name);

                // Update line and label
                meanLine
                    .transition().duration(transitionDuration)
                    .attr("y1", (d: LoadMetricInformation) => y(d.loadCapacityRatio))
                    .attr("y2", (d: LoadMetricInformation) => y(d.loadCapacityRatio));
                meanLabel
                    .transition().duration(transitionDuration)
                    .attr("y", (d: LoadMetricInformation) => y(d.loadCapacityRatio))
                    .text((d: LoadMetricInformation) => `${d.loadCapacityRatioString}`);

                // Add line and label
                meanLine.enter()
                    .append("svg:line")
                    .attr("class", "mean-line")
                    .attr("opacity", 1e-6)
                    .transition().duration(transitionDuration)
                    .attr("opacity", 1)
                    .attr("x1", x0.rangeExtent()[0])
                    .attr("x2", x0.rangeExtent()[1])
                    .attr("y1", (d: LoadMetricInformation) => y(d.loadCapacityRatio))
                    .attr("y2", (d: LoadMetricInformation) => y(d.loadCapacityRatio))
                    .style("stroke-width", 2)
                    .style("fill", "none");
                meanLabel.enter()
                    .append("text")
                    .attr("class", "mean-label")
                    .attr("opacity", 1e-6)
                    .transition().duration(transitionDuration)
                    .attr("opacity", 1)
                    .attr("x", 10)
                    .attr("y", (d: LoadMetricInformation) => y(d.loadCapacityRatio))
                    .attr("dy", ".35em")
                    .text((d: LoadMetricInformation) => `${d.loadCapacityRatioString}`);

                // Remove line and label
                meanLine.exit()
                    .transition().duration(transitionDuration)
                    .style("opacity", 1e-6)
                    .remove();
                meanLabel.exit()
                    .transition().duration(transitionDuration)
                    .style("opacity", 1e-6)
                    .remove();

                //-------------------------------------------------------------------
                // Draw select metric message
                //-------------------------------------------------------------------
                if (selectedMetrics.length === 0) {
                    message
                        .transition().duration(transitionDuration)
                        .style("opacity", 1)
                        .text("Select a metric to show chart.");
                } else if (nodeMetrics.length === 0) {
                    message
                        .transition().duration(transitionDuration)
                        .style("opacity", 1)
                        .text("No data is available for the selected metric.");
                } else {
                    message
                        .transition().duration(transitionDuration)
                        .style("opacity", 1e-6);
                }
            });
        }
    }

    export class NodeTypeMetricCapacity {
        public nodeLoadMetrics: NodeLoadMetricInformation[] = [];

        public get firstNodeName(): string {
            return _.first(this.nodeLoadMetrics).parent.name;
        }

        public get lastNodeName(): string {
            return _.last(this.nodeLoadMetrics).parent.name;
        }

        public get isCapacityViolation(): boolean {
            return _.some(this.nodeLoadMetrics, m => m.raw.IsCapacityViolation);
        }

        public constructor(
            public nodeTypeName: string,
            public metricName: string,
            public capacity: number) {
        }
    }
}
