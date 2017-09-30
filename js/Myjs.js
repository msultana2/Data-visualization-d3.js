// hey look a change!
//Init Map
//*******************************************************************************************************************************************************
var lat = 41.141376;
var lng = -8.613999;
var zoom = 14;
// add an OpenStreetMap tile layer
var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
'Imagery © <a href="http://mapbox.com">Mapbox</a>',
mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiemdYSVVLRSJ9.g3lbg_eN0kztmsfIPxa9MQ';
var grayscale = L.tileLayer(mbUrl, {
	id: 'mapbox.light',
	attribution: mbAttr
}),
streets = L.tileLayer(mbUrl, {
	id: 'mapbox.streets',
	attribution: mbAttr
});
var map = L.map('map', {
	center: [lat, lng], // Porto
	zoom: zoom,
	layers: [streets],
	zoomControl: true,
	fullscreenControl: true,
	fullscreenControlOptions: { // optional
		title: "Show me the fullscreen !",
		titleCancel: "Exit fullscreen mode",
		position: 'bottomright'
	}
});
var baseLayers = {
	"Grayscale": grayscale, // Grayscale tile layer
	"Streets": streets, // Streets tile layer
};
layerControl = L.control.layers(baseLayers, null, {
	position: 'bottomleft'
}).addTo(map);
// Initialise the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
var featureGroup = L.featureGroup();
var drawControl = new L.Control.Draw({
	position: 'bottomright',
	collapsed: false,
	draw: {
		// Available Shapes in Draw box. To disable anyone of them just convert true to false
		polyline: false,
		polygon: false,
		circle: false,
		rectangle: true,
		marker: false,
	},
	edit: {
		featureGroup: drawnItems,
		//remove: true,
		//edit: true
	}
});
map.addControl(drawControl); // To add anything to map, add it to "drawControl"
///
/// LIBRARY CODE FOR OUR VISUALIZATIONS
///

// Given a number, tell us what bin it belongs to
function binNumber(number, bin_size, min_bin, max_bin) {
	var integer = Math.round(number);
	var bin = Math.floor((integer - min_bin) / bin_size);
	if(bin > Math.floor(max_bin/bin_size)) {
		return max_bin;
	}
	return bin;
}

// Returns an array marking the start of the bin
// min_bin and max_bin represent the start and end of the valid range.
// spacing is the distance or size of the bins.
// example:
//	[0, 10, 20, 30, 40, 50, 60, 70, 80, 90] <- makeBinArray(0,100,10)
function makeBinArray(min_bin, max_bin, spacing) {
	var result = new Array();
	for(var i = min_bin; i < max_bin; i=i+spacing) { 
		result.push(i);
	}
	return result;
}

// returns {{x: xval, y: yval, bin:{object, ... }}, ... }
// Data is the data to filter over
// xd and yd are strings that point to member variable names (avspeed, etc)
// min_bin and max_bin represent the start and end of the valid range.
// spacing is the distance or size of the bins.
function binning (data, xd, yd, spacing, min_bin, max_bin) {
	var bins = makeBinArray(min_bin, max_bin, spacing);
	var resultArray = new Array();
	
	for (var i = 0; i < bins.length; ++i) {
		resultArray.push({
			x: bins[i],
			y: 0,
			bin: new Array()
		})
	}
	// put objects in bins for x axis
	for (var i = 0; i < data.length; ++i) {
		var bin = binNumber(data[i][xd], spacing, min_bin, max_bin);
		resultArray[bin]["bin"].push(data[i]);
	}	
	// determine y value.
	for (var i = 0; i < resultArray.length; ++i) {
		var sum = 0;
		for(var j = 0; j < resultArray[i]["bin"].length; ++j) {
			sum += resultArray[i]["bin"][j][yd];
		}
		resultArray[i]["y"] = resultArray[i]["bin"].length;
	}
	return resultArray;
}

