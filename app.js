var svgWidth = 960;
var svgHeight = 600;

var margin = {
  top: 20,
  right: 40,
  bottom: 120,
  left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3
  .select(".chart")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "total_revenue";

// function used for updating x-scale var upon click on axis label
function xScale(movieData, chosenXAxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(movieData, d => d[chosenXAxis]) * 0.8,
      d3.max(movieData, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width]);

  return xLinearScale;

}

// function used for updating xAxis var upon click on axis label
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, chosenXAxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));

  return circlesGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, circlesGroup) {

  if (chosenXAxis === "cinema_sites") {
    var label = "Cinema Sites:";
  }
  else if (chosenXAxis === "tcket_sales") {
    var label = "Ticket Sales:";
  }
  else if (chosenXAxis === "ticket_price") {
    var label = "Ticket Price:";
  }
  else if (chosenXAxis === "total_revenue") {
    var label = "Total Revenue:"
  }

  var toolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([80, -60])
    .html(function(d) {
      return (`${d.year}${label}<br>${d[chosenXAxis]}`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(data) {
    toolTip.show(data);
  })
    // onmouseout event
    .on("mouseout", function(data) {
      toolTip.hide(data);
    });

  return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("domestic_movie_data.csv", function(err, movieData) {
  if (err) throw err;

//var parseTime = d3.timeParse("%Y");

  // parse data
  movieData.forEach(function(data) {
    data.year = +data.year;
    //data.year = parseTime(data.year);
    data.tickets_sold = +data.tickets_sold;
    data.total_revenue = +data.total_revenue;
    data.ticket_price = +data.ticket_price;
    data.cinema_sites = +data.cinema_sites;
  });

  // xLinearScale function above csv import
  var xLinearScale = xScale(movieData, chosenXAxis);

  // Create y scale function
  var yLinearScale = d3.scaleLinear()
    .domain([2000, d3.max(movieData, d => d.year)])
    .range([height, 0]);

  // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append x axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // append y axis
  chartGroup.append("g")
    .call(leftAxis)
    ;

  // append initial circles
  var circlesGroup = chartGroup.selectAll("circle")
    .data(movieData)
    .enter()
    .append("circle")
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d.year))
    .attr("r", 20)
    .attr("fill", "blue")
    .attr("opacity", ".5");

  // Create group for  4 x- axis labels
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var totalRevenueLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "total_revenue") // value to grab for event listener
    .classed("active", true)
    .text("Total Annual Movie Industry Revenue (Billions $)");

  var ticketsLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "tickets_sold") // value to grab for event listener
    .classed("inactive", true)
    .text("# of Tickets Sold (Millions)");

  
  var cinemaSitesLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 60)
    .attr("value", "cinema_sites") // value to grab for event listener
    .classed("inactive", true)
    .text("# of Cinemas in U.S.");

  var ticketsPriceLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 80)
    .attr("value", "ticket_price") // value to grab for event listener
    .classed("inactive", true)
    .text("Average Ticket Price ($ U.S.)");

  // append y axis
  chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("axis-text", true)
    .text("Years 2001-2017");

  // updateToolTip function above csv import
  var circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

  // x axis labels event listener
  labelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value;

        // console.log(chosenXAxis)

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(movieData, chosenXAxis);

        // updates x axis with transition
        xAxis = renderAxes(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

        // changes classes to change bold text
        if (chosenXAxis === "ticket_price") {
          totalRevenueLabel
            .classed("active", false)
            .classed("inactive", true);
          ticketsLabel
            .classed("active", false)
            .classed("inactive", true);
          ticketsPriceLabel
            .classed("active", true)
            .classed("inactive", false);
          cinemaSitesLabel
            .classed("active", false)
            .classed("inactive", true);
        }
        else if (chosenXAxis === "tickets_sold") {
          totalRevenueLabel
            .classed("active", false)
            .classed("inactive", true);
          ticketsLabel
            .classed("active", true)
            .classed("inactive", false);
          ticketsPriceLabel
            .classed("active", false)
            .classed("inactive", true);
          cinemaSitesLabel
            .classed("active", false)
            .classed("inactive", true);
        }
        else if (chosenXAxis === "cinema_sites") {
          totalRevenueLabel
            .classed("active", false)
            .classed("inactive", true);
          ticketsLabel
            .classed("active", false)
            .classed("inactive", true);
          ticketsPriceLabel
            .classed("active", false)
            .classed("inactive", true);
          cinemaSitesLabel
            .classed("active", true)
            .classed("inactive", false);
        }
        else if (chosenXAxis === "total_revenue") {
          totalRevenueLabel
            .classed("active", true)
            .classed("inactive", false);
          ticketsLabel
            .classed("active", false)
            .classed("inactive", true);
          ticketsPriceLabel
            .classed("active", false)
            .classed("inactive", true);
          cinemaSitesLabel
            .classed("active", false)
            .classed("inactive", true);
        }
        }
      }
    );
    });
