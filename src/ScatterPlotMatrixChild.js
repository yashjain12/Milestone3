import React, { Component } from "react";
import * as d3 from "d3";

class ScatterPlotMatrixChild extends Component {
  constructor(props) {
    super(props);
    this.svgRef = React.createRef();
    this.zoomPlotRef = React.createRef();
    this.state = {
      zoomedIn: false,
      xFeature: null,
      yFeature: null,
    };
  }

  componentDidMount() {
    this.createScatterPlotMatrix();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.data !== this.props.data) {
      this.createScatterPlotMatrix();
    } else if (
      prevState.zoomedIn !== this.state.zoomedIn ||
      prevState.xFeature !== this.state.xFeature ||
      prevState.yFeature !== this.state.yFeature
    ) {
      this.state.zoomedIn
        ? this.createDetailedScatterPlot(this.state.xFeature, this.state.yFeature)
        : this.createScatterPlotMatrix();
    }
  }

  createScatterPlotMatrix = () => {
    const { data } = this.props;
    if (data.length === 0) return;

    const features = ["Rank", "Votes", "Rating", "Revenue (Millions)"];
    const size = 150;
    const padding = 20;
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const width = features.length * size + margin.left + margin.right + 200;
    const height = size * 1.2 + (features.length - 1) * size + margin.top + margin.bottom;

    const svg = d3.select(this.svgRef.current);
    svg.selectAll("*").remove();
    svg
      .attr("width", width)
      .attr("height", height)
      .style("margin", "0px")
.style("padding", "10px")
      .style("padding-right", "0px")
      .style("border", "1px solid gray")
      .style("display", "block");

    const scales = {};
    features.forEach((feature, index) => {
      scales[feature] = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d[feature]))
        .range([size - padding, padding]);
    });

    const colorScale = d3
    .scaleSequential(d3.interpolateRdBu)
    .domain([-1, 1]); // Correlation range


    features.forEach((yFeature, rowIndex) => {
      features.forEach((xFeature, colIndex) => {
        const boxHeight = rowIndex === 0 ? size * 1.2 : size;
        const adjustedTranslateY =
        rowIndex === 0
    ? margin.top // First row starts from margin.top
    : (rowIndex - 1) * size + size * 1.2 + margin.top; 
        /*rowIndex * size + margin.top - (rowIndex === 0 ? 0.2 * size : 0);*/

        
        const g = svg
          .append("g")
          .attr(
            "transform",
            `translate(${colIndex * size + margin.left}, ${
              adjustedTranslateY - 40
            })`
          );

        // INCREMENTAL CORRELATION FORMULA TAKEN
        // cannot compute correlation using all points - this is too slow and inefficient
        // so we need one that given correlation of n points and we have (n + 1)th point
        // we don't have to recalculate to avoid repetition

        var sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumX2 = 0,
        sumY2 = 0,
        n = 0;

        data.forEach((d) => {
          const x = d[xFeature];
          const y = d[yFeature];
          sumX += x;
          sumY += y;
          sumXY += x * y;
          sumX2 += x * x;
          sumY2 += y * y;
          n += 1;
        });

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt(
          (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
        );

        const correlation = denominator === 0 ? 0 : numerator / denominator;
        
        g.append("rect")
          .attr("width", size)
          .attr("height", boxHeight)
          .attr("fill", colorScale(correlation))
          .attr("opacity", 0.5)
          .on("click", () => {
            this.setState({ zoomedIn: true, xFeature, yFeature });
          });

        g.selectAll("circle")
          .data(data)
          .enter()
          .append("circle")
          .attr("cx", (d) => {
            const range = scales[xFeature].range();
    const reversedX = range[1] - (scales[xFeature](d[xFeature]) - range[0]);
    return reversedX;

          })
          .attr("cy", (d) => scales[yFeature](d[yFeature]) + (rowIndex === 0 ? 0.2 * size : 0))
          .attr("r", 3)
          .attr("fill", "steelblue")
          .attr("opacity", 0.7);

        if (xFeature !== yFeature) {
          g.append("text")
            .attr("x", size / 2)
            .attr("y", function() {
              if (rowIndex === 0) {return 37;}
              else {return 15;}})
            .style("text-anchor", "middle")
            .style("font-size", "10px")
            .text(`${xFeature} vs ${yFeature}`);
        }
      });

      svg
        .append("text")
        .attr(
          "transform",
          `translate(${margin.left - 30}, ${
            rowIndex * size + margin.top + size / 2 - 15
          }) rotate(-90)`
        )
        .style("text-anchor", "middle")
        .text(yFeature);
    });

    features.forEach((xFeature, colIndex) => {
      svg
        .append("text")
        .attr(
          "transform",
          `translate(${colIndex * size + margin.left + size / 2}, ${
            height - 45
          })`
        )
        .style("text-anchor", "middle")
        .text(xFeature);
    });
    
    const positionRects = Array.from({length:200}, (_, i) => i)
/*
    const corrScale = d3.scaleLinear().domain([0, 200]).range(colorScale.domain())

    const positionScale = d3.scaleLinear().domain([0, 200]).range([70, height - margin.top - margin.bottom - 70])

    const legendSvg = svg.selectAll(".myclass").data([0]).join("g").attr("class", "myclass")
    .attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`)

    console.log("corrscale domain", corrScale.domain(), corrScale.range())
    console.log("posscale domain", positionScale.domain(), positionScale.range())

    legendSvg.selectAll("rect").data(positionRects).join("rect").attr("x", 0)
    .attr("y", (d) =>positionScale(d))
    .attr("width", 100).attr("height", positionScale(1) - positionScale(0))
    .style("fill", d => d3.interpolateRdBu(corrScale(d)))

    legendSvg.selectAll(".corr_text").data([0]).join("text").attr("class", 'corr_text').text("Correlation Color Scale")
    .attr("x", 0).attr("y", height/2).attr('transform',`rotate(-90)`)
    */

    const corrScale = d3.scaleLinear().domain([0, 200]).range(colorScale.domain());
    const positionScale = d3
      .scaleLinear()
      .domain([0, 200])
      .range([70, height - margin.top - margin.bottom - 70]);
    
    const legendSvg = svg
      .selectAll(".myclass")
      .data([0])
      .join("g")
      .attr("class", "myclass")
      .attr("transform", `translate(${width - margin.right-160}, ${margin.top})`);

    legendSvg
      .selectAll("rect")
      .data(positionRects)
      .join("rect")
      .attr("x", 0)
      .attr("y", (d) => positionScale(d)) 
      .attr("width", 100)
      .attr("height", positionScale(1) - positionScale(0)) 
      .style("fill", (d) => d3.interpolateRdBu(corrScale(d))); 
    
    legendSvg
      .selectAll(".corr_text")
      .data([0])
      .join("text")
      .attr("class", "corr_text")
      .text("Correlation Color Scale")
      .attr("font-size", "1.5em")
      .attr("x", -320)
      .attr("y", 140) 
      .attr("transform", "rotate(-90)") 
      .style("text-anchor", "middle");
    
  };

  createDetailedScatterPlot = (xFeature, yFeature) => {
    const { data } = this.props;
    if (data.length === 0) return;

    const width = 800;
    const height = 800;
    const padding = 80;

    const svg = d3.select(this.svgRef.current);
    svg.selectAll("*").remove();
    svg
      .attr("width", width)
      .attr("height", height)
      .style("background", "white")
      .style("border", "1px solid gray")
      .style("position", "relative");

    const zoomedXScale = d3.scaleLinear()
      .domain(d3.extent(data, (d) => d[xFeature]))
      .nice()
      .range([padding, width - padding]);

    const zoomedYScale = d3.scaleLinear()
      .domain(d3.extent(data, (d) => d[yFeature]))
      .nice()
      .range([height - padding, padding]);

    svg
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => zoomedXScale(d[xFeature]) + 4)
      .attr("cy", (d) => zoomedYScale(d[yFeature]) - 4)
      .attr("r", 4)
      .attr("fill", "steelblue")
      .attr("opacity", 0.7)
      .on("mouseover", (event, d) => {
        d3.select("#tooltip")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`)
          .style("display", "inline-block")
          .html(`${xFeature}: ${d[xFeature]}<br/>${yFeature}: ${d[yFeature]}<br/>Title: ${d.Title}`);
      })
      .on("mouseout", () => {
        d3.select("#tooltip").style("display", "none");
      });
    
    //x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height - padding})`)
      .call(d3.axisBottom(zoomedXScale).tickFormat(d3.format("~s")));

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 25)
      .style("text-anchor", "middle")
      .text(xFeature);

    //y-axis
    svg.append("g")
      .attr("transform", `translate(${padding},0)`)
      .call(d3.axisLeft(zoomedYScale).tickFormat(d3.format("~s")));

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", padding / 3)
      .style("text-anchor", "middle")
      .text(yFeature);

    svg.append("text")
      .text("Close")
      .attr("x", width - 70)
      .attr("y", 50)
      .style("cursor", "pointer")
      .style("font-size", "20px")
      .style("fill", "red")
      .on("click", () => {
        this.setState({ zoomedIn: false, xFeature: null, yFeature: null });
      });
  };

  render() {
    return (
      <div>
        <svg ref={this.svgRef}></svg>
        <div
          id="tooltip"
          style={{
            position: "absolute",
            display: "none",
            background: "white",
            border: "1px solid gray",
            padding: "5px",
            pointerEvents: "none",
          }}
        ></div>
      </div>
    );
  }
}

export default ScatterPlotMatrixChild;