function bubbleBin(data, xd, yd) {
	var resultArray = new Array;
	var tempDict = {};
	
	for(var i = 0; i < data[i]; ++i) {
		var taxiid = data[i].taxiid;
		if (!tempDict[taxiid]) {
			tempDict[taxiid] = new Array();
		}
		tempDict[taxiid].push(data[i]);
	}
	
	for(key in tempDict) {
		resultArray.push({taxiid: key, bin: tempDict[key]});	
	}
	return resultArray;
}
function between(number, min, max) {
	return number >= min && number <= max;
}
function rangeSelect(data, start, end, x_string) {
	var min = Math.min(start,end);
	var max = Math.max(start,end);
	var resultArray = new Array();
	for (var i = 0; i < data.length; ++i) {
		var d = data[i];
		if (between(d[x_string], min, max)) {
			resultArray.push(d);
		}
	}
	return resultArray;
}

function rangeSelect2D(data, x_start, x_end, x_string, y_start, y_end, y_string) {
	var x_min = Math.min(x_start,x_end);
	var x_max = Math.max(x_start,x_end);
	var y_min = Math.min(y_start,y_end);
	var y_max = Math.max(y_start,y_end);
	var resultArray = new Array();
	for (var i = 0; i < data.length; ++i) {
		var d = data[i];
		if (between(d[x_string], x_min, x_max) && between(d[y_string], y_min, y_max)) {
			resultArray.push(d);
		}
	}
	return resultArray;
}
///
//*******************************************************************************************************************************************************
//*****************************************************************************************************************************************
// Index Road Network by Using R-Tree
//*****************************************************************************************************************************************
var rt = cw(function (data, cb) {
	var self = this;
	var request, _resp;
	importScripts("js/rtree.js");
	if (!self.rt) {
		self.rt = RTree();
		request = new XMLHttpRequest();
		request.open("GET", data);
		request.onreadystatechange = function () {
			if (request.readyState === 4 && request.status === 200) {
				_resp = JSON.parse(request.responseText);
				self.rt.geoJSON(_resp);
				cb(true);
			}
		};
		request.send();
	} else {
		return self.rt.bbox(data);
	}
});
rt.data(cw.makeUrl("js/trips.json"));
//*****************************************************************************************************************************************
// Clear the Map.
//***************************************************************************************************************************************** 
function clearMap() {
	for (i in map._layers) {
		if (map._layers[i]._path != undefined) {
			try {
				map.removeLayer(map._layers[i]);
			} catch (e) {
				console.log("problem with " + e + map._layers[i]);
			}
		}
	}
}
//*****************************************************************************************************************************************
// Draw rectangle on Map Event for Query :
// Click the small box on Map and start drawing to do query.
//***************************************************************************************************************************************** 

