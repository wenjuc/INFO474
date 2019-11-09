'use strict';

(function() {

  const margin = {top: 40, right: 40, bottom: 70, left: 70},
                  width = 300 - margin.left - margin.right,
                  height = 300 - margin.top - margin.bottom;

  let data = "no data";
  let svgContainer = ""; // keep SVG reference in global scope

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 1500)
      .attr('height', 1000);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("gapminder.csv")
      .then((data) => makeScatterPlot(data));
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    // get data only from 1980
    data = csvData.filter(function(d) {return d['year'] == 1980;})

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions, csvData);

    // draw title and axes labels
    makeLabels();
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 340)
      .attr('y', 55)
      .style('font-size', '18pt')
      .attr("fill", "#575757")
      .text("Fertility vs. Life Expectancy (1980)");

    svgContainer.append('text')
      .attr('x', 530)
      .attr('y', 650)
      .attr("fill", "#575757")
      .style('font-size', '14pt')
      .text('Fertility');

    svgContainer.append('text')
      .attr('transform', 'translate(55, 400)rotate(-90)')
      .attr("fill", "#575757")
      .style('font-size', '14pt')
      .text('Life Expectancy');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map, csvData) {
    // get population data as array
    let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 22]);

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
        .attr("class", "circles")
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["population"]))
        .style("stroke", "#4682B4")
        .style("fill", "white")
        .style("fill-opacity", 0)
        .style("stroke-width", 2)

        // add tooltip functionality to points
        .on("mouseover", (d) => {
          div.selectAll("*").remove()
          div.transition()
            .duration(200)
            .style("opacity", 1);

          drawTooltips(div, csvData, d['country'])
          div.style("left", (d3.event.pageX + 30) + "px")
            .style("top", (d3.event.pageY - 80) + "px")
        })

        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([100, 1000]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 600)')
      .style("color", "#858585")
      .style("font-size", 15)
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([100, 600]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(100, 0)')
      .style("color", "#858585")
      .style("font-size", 14)
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

  function drawTooltips(div, csvData, country) {
    const svg = div.append("svg")
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('position', "absolute")

    svg.append('text')
      .attr('x', 90)
      .attr('y', 25)
      .style('font-size', '10pt')
      .attr("fill", "#575757")
      .text("Population in " + country);

    svg.append('text')
      .attr('x', 150)
      .attr('y', 280)
      .attr("fill", "#575757")
      .style('font-size', '8pt')
      .text('Year');

    svg.append('text')
      .attr('transform', 'translate(26, 175)rotate(-90)')
      .attr("fill", "#575757")
      .style('font-size', '8pt')
      .text('Population (M)');

    // get only data for USA
    let data = csvData.filter(function(d) {
      return d['country'] == country;
    });

    // get year min and max for us
    const yearLimits = d3.extent(data, d => d['year'])
    // get scaling function for years (x axis)
    const xScale = d3.scaleLinear()
        .domain([yearLimits[0], yearLimits[1]])
        .range([margin.left, width + margin.left])

    // make x axis
    const xAxis = svg.append("g")
        .attr("transform", "translate(0," + (height + margin.top) + ")")
        .attr("class", "axisGrey")
        .call(d3.axisBottom(xScale))
        .selectAll("text")
          .attr("transform", "rotate(-65)")
          .style("text-anchor", "end")
          .attr("dy", ".1em")
          .attr("dx", "-.8em")

    // get min and max life expectancy for US
    const populationLimits = d3.extent(data, d => parseInt(d['population']) / 1000000)

    // get scaling function for y axis
    const yScale = d3.scaleLinear()
      .domain([populationLimits[1], populationLimits[0]])
      .range([margin.top, margin.top + height])

    // make y axis
    const yAxis = svg.append("g")
      .attr("transform", "translate(" + margin.left + ",0)")
      .attr("class", "axisGrey")
      .call(d3.axisLeft(yScale))

    // d3's line generator
    const line = d3.line()
        .x(d => xScale(+d['year'])) // set the x values for the line generator
        .y(d => yScale(parseInt(d['population']) / 1000000)) // set the y values for the line generator 

    // append line to svg
    svg.append("path")
      .datum(data)
      .attr("d", line)
      .attr("fill", "steelblue")
      .attr("stroke", "steelblue")

    return svg;
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
