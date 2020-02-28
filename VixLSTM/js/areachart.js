let AreaChart = function AreaChart(htmlContainer, areaChartData, areaChartSettings) {
    this.settings = {
        showAxes: false,
        noSvg: true,
        borderColor: 'black',
        borderWidth: 0,
        paddingLeft: 0,
        paddingTop: 0,
        paddingBottom: 0,
        paddingRight: 0,
        showColorBar: false,
        minShapValue: areaChartSettings.minShapValue,
        maxShapValue: areaChartSettings.maxShapValue,
        isInputLayer: areaChartSettings.isInputLayer,
    };
    //Copy the settings if there are.
    if (areaChartSettings !== null) {
        for (let prop in areaChartSettings) {
            this.settings[prop] = areaChartSettings[prop];
        }
    }

    this.data = areaChartData;
    this.type = 'areachart';

    if (this.settings.showAxes || this.settings.showColorBar || this.settings.title) {
        this.settings.noSvg = false;
    }
    //Find width and height
    if (!this.settings.width) {
        this.settings.width = htmlContainer.getBoundingClientRect().width;
    }
    if (!this.settings.height) {
        this.settings.height = htmlContainer.getBoundingClientRect().height;
    }
    //contentWidth
    var contentWidth = this.settings.width - this.settings.paddingLeft - this.settings.paddingRight;
    var contentHeight = this.settings.height - this.settings.paddingTop - this.settings.paddingBottom;
    this.canvasWidth = contentWidth;
    this.canvasHeight = contentHeight;
    //CellWidth, cellHeight
    if (!this.settings.cellWidth) {
        this.settings.cellWidth = (contentWidth) / this.data.x.length;
    }
    if (!this.settings.cellHeight) {
        this.settings.cellHeight = (contentHeight) / this.data.y.length;
    }
    //Scales
    if (!this.settings.xScale) {
        this.settings.xScale = d3.scaleLinear()
            .domain([0, this.data.x.length - 1])
            .range([0, contentWidth]);

    }
    if (!this.settings.yScale) {
        // let flattenedZ = [].concat.apply([], this.data.z);
        // let minZ = d3.min(flattenedZ);
        // let maxZ = d3.max(flattenedZ);

        let domain = [this.settings.minShapValue, this.settings.maxShapValue];

        this.settings.yScale = d3.scaleLinear()
            .domain(domain);

        if (this.settings.direction === 'up') {
            this.settings.yScale.range([contentHeight, 0]);
        } else {
            this.settings.yScale.range([0, contentHeight]);
        }
    }

    var container = d3.select(htmlContainer).append("div")
        .style("width", this.settings.width + "px")
        .style("height", this.settings.height + "px")
        .style("position", "relative")
        .style("top", "0px")
        .style("left", "0px");
    this.canvas = container.append("canvas")
        .attr("width", contentWidth)
        .attr("height", contentHeight)
        .style("width", (contentWidth) + "px")
        .style("height", (contentHeight) + "px")
        .style("position", "absolute")
        .style("top", this.settings.paddingTop + "px")
        .style("left", this.settings.paddingLeft + "px");
    if (!this.settings.noSvg) {
        this.svg = container.append("svg").attr("width", this.settings.width)
            .attr("height", this.settings.height)
            .style("position", "absolute")
            .style("left", "0px")
            .style("top", "0px")
            .append("g")
            .attr("transform", "translate(0, 0)");
    }

    if (this.settings.showAxes) {
        let xAxis = d3.axisBottom()
            .scale(this.settings.xScale);
        if (this.settings.xTickValues) {
            xAxis.tickValues(this.settings.xTickValues);
        }
        let yAxis = d3.axisLeft()
            .scale(this.settings.yScale);
        if (this.settings.yTickValues) {
            yAxis.tickValues(this.settings.yTickValues.reverse());
        }

        this.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + this.settings.paddingLeft + "," + (this.settings.height - this.settings.paddingBottom) + ")")
            .call(xAxis);
        this.svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + this.settings.paddingLeft + "," + this.settings.paddingTop + ")")
            .call(yAxis);
    }
    //Show title
    if (this.settings.title) {
        var title = this.svg.append("g").append("text").attr("class", "graphTitle").attr("x", this.settings.paddingLeft + contentWidth / 2).attr("y", -this.settings.paddingTop / 2)
            .text(this.settings.title.text).attr("alignment-baseline", "middle").attr("text-anchor", "middle").attr("font-weight", "bold");
        if (this.settings.title.fontFamily) {
            title.attr("font-family", this.settings.title.fontFamily);
        }
        if (this.settings.title.fontSize) {
            title.attr("font-size", this.settings.title.fontSize);
        }
    }
    //Show axis labels
    if (this.settings.xAxisLabel) {
        this.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + (this.settings.width / 2) + "," + (this.settings.height) + ")") // centre below axis at the bottom
            .attr("dy", "-0.5em")
            .text("Sequence");
    }
    if (this.settings.yAxisLabel) {
        this.svg.append("text")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "hanging")
            .attr("transform", "translate(0," + (this.settings.height / 2) + ")rotate(-90)")
            .text("Value").attr("dx", "1em"); //Also move right one text size.
    }
};

AreaChart.prototype.plot = async function () {
    this.canvas.node().getContext("2d").clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.canvas.node().getContext("2d").fillStyle = 'white';
    this.canvas.node().getContext("2d").fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    let minDomain = this.settings.minShapValue;
    let maxDomain = this.settings.maxShapValue;
    let avgDomain = (this.settings.minShapValue + this.settings.maxShapValue) / 2;
    let deltaDomain = (maxDomain - minDomain) / 10;
    let domain = [avgDomain - 5 * deltaDomain, avgDomain - 4 * deltaDomain, avgDomain - 3 * deltaDomain, avgDomain - 2 * deltaDomain, avgDomain - 1 * deltaDomain, avgDomain, avgDomain + 1 * deltaDomain, avgDomain + 2 * deltaDomain, avgDomain + 3 * deltaDomain, avgDomain + 4 * deltaDomain, avgDomain + 5 * deltaDomain];

    this.settings.colorScale = d3.scaleLinear()
        .domain(domain)
        .range(['#053061', '#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7', '#fddbc7', '#f4a582', '#d6604d', '#b2182b', '#67001f'])
        .clamp(true);

    let y0 = this.settings.direction === 'up' ? this.settings.height : 0;
    // let y1 = this.settings.direction === 'up'?this.settings.height:0;

    this.settings.area = d3.area()
        .x(d => this.settings.xScale(d.x))
        .y0(y0)
        .y1(d => this.settings.yScale(d.y));

    let self = this;
    let x = self.data.x;
    let y = self.data.y;

    let strokeStyle = this.settings.direction === 'up' ? '#67001f' : '#053061';

    this.draw(x, y, strokeStyle);
};

AreaChart.prototype.update = async function (newData) {
    this.data = newData;
    this.plot();
};

AreaChart.prototype.draw = async function (x, y, strokeStyle) {
    let areaData = x.map((xVal, i) => {
        return {
            x: xVal,
            y: y[i]
        }
    });

    this.svg.append("path")
        .data([areaData])
        .attr("class", "area")
        .attr("d", this.settings.area)
        .attr('fill', strokeStyle);
};