var displayed_data;
function updateVisualizations(data) {
	displayed_data = data;
	testVis(data);
    barChart(data);
    scatterPlot(data);
    bubbleChart(data);
	//console.log('Length', data.length)
	if(data.length < 50) {
		chordVis(data);
	}
}
function reduceRoutes() {
	console.log('Called Function')
	updateVisualizations(displayed_data);
}
map.on('draw:created', function (e) {
	clearMap();
	var type = e.layerType,
	layer = e.layer;
	if (type === 'rectangle') {
		var bounds = layer.getBounds();
		rt.data([[bounds.getSouthWest().lng, bounds.getSouthWest().lat], [bounds.getNorthEast().lng, bounds.getNorthEast().lat]]).
        then(function (d) {
        	var result = d.map(function (a) { return a.properties; });
			
        	// update graphs when drawing a rectangle
			updateVisualizations(result);
        	DrawRS(result);
			//console.log(result);
        });
	}
	drawnItems.addLayer(layer); //Add your Selection to Map 
	//console.log("hi I made a change!");
});
//*****************************************************************************************************************************************
// DrawRS Function:
// Input is a list of Trip and the function draw these trips on Map based on their IDs
//*****************************************************************************************************************************************
function DrawRS(trips) {
	displayed_data = trips; // modification to allow reductions across visualizations.
	for (var j = 0; j < trips.length; j++) { // Check Number of Segments and go through all segments
		var TPT = new Array();
		TPT = TArr[trips[j].tripid].split(','); // Find each segment in TArr Dictionary. 
		var polyline = new L.Polyline([]).addTo(drawnItems);
		polyline.setStyle({
			color: 'red', // polyline color
			weight: 1, // polyline weight
			opacity: 0.5, // polyline opacity
			smoothFactor: 1.0
		});
		for (var y = 0; y < TPT.length - 1; y = y + 2) { // Parse latlng for each segment
			polyline.addLatLng([parseFloat(TPT[y + 1]), parseFloat(TPT[y])]);
		}
	}
}
// inspiration taken from https://bl.ocks.org/mbostock/raw/3883245/
// for some of the linegraph code.
var testVisData;
function cleanData(d) {
	var newArray = new Array();
	
	for (var i = 0; i < d.length; ++i) {
		if (d[i].duration != null && d[i].avspeed != null) {
			newArray.push(d[i]);
		}
	}
	return newArray;
}
function testVis(data) {
	//preparse data to reduce it to values without undefined values.
	if (data == null) { return null; }
	testVisData = cleanData(data);
	data = testVisData;
	data = data.sort(function (a, b) {
		return a.duration - b.duration;
	});
	d3.select("body").select("div#rightside").select("div#linechart").selectAll("*").remove();
	var lineDragX = 0;

	var svg = d3.select("body").select("div#rightside").select("div#linechart").append("svg").attr("width", 400).attr("height", 400);
	var margin = { top: 20, right: 20, bottom: 70, left: 50 },
	width = +svg.attr("width") - margin.left - margin.right,
	height = +svg.attr("height") - margin.top - margin.bottom;
	
	var x = d3.scaleLinear()
		.rangeRound([0, width]);
	var y = d3.scaleLinear()
		.rangeRound([height, 0]);
	svg.on("dragstart", function (d) {
		lineDragX = x.invert(d3.mouse(this)[0]-margin.left);
	}).on("dragend", function(d) {
		var endLineDragX = x.invert(d3.mouse(this)[0]-margin.top);
		clearMap();
		DrawRS(rangeSelect(testVisData, lineDragX, endLineDragX, "duration"));
	}),
	g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var line = d3.line()
		.x(function (d) { return x(d.duration); })
		.y(function (d) { return y(d.distance); });
		
	/*var line2 = d3.line()
		.x(function (d) { return x(d.duration); })
		.y(function (d) { return y(d.minspeed); });	*/
	// we handle data that is passed in the first argument of the function.
	// avgspeed, distance, duration, endtime, maxspeed, minspeed, starttime, streetnames{...}, taxiid, tripid.
	
	x.domain(d3.extent(data, function (d) { return d.duration/=100; }));
	y.domain(d3.extent(data, function (d) { return d.distance/=100; }));
	
	g.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));
	
	svg.append("text")
		.attr("class", "label")
		.attr("x", width - 100)
		.attr("y", height + 50)
		.style("text-anchor", "middle")
		.text("Duration(mins)")
		.attr("fill", "black")
		.style("font-size", "11px");
	
	g.append("g")
		.call(d3.axisLeft(y))
		.append("text")
		.attr("fill", "#000")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", "0.71em")
		.attr("text-anchor", "end")
		.text("Distance(miles)")
		.style("font-size", "11px");
		
	g.append("path")
		.datum(data)
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.attr("d", line);
		
	/*g.append("path")
		.datum(data)
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.attr("d", line2);*/
}
 
// sample bar chart

