import { Component, OnInit, ViewChild, ElementRef, Input, AfterViewInit } from '@angular/core';
import { scaleOrdinal } from 'd3-scale';
import { IDashboardViewModel } from 'src/app/ViewModels/DashboardViewModels';
import { pie, arc } from 'd3-shape';
import { select } from 'd3-selection';
import { entries } from 'd3-collection';
@Component({
  selector: 'app-dashboard-tile',
  templateUrl: './dashboard-tile.component.html',
  styleUrls: ['./dashboard-tile.component.scss']
})
export class DashboardTileComponent implements OnInit, AfterViewInit {

  @Input() data: IDashboardViewModel;

  @ViewChild('chart') private chartContainer: ElementRef;


  constructor() { }

  ngOnInit() {}
  
  ngAfterViewInit(){

    let margin = 3;
    let width = (this.data.largeTile ? 200 : 120) + margin * 2;
    let height = width;
    let arcWidth = (this.data.largeTile ? 10 : 8);
    let outerRadius = width / 2 - margin;
    let innerRadius = width / 2 - arcWidth - margin;

    const svg = select(this.chartContainer.nativeElement)
      .append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Create dummy data
    const data = this.data.dataPoints.map(p => p.count);
        // const data = this.data.dataPoints.reduce((data, p, i) => { data[i] = p.count; return data} , {});

    // set the color scale
    const color = scaleOrdinal()
      .domain(["0","1","2"])
      .range(["red", "yellow", "green"])

    // Compute the position of each group on the pie:
    const p = pie()
    .startAngle(-.2 * Math.PI)
      .endAngle(1.2 * Math.PI)
      .value(d => d['value'] )
      // @ts-ignore
      const data_ready = p(entries(data))

    svg
      .selectAll('whatever')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arc()
        .innerRadius(innerRadius)         // This is the size of the donut hole
        .outerRadius(outerRadius)
      )
      .attr('fill', (d, i) => (color(i.toString()).toString() ))
      .attr("stroke", "transparent")
      .style("stroke-width", "2px")
      .style("opacity", 0.7)


      let textOffset = this.data.largeTile ? 40 : 32;
      let textGroup = svg.append("g")
          .attr("transform", "translate(-" + width / 2 + ", -6)");
      let number = textGroup.append("text")
          .attr("class", "dashboard-number").style("fill", "white");
      let title = textGroup.append("text")
          .attr("transform", "translate(8, " + textOffset + ")")
          .attr("class", "dashboard-title").style("fill", "white");

      // Need to match $dashboard-number-font-size, $dashboard-small-number-font-size in _dashboard.scss
      let fontSize = this.data.largeTile ? 72 : 50;
      let fontSizeFactor = this.data.largeTile ? 160 : 112;

      // Change title and number
      title.text(this.data.displayTitle.toUpperCase());
      number.text(this.data.count)
          .style("font-size", (d) => {
              // Resize the number based on the string length
              return Math.min(fontSize, Math.floor(fontSizeFactor / this.data.count.toString().length) * 1.9) + "px";
          });
      if (this.data.count.toString().length > 6) {
          number.attr("transform", "translate(6, 10)");
      } else {
          number.attr("transform", "translate(6, 18)");
      }

  }

}
