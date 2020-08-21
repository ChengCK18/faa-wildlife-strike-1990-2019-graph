
function draw_sankey(){
	var units = "Incidents";
	// set the dimensions and margins of the graph
	var margin = {top: 10, right: 50, bottom: 10, left: 10},
		width = 700 - margin.left - margin.right,
		height = 700 - margin.top - margin.bottom;

	// format variables
	var formatNumber = d3.format(",.0f"),    // zero decimal places
		format = function(d) { return formatNumber(d) + " " + units; },
		color = d3.scaleOrdinal(d3.schemeCategory20);

	// append the svg object to the body of the page
	var svg = d3.select("#the_graph")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", 
			  "translate(" + margin.left + "," + margin.top + ")");
		

	// Set the sankey diagram properties
	var sankey = d3.sankey()
		.nodeWidth(36)
		.nodePadding(40)
		.size([width, height]);

	var path = sankey.link();

	// load the data
	d3.csv("sankey_parsed_data.csv", function(error, data) {
	 
	  //set up graph in same style as original example but empty
	  graph = {"nodes" : [], "links" : []};

	  data.forEach(function (d) {
		graph.nodes.push({ "name": d.source });
		graph.nodes.push({ "name": d.target });
		graph.links.push({ "source": d.source,
						   "target": d.target,
						   "value": +d.value });
	   });

	  // return only the distinct / unique nodes
	  graph.nodes = d3.keys(d3.nest()
		.key(function (d) { return d.name; })
		.object(graph.nodes));

	  // loop through each link replacing the text with its index from node
	  graph.links.forEach(function (d, i) {
		graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
		graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
	  });

	  // now loop through each nodes to make nodes an array of objects
	  // rather than an array of strings
	  graph.nodes.forEach(function (d, i) {
		graph.nodes[i] = { "name": d };
	  });

	  sankey
		  .nodes(graph.nodes)
		  .links(graph.links)
		  .layout(32);
		  
		  
	  
      function setDash(d) {
        var d3this = d3.select(this);
        var totalLength = d3this.node().getTotalLength();
        d3this
          .attr('stroke-dasharray', totalLength + ' ' + totalLength)
          .attr('stroke-dashoffset', totalLength)
      }

      function branchAnimate(nodeData) {
        var links = svg.selectAll(".gradient-link")
          .filter(function(gradientD) {
            return nodeData.sourceLinks.indexOf(gradientD) > -1
          });
        var nextLayerNodeData = [];
        links.each(function(d) {
          nextLayerNodeData.push(d.target);
        });

        links
          .style("opacity", null)
          .transition()
          .duration(400)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0)
          .on("end", function(d) {
			  nextLayerNodeData.forEach(function(d) {
              branchAnimate(d);
            });
          });
      } //end branchAnimate

	var gradientLink = svg.append("g").selectAll(".gradient-link")
        .data(graph.links)
        .enter().append("path")
        .attr("class", "gradient-link")
        .attr("d", path)
        .style("stroke-width", function(d) {
          return Math.max(1, d.dy);
        })
        .sort(function(a, b) {
          return b.dy - a.dy;
        })
        .each(setDash)
        .style('stroke', function(d) {
          var sourceColor = color(d.source.name.replace(/ .*/, "")).replace("#", "");
          var targetColor = color(d.target.name.replace(/ .*/, "")).replace("#", "");
          var id = 'c-' + sourceColor + '-to-' + targetColor;
          if (svg.select(id).empty()) {
		
            //append the gradient def
            //append a gradient
            var gradient = svg.append('defs')
              .append('linearGradient')
              .attr('id', id)
              .attr('x1', '0%')
              .attr('y1', '0%')
              .attr('x2', '100%')
              .attr('y2', '0%')
              .attr('spreadMethod', 'pad');

            gradient.append('stop')
              .attr('offset', '0%')
              .attr('stop-color', "#" + sourceColor)
              .attr('stop-opacity', 1);

            gradient.append('stop')
              .attr('offset', '100%')
              .attr('stop-color', "#" + targetColor)
              .attr('stop-opacity', 1);
          }
          return "url(#" + id + ")";
        });	  
		  
		  

	  // add in the links
	  var link = svg.append("g").selectAll(".link")
		  .data(graph.links)
		.enter().append("path")
		  .attr("class", "link")
		  .attr("d", path)
		  .style("stroke-width", function(d) { return Math.max(1, d.dy); })
		  .sort(function(a, b) { return b.dy - a.dy; });

	  // add the link titles
	  link.append("title")
			.text(function(d) {
				return d.source.name + " → " + 
					d.target.name + "\n" + format(d.value); });

	  // add in the nodes
	  var node = svg.append("g").selectAll(".node")
		  .data(graph.nodes)
		.enter().append("g")
		  .attr("class", "node")
		  .attr("transform", function(d) { 
			  return "translate(" + d.x + "," + d.y + ")"; })
		  .call(d3.drag()
			.subject(function(d) {
			  return d;
			})
			.on("start", function() {
			  this.parentNode.appendChild(this);
			})
			.on("drag", dragmove))
			.on("mouseover", branchAnimate)
        .on("mouseout", function() {
          //cancel all transitions by making a new one
          gradientLink.transition();
          gradientLink
            .style("opacity", 0)
            .each(function(d) {
              setDash.call(this, d);
            });
        });;

	  // add the rectangles for the nodes
	  node.append("rect")
		  .attr("height", function(d) { return d.dy; })
		  .attr("width", sankey.nodeWidth())
		  .style("fill", function(d) { 
			
			  return d.color = color(d.name.replace(/ .*/, "")); })
		  .style("stroke", function(d) { 
			  return d3.rgb(d.color).darker(2); })
		.append("title")
		  .text(function(d) { 
			  return d.name + "\n" +format(d.value)+"\n"+((parseInt(d.value)/22486*100).toFixed(2))+"%"; });

	  // add in the title for the nodes
	  node.append("text")
		  .attr("x", -8)
		  .attr("y", function(d) { return d.dy / 2; })
		  .attr("dy", ".35em")
		  .attr("text-anchor", "end")
		  .attr("transform", null)
		  .text(function(d) { return d.name; })
		  .style("fill","white")
		  .style("font-size","1.25em")
		  .filter(function(d) { return d.x < width / 2; })
		  
		  .attr("x", 6 + sankey.nodeWidth())
		  .attr("text-anchor", "start");

	  // the function for moving the nodes
	  function dragmove(d) {
		d3.select(this)
		  .attr("transform", 
				"translate(" 
				   + d.x + "," 
				   + (d.y = Math.max(
					  0, Math.min(height - d.dy, d3.event.y))
					 ) + ")");
		sankey.relayout();
		link.attr("d", path)
		gradientLink.attr("d",path);
		
	  }
	});
}