function barChart(data) {
	data = cleanData(data);
	var margin = { top: 20, right: 20, bottom: 70, left: 40 },
	width = 400 - margin.left - margin.right,
	height = 400 - margin.top - margin.bottom;

	var bins = binning(data, "avspeed", "distance", 5, 0, 130);
	testBins = bins;
	data = bins;
	var x = d3.scaleBand().rangeRound([0, width]).padding(0.2);
	var y = d3.scaleLinear().range([height, 0]);
	var xAxis = d3.axisBottom(x).ticks(10);
	var yAxis = d3.axisLeft(y).ticks(10);
	d3.select("body").select("div#rightside").select("div#barchart").selectAll("*").remove();
	var svg = d3.select("body").select("div#rightside").select("div#barchart").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform",
	"translate(" + margin.left + "," + margin.top + ")");
	//x.domain(d3.extent(data, function(d) { return d.avspeed; }));
	x.domain(data.map(function (d) { return d.x; }));
	y.domain(d3.extent(data, function (d) { return d.y; }));
	
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-.8em")
		.attr("dy", "-.55em")
		.attr("transform", "rotate(-90)");
	
	svg.append("text")
		.attr("class", "label")
		.attr("x", width/2)
		.attr("y", height + 35)
		.style("text-anchor", "middle")
		.text("Speed(mph)")
		.attr("fill", "black")
		.style("font-size", "11px");
		
	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("Distance(miles)")//"Value ($)")
		.attr("fill", "black")
		.style("font-size", "11px");
		
	svg.selectAll("bar")
		.data(data)
		.enter().append("rect")
		.style("fill", "steelblue")
		.attr("x", function (d) { return x(d.x); })
		.attr("width", x.bandwidth())
		.attr("y", function (d) { return y(d.y); })
		.attr("height", function (d) { return height - y(d.y); })
		.on("click", function(d) {
		clearMap();
		DrawRS(d.bin);
	})
	.append("title")
	.text(function(d){return d.avspeed;});	
}

//=========sample scatterplot graph=========

function scatterPlot(data){	
	data = cleanData(data);	
// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 400 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// set the ranges
var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// define the line
var valueline = d3.line()
    .x(function(d) { return x(d.duration); })
    .y(function(d) { return y(d.avspeed); });

// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin

var lineDragX = 0;
var lineDragY = 0;

d3.select("body").select("div#rightside").select("div#scatterplot").selectAll("*").remove();
var svg = d3.select("body").select("div#rightside").select("div#scatterplot").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
	.on("dragstart", function (d) {
		lineDragX = x.invert(d3.mouse(this)[0]-margin.left);
		lineDragY = y.invert(d3.mouse(this)[1]-margin.top);
	}).on("dragend", function(d) {
		var endLineDragX = x.invert(d3.mouse(this)[0]-margin.left);
		var endlineDragY = y.invert(d3.mouse(this)[1]-margin.top);
		clearMap();
		DrawRS(rangeSelect2D(data, lineDragX, endLineDragX, "duration", lineDragY, endlineDragY, "avspeed"));
	})
	.append("g")
    .attr("transform","translate(" + margin.left + "," + margin.top + ")")
	;

  // scale the range of the data
  x.domain(d3.extent(data, function(d) { return d.duration; }));
  y.domain([0, d3.max(data, function(d) { return d.avspeed; })]);
  
  // add the dots
  svg.selectAll("dot")
     .data(data)
     .enter().append("circle")
     .attr("r", 5)
     .attr("cx", function(d) { return x(d.duration); })
     .attr("cy", function(d) { return y(d.avspeed); })
	 .on("click", function(d) {
		 clearMap();
		 DrawRS([d]);
	 });
  
  // add the X Axis
  svg.append("g")
     .attr("transform", "translate(0," + height + ")")
     .call(d3.axisBottom(x))
	 .append("text")
     .attr("class", "label")
     .attr("x", width/2)
     .attr("y", 30)
     .style("text-anchor", "middle")
     .text("Duration(mins)")
	 .attr("fill", "black")
	 .style("font-size", "11px");
	
  // add the Y Axis
  svg.append("g")
     .call(d3.axisLeft(y))
	 .append("text")
	 .attr("transform", "rotate(-90)")
	 .attr("y", 0 - margin.left)
	 .attr("x", 0 - (height / 2))
	 .attr("dy", "2em")
	 .style("text-anchor", "middle")
	 .text("Speed(mph)")
	 .attr("fill", "black");
}

