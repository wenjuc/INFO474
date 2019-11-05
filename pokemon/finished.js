'use strict';

let svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 800)
      .attr('height', 600);

(function() {

  let data = "no data";

  const colors = {
    "Bug": "#4E79A7",
    "Dark": "#A0CBE8",
    "Dragon": "#FDAE61" ,
    "Electric": "#F28E2B",
    "Fairy": "#8073AC",
    "Fighting": "#59A14F",
    "Fire": "#8CD17D",
    "Flying": "#3288BD",
    "Ghost": "#B6992D",
    "Grass": "#499894",
    "Ground": "#8B8970",
    "Ice": "#86BCB6",
    "Normal": "#E15759",
    "Poison": "#FF9D9A",
    "Psychic": "#79706E",
    "Rock": "#BF812D",
    "Steel": "#BAB0AC",
    "Water": "#D37295"
  };

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 800)
      .attr('height', 600);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("pokemon.csv")
      .then((data) => makeScatterPlot(data));
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    data = csvData // assign data as global variable

    // get arrays of fertility rate data and life Expectancy data
    let defense_data = data.map((row) => parseFloat(row["sp_defense"]));
    let total_data = data.map((row) => parseFloat(row["Total"]));

    // find data limits
    let axesLimits = findMinMax(defense_data, total_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "sp_defense", "Total");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();

    drawLegend(data); 
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 210)
      .attr('y', 60)
      .style('font-size', '16pt')
      .attr("fill", "#575757")
      .text("Pokemon: Special Defense vs. Total Stats");

    svgContainer.append('text')
      .attr('x', 360)
      .attr('y', 540)
      .attr("fill", "#575757")
      .style('font-size', '12pt')
      .text('Special Defense');

    svgContainer.append('text')
      .attr('transform', 'translate(60, 350)rotate(-90)')
      .attr("fill", "#575757")
      .style('font-size', '12pt')
      .text('Total Stats');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

    let len = d3.map(data, function(d) {
          return d['Legendary'];
        }).keys().sort()

    len.unshift("All")

    // for dropdown at the top left corner (legendary)
    var dropDownLegendary = d3.select("#filter-legendary").append("select")
                      .attr("name", "time-list").attr('id', "len");

    var optionsLegendary = dropDownLegendary.selectAll("option")
        .data(len)
        .enter()
        .append("option")
        .text(function(d) {return d;})
        .attr('value', function(d) {return d;});

    dropDownLegendary.on("change", function() {
      let newData = filterData(data)
      removeDots()
      updateViz(newData, map, colors, div)
    });

    // for dropdown at the top left corner (generation)
    var dropDownGeneration = d3.select("#filter-generation").append("select")
                                .attr("name", "time-list").attr('id', "gen");

    let gen = d3.map(data, function(d) {
          return d['Generation'];
        }).keys().sort()

    gen.unshift("All")

    var optionsGeneration = dropDownGeneration.selectAll("option")
        .data(gen)
        .enter()
        .append("option")
        .text(function(d) {return d;})
        .attr('value', function(d) {return d;});

     dropDownGeneration.on("change", function() {
      let newData = filterData(data)
      removeDots()
      updateViz(newData, map, colors, div)
    });
    updateViz(data, map, colors, div)
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 5, limits.xMax + 5]) // give domain buffer room
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

  function drawLegend(data) {
    let legendRectSize = 5;
    let legendSpacing = 5;
    var legend = d3.select('svg')
      .append("g")
      .selectAll("g")
      .data(d3.keys(colors))
      .enter()
      .append('g')
        .attr('class', 'legend')
        .attr('transform', function(d, i) {
          var height = legendRectSize;
          var x = 0;
          var y = i * height;
          return 'translate(' + x + ',' + y + ')';
      });

    legend.append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .style('fill', color)
      .style('stroke', color);

    legend.append('text')
      .attr('x', legendRectSize + legendSpacing)
      .attr('y', legendRectSize - legendSpacing)
      .text(function(d) { return d; });
  }

  function filterData(dataset) {
    return dataset.filter((row) => {
        let select1 = document.getElementById("gen")
        let select2 = document.getElementById("len")

        let boolGen = row["Generation"] == select1.value || select1.value == "All"
        let boolLen = row["Legendary"] == select2.value || select2.value == "All"
        return boolGen && boolLen
    })
  }

  function updateViz(data, map, colors, div) {
    let xMap = map.x
    let yMap = map.y
    var dots = svgContainer.selectAll('.dot')
      .data(data).attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 6)

    dots.exit().remove();

    // append data to SVG and plot as points
    dots
      .enter()
      .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 6)
      .style("stroke", "#4682B4")
      .style("fill-opacity", 0.7)
      .style("fill", function(d) { 
        return colors[d["Type 1"]];
      })
      .style("stroke-width", 0)
      // add tooltip functionality to points
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", 1);
        if (d['Type 2'] == "") {
          div.html("Name: " + d['Name'] + "<br/>" + 
                  "Type 1: " + d['Type 1'])
            .style("left", (d3.event.pageX + 20) + "px")
            .style("top", (d3.event.pageY - 25) + "px")
        } else {
          div.html("Name: " + d['Name'] + "<br/>" + 
                  "Type 1: " + d['Type 1'] + "<br/>" + 
                  "Type 2: " + d['Type 2'])
            .style("left", (d3.event.pageX + 20) + "px")
            .style("top", (d3.event.pageY - 25) + "px")
        }
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(800)
          .style("opacity", 0);
      });
  }

  function removeDots() {
    svgContainer.selectAll("circle").remove();
  }
})();
