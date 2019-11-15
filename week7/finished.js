'use strict';

let width = 800;
let height = 600;

let svgContainer = d3.select('body')
      .append('svg')
      .attr('width', width)
      .attr('height', height);
let g = svgContainer.append('g');

// for map and points
let albersProjection = d3.geoAlbers()
      .scale(190000)
      .rotate([71.057, 0])
      .center([0, 42.313])
      .translate([width / 2, height / 2]);
let geoPath = d3.geoPath()
                .projection(albersProjection);

(function() {
  // load data and make scatter plot after window loads
  window.onload = function() {
    d3.json("neighborhoods.json")
      .then((neighborhoodsData) => buildMap(neighborhoodsData))
  }

  // build the map
  function buildMap(neighborhoodsData) {
    g.selectAll('.path')
      .data(neighborhoodsData.features)
      .enter()
      .append('path')
      .attr('fill', '#ccc')
      .attr('d', geoPath)
      .style('z-index', -1);

    d3.json("points.json").then((pointData) => plotPoints(pointData));
  }

  // plot the points
  function plotPoints(pointData) {
    g.selectAll('circle')
      .data(pointData.features)
      .enter()
      .append('path')
        .attr('class', 'coord')
        .attr('fill', 'red')
        .attr('d', geoPath)
        .style('z-index', 1);

    const links = [];
    for (let i = 0; i < pointData.features.length - 1; i++) {
      const start = albersProjection(pointData.features[i].geometry.coordinates);
      const end = albersProjection(pointData.features[i + 1].geometry.coordinates);

      links.push({
        type : "LineString",
        coordinates: [
          [start[0], start[1]],
          [end[0], end[1]]
        ]
      });
    }

    const lines = svgContainer.append('g');
    lines.selectAll('line')
      .data(links)
      .enter()
      .append('line')
        .attr("x1", d=>d.coordinates[0][0])
        .attr("y1", d=>d.coordinates[0][1])
        .attr("x2", d=>d.coordinates[1][0])
        .attr("y2", d=>d.coordinates[1][1])
        .attr("id", function(d, i) { return "line" + i})
        .attr("stroke", "steelblue");

    lines.selectAll('line').style('opacity', 0);

    d3.selectAll("line").style("opacity", "1");
    d3.selectAll("line").each(function(d, i) {
      let totalLength = d3.select("#line" + i).node().getTotalLength();
      d3.select("#line" + i).attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(500)
        .delay(220 * i)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .style("stroke-width", 3);
    });
  }

})();