// sample bubble chart

function bubbleChart(data) {
	
	data = cleanData(data);
	var TaxiCounter = {};
	
	for (var i = 0; i < data.length; ++i) {
		if (! TaxiCounter.hasOwnProperty(data[i].taxiid)) {
			TaxiCounter[data[i].taxiid] = {};
			TaxiCounter[data[i].taxiid].bin = new Array();
			//TaxiCounter[data[i].taxiid].tripCount += 1;
		}
		TaxiCounter[data[i].taxiid].bin.push(data[i]);
	}
	data = new Array();
	var MaxOverallAvSpeed = 0;
	for (var ThisTaxiID in TaxiCounter) {
		var taxi = {};
		taxi.id = ThisTaxiID;

		taxi.tripCount = TaxiCounter[ThisTaxiID].bin.length;
		taxi.bin = TaxiCounter[ThisTaxiID].bin;
		var TotalDistance = 0;
		var TotalDuration = 0;
		for (var i = 0; i < TaxiCounter[ThisTaxiID].bin.length; ++i)
		{
			TotalDistance += (TaxiCounter[ThisTaxiID].bin[i].avspeed * TaxiCounter[ThisTaxiID].bin[i].duration);
			TotalDuration += TaxiCounter[ThisTaxiID].bin[i].duration;
		}
		if (TotalDuration > 0) {
			taxi.avspeed = TotalDistance / TotalDuration;
		}
		else { taxi.avspeed = 0; }
		if (taxi.avspeed > MaxOverallAvSpeed)
		{
			MaxOverallAvSpeed = taxi.avspeed;
		}
		data.push(taxi);
	}
	
	// set the dimensions and margins of the graph
	var margin = { top: 20, right: 10, bottom: 10, left: 10 },
		width = 450 - margin.left - margin.right,
		height = 600 - margin.top - margin.bottom;

	d3.select("body").select("div#rightside").select("div#bubblechart").selectAll("*").remove();
	var svg = d3.select("body").select("div#rightside").select("div#bubblechart").append("svg")

    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
	.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var format = d3.format(",d");

	//var color = d3.scaleOrdinal(d3.schemeCategory20c);
	var color = d3.scaleLinear()
	 .domain([0, MaxOverallAvSpeed])
	  .range(["red", "green"]);

	var pack = d3.pack()
		.size([width, height])
		.padding(1.5);
	
	var root = d3.hierarchy({ children: data })
	 .sum(function (d) { return d.tripCount; })
	 .each(function (d) {
	 	if (id = d.data.id) {
	 		//    var id, i = id.lastIndexOf(".");
	 		d.id = id % 10000000;
	 		d.bin = d.data.bin;
	 		d.avspeed = d.data.avspeed;
	 		d.tripCount = d.data.tripCount;
	 	}
	 })
	;
	
	var node = svg.selectAll(".node")
	  .data(pack(root).leaves())
	  .enter().append("g")
		.attr("class", "node")
		.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

	node.append("circle")
		.attr("id", function (d) { return d.id; })
		.attr("r", function (d) { return d.r; })
		.style("fill", function (d) { return color(d.avspeed); })
	.on("click", function (d) {
		clearMap();
		DrawRS(d.bin);
	})
 
 	.on("mouseover", function (d, i) {
     		svg.append("text")
     		.attr("id", "t" + d.id)
     		.text(function () {
         			return ["TaxiID: " + d.id, " Trip Count: " + d.tripCount, " Average Speed: " + d.avspeed];
         		});
     	})
 	.on("mouseout", function (d, i) {
     		d3.select("#t" + d.id).remove();
	});

	node.append("clipPath")
		.attr("id", function (d) { return "clip-" + d.id; })
	  .append("use")
		.attr("xlink:href", function (d) { return "#" + d.id; });
	
	node.append("title")
		.text(function (d) { return "Taxi: " + d.id + "\nTrips: " + format(d.tripCount) + "\nAverage Speed: " + format(d.avspeed); });

}