function draw_scatter(operators_array,time_of_day_array){
	d3.select("#the_graph2").selectAll("*").remove();
	var margin = {top: 10, right: 30, bottom: 80, left: 100},
	width = 700 - margin.left - margin.right,
	height = 700 - margin.top - margin.bottom;
	// append the svg object to the body of the page
	var svg = d3.select("#the_graph2")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform",
	  "translate(" + margin.left + "," + margin.top + ")")

	//Read the data
	d3.csv("final_cleaned_wildlife_impacts.csv", function(data) {

	// Add X axis
	var x = d3.scaleLinear()
	.domain([0, 0])
	.range([ 0, width ]);
	svg.append("g")
	.attr("class","x_axis axis_color")
	.attr("transform", "translate(0," + height + ")")
	.call(d3.axisBottom(x))
	.attr("opacity", "0")
	
	//Add X axis title
	svg.append("text")             
	.attr("transform",
		"translate(" + (width/2) + " ," + 
					   (height + margin.top + 50) + ")")
	.style("text-anchor", "middle")
	.style("font-size","25px")
	.style("fill","white")
	.text("Speed");

	// Add Y axis
	var y = d3.scaleLinear()
	.domain([0,d3.max(data,function(d){return parseInt(d.height);})+2000])
	.range([ height, 0]);
	svg.append("g")
	.attr("class","y_axis axis_color")
	.call(d3.axisLeft(y));
	
	//Add Y axis title
	svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left -5)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
	  .style("fill","white")
      .text("Altitude")
	  .style("font-size","25px");  


	// Add dots
	var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
	
	svg.append('g')
	.selectAll("dot")
	.data(data.filter(function(d){ //to apply user's filter
		return operators_array.includes(d.operator)&&time_of_day_array.includes(d.time_of_day);

	}))
	.enter()
	.append("circle")
	.attr("cx", function (d) { return x(d.speed); } )
	.attr("cy", function (d) { return y(d.height); } )
	.attr("r", 1.9)
	.on("mouseover", function(d) {		
            div.transition()		
                .duration(200)		
                .style("opacity", 1);		
            div	.html("<strong>Date: </strong>"+d.incident_date.substring(0,10)+
					  "<br><strong>Operator: </strong>"+d.operator+
					  "<br><strong>Aircraft: </strong>"+d.atype+
					  "<br><strong>Airport: </strong>"+d.airport+
					  "<br><strong>Species: </strong>"+d.species)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");	
            })					
        .on("mouseout", function(d) {		
            div.transition()		
                .duration(500)		
                .style("opacity", 0);	
     })
	.style("fill", function(d,i){
		if(d.damage == "N"){
			return "green";
		}
		else if(d.damage == "M?" ||d.damage == "M" ){
			return "orange";
		}
		else if(d.damage == "S"){
			return "red";
		}
		else{
			return "purple";
		}
	});


	// new X axis
	x.domain([0,d3.max(data,function(d){return parseInt(d.speed);})+50])
	svg.select(".x_axis")
	.style("font-size","18px")
	.transition()
	.duration(2000)
	.attr("opacity", "1")
	.call(d3.axisBottom(x));
	
	svg.select(".y_axis")
	.style("font-size","18px")
	.transition()
	.duration(2000)
	
	svg.selectAll("circle")
	.transition()
	.delay(function(d,i){return(i*3)})
	.duration(5)
	.attr("cx", function (d) { return x(d.speed); } )
	.attr("cy", function (d) { return y(d.height); } )

	
	
	//Adding legend
	svg.append("circle").attr("cx",margin.left+400).attr("cy",margin.top + 15).attr("r", 6).style("fill", "#00FF1A")
	svg.append("circle").attr("cx",margin.left+400).attr("cy",margin.top + 35).attr("r", 6).style("fill", "#ffae00")
	svg.append("circle").attr("cx",margin.left+400).attr("cy",margin.top + 55).attr("r", 6).style("fill", "red")
	svg.append("text").attr("x", margin.left+410).attr("y", margin.top + 20).text("None").style("fill","white");
	svg.append("text").attr("x", margin.left+410).attr("y", margin.top + 40).text("Minor").style("fill","white");
	svg.append("text").attr("x", margin.left+410).attr("y", margin.top + 60).text("Substantial").style("fill","white");
	svg.append("text").attr("x", margin.left+400).attr("y", margin.top ).text("Damage").style("fill","white");
	
	
	})
}

