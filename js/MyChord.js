// put our chord handling code here!
function startingStreet(d) {
  return d.streetnames[0];
}
function endingStreet(d) {
  return d.streetnames[d.streetnames.length-1];
}
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index; 
}
// Given a set of taxi data, figure out what streets are the starting and ending points.
// returns a 1D array of street names.
function relevantStreets(data) {
  var resultArray = new Array();
  for(var i = 0; i < data.length; ++i) {
    var d = data[i];
    resultArray.push(startingStreet(d));
    resultArray.push(endingStreet(d));
  }
  var result = resultArray.filter(onlyUnique);
  return result;
}


// makes a square matrix of the given size with all values set to initial_value.
function makeSquareMatrix(size, initial_value) {
  var matrix = new Array();
  for(var i = 0; i < size; ++i) {
    matrix[i] = new Array();
    for(var j = 0; j < size; ++j) {
      matrix[i][j] = initial_value; 
    }
  }
  return matrix;
}

// This does the dirty work of generating the matrix!
// All streets mentioned in data for starting and ending points must be passed through
// in the streets parameter. Streets must be unique, no duplicates!
function formMatrix(data, streets) {
  var resultMatrix = makeSquareMatrix(streets.length, 0);
  for (var i = 0; i < data.length; ++i) {
    var d = data[i];
    resultMatrix[streets.indexOf(startingStreet(d))][streets.indexOf(endingStreet(d))]++;
  }
  return resultMatrix;
}
function streetnameLookup(streets, index) {
	return streets[index];
}

function destinationStreets(matrix, streets, index) {
	console.log(index);
	var row = matrix[index];
	
	var resultArray = new Array();
	for(var i = 0; i < row.length; ++i) {
		if(row[i] != 0) {
			resultArray.push(streetnameLookup(streets, i));
		}
	}
	return resultArray;
}

function reverseMatrixLookup(matrix, streets, index, value, data) {
	var starting_street = streetnameLookup(streets,index);
	var ending_streets = destinationStreets(matrix, streets, index);
	
	var resultArray = new Array();
	
	for(var i = 0; i < data.length; ++i) {
		var d = data[i];
		if (startingStreet(d) == starting_street && ending_streets.find(function(x) { return x == endingStreet(d)}) != undefined) {
			resultArray.push(d);
		}
	}
	return resultArray;
}

// d3 code for chord
var chordData;
var streetMatrix;

function chordVis(data) {
	chordData = data;
	var streets = relevantStreets(data);
	var street_matrix = formMatrix(data, streets);
	streetMatrix = street_matrix;
	
/*var matrix = [
  [11975,  5871, 8916, 2868],
  [ 1951, 10048, 2060, 6171],
  [ 8010, 16145, 8090, 8045],
  [ 1013,   990,  940, 6907]
];*/

var matrix = streetMatrix;

d3.select("body").select("div#rightside").select("div#chordchart").selectAll("*").remove(); //fixing duplicate problem
var svg = d3.select("body").select("div#rightside").select("div#chordchart").append("svg")
	.attr("width", 400).attr("height", 400),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    outerRadius = Math.min(width, height) * 0.5 - 40,
    innerRadius = outerRadius - 30;

var formatValue = d3.formatPrefix(",.0", 1e3);

var chord = d3.chord()
    .padAngle(0.03)
    .sortSubgroups(d3.descending);

var arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

var ribbon = d3.ribbon()
    .radius(innerRadius);

var color = d3.scaleOrdinal()
    .domain(d3.range(4))
    .range(["#000000", "#FFDD89", "#957244", "#F26223"]);
var logit = function (d) {
	console.log(d);
	return d;
};
var g = svg.append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
    .datum(chord(matrix));

var group = g.append("g")
    .attr("class", "groups")
  .selectAll("g")
  .data(function(chords) { return chords.groups; })
  .enter().append("g");

group.append("path")
    .style("fill", function(d) { console.log(d); return color(d.index); })
    .style("stroke", function(d) { return d3.rgb(color(d.index)).darker(); })
    .attr("d", arc)
	.append("title").text(function (d) {
			return "street: " + streetnameLookup(streets, d.index) + "\r\n it works?: " + d.value;
		});

var groupTick = group.selectAll(".group-tick")
  .data(function(d) { return groupTicks(d, 1e3); })
  .enter().append("g")
    .attr("class", "group-tick")
    .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + outerRadius + ",0)"; });

groupTick.append("line")
    .attr("x2", 6);

groupTick
  .filter(function(d) { return d.value % 5e3 === 0; })
  .append("text")
    .attr("x", 8)
    .attr("dy", ".35em")
    .attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180) translate(-16)" : null; })
    .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
    .text(function(d) { return formatValue(d.value); });
	
g.append("g")
    .attr("class", "ribbons")
  .selectAll("path")
  .data(function(chords) { return chords; })
  .enter().append("path")
    .attr("d", ribbon)
    .style("fill", function(d) { return color(d.target.index); })
    .style("stroke", function(d) { return d3.rgb(color(d.target.index)).darker(); })
	  	.on("click", function(d) {
		console.log(matrix);
		console.log(d);
		var result = reverseMatrixLookup(matrix, streets, d.source.index, d.source.value, data);
		console.log(result);
		clearMap();
		DrawRS(result);
	});

// Returns an array of tick angles and values for a given group and step.
function groupTicks(d, step) {
  var k = (d.endAngle - d.startAngle) / d.value;
  return d3.range(0, d.value, step).map(function(value) {
    return {value: value, angle: value * k + d.startAngle};
  });
}
}