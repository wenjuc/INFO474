'use strict';

(function() {

  let data = "no data";
  let svgContainer = ""; // keep SVG reference in global scope

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 800)
      .attr('height', 600);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("dataEveryYear.csv")
      .then((data) => makeScatterPlot(data));
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    data = csvData // assign data as global variable

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 300)
      .attr('y', 60)
      .style('font-size', '16pt')
      .attr("fill", "#575757")
      .text("Life Expectancy vs Fertility");

    svgContainer.append('text')
      .attr('x', 360)
      .attr('y', 540)
      .attr("fill", "#575757")
      .style('font-size', '12pt')
      .text('Fertility');

    svgContainer.append('text')
      .attr('transform', 'translate(60, 350)rotate(-90)')
      .attr("fill", "#575757")
      .style('font-size', '12pt')
      .text('Life Expectancy');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // get population data as array
    let pop_data = data.map((row) => +row["pop_mlns"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

    // append data to SVG and plot as points
    var dots = svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["pop_mlns"]))
        .style("stroke", "#4682B4")
        .style("fill", "white")
        .style("fill-opacity", 0)
        .style("stroke-width", 1.5)

        // add tooltip functionality to points
        .on("mouseover", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", 1);
          div.html("Year of year: " + d.time + "<br/>" + 
                  "Country: " + d.location + "<br/>" + 
                  "Life Expectancy: " + d.life_expectancy + "<br/>" + 
                  "Fertility: " + d.fertility_rate + "<br/>" +
                  "Population: " + numberWithCommas(d["pop_mlns"] * 1000000))
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 30) + "px")
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });

    // for dropdown at the top left corner
    var dropDown = d3.select("#filter").append("select")
                      .attr("name", "time-list");

    var options = dropDown.selectAll("option")
        .data(d3.map(data, function(d) {return d['time'];}).keys())
        .enter()
        .append("option")

        .text(function(d) {return d;})
        .attr('value', function(d) {return d;});

    dropDown.on("change", function() {
      var selected = this.value;
      var displayOthers = this.checked ? "inline" : "none";
      var display = this.checked ? "none" : "inline";

    dots.filter(function(d) {return selected != d['time'];})
        .attr("display", displayOthers);

    dots.filter(function(d) {return selected == d['time'];})
        .attr("display", display);
      });
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([100, 700]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 500)')
      .style("color", "#858585")
      .style("font-size", 13)
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([100, 500]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(100, 0)')
      .style("color", "#858585")
      .style("font-size", 13)
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