function filter_function(){
	//get operators checkbox value
	var operators_array = [];
	
	if(document.getElementById("americanA").checked){
		operators_array.push("AMERICAN AIRLINES");
	}
	if(document.getElementById("deltaA").checked){
		operators_array.push("DELTA AIR LINES");
	}
	if(document.getElementById("southwestA").checked){
		operators_array.push("SOUTHWEST AIRLINES");
	}
	if(document.getElementById("unitedA").checked){
		operators_array.push("UNITED AIRLINES");
	}
	
	//get time of day
	var time_of_day_array = [];
	
	if(document.getElementById("day").checked){
		time_of_day_array.push("Day");
	}
	if(document.getElementById("night").checked){
		time_of_day_array.push("Night");
	}
	if(document.getElementById("dusk").checked){
		time_of_day_array.push("Dusk");
	}
	if(document.getElementById("dawn").checked){
		time_of_day_array.push("Dawn");
	}

	draw_scatter(operators_array,time_of_day_array)
	
}

function tamago(){
	console.log("Tamagooooo");
	var egg= document.getElementById("tamago");
	egg.play();
	var svg = d3.select("#the_graph2")
	svg.append("circle").attr("cx",350).attr("cy", 560).attr("r", 15).style("fill", "red")
	.transition()
	.duration(2000)
	.attr("stroke-width", 20)
	.attr("r", 10)
	.transition()
	.duration(2000)
	.attr('stroke-width', 0.5)
	.attr("r", 15)
	.ease(d3.easeSin)
	.on("end", 'repeat');
	
}

operators_array = ["AMERICAN AIRLINES","DELTA AIR LINES","SOUTHWEST AIRLINES","UNITED AIRLINES"];
time_of_day_array = ["Day","Night","Dusk","Dawn"];

draw_sankey();
draw_scatter(operators_array,time_of_day_array);


