let LstmLineChart = function LstmLineChart(htmlContainer, heatMapData, heatMapSettings) {
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
        minValue: -1,
        maxValue: 1,
        isInputLayer: false,
        reverseY: true
    };
    //Copy the settings if there are.
    if (heatMapSettings != null) {
        for (var prop in heatMapSettings) {
            this.settings[prop] = heatMapSettings[prop];
        }
    }
    this.data = heatMapData;
    this.type = 'lstmheatmap';

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
        let flattenedZ = [].concat.apply([], this.data.z);
        let minZ = d3.min(flattenedZ);
        let maxZ = d3.max(flattenedZ);

        this.settings.yScale = d3.scaleLinear()
            .domain([maxZ, minZ])
            .range([0, contentHeight]);
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
        this.svg.append("g").attr("class", "train");
        this.svg.append("g").attr("class", "test");
    }
    if (this.settings.showAxes) {
        var xAxis = d3.axisBottom()
            .scale(this.settings.xScale);
        if (this.settings.xTickValues) {
            xAxis.tickValues(this.settings.xTickValues);
        }
        var yAxis = d3.axisLeft()
            .scale(this.settings.yScale);
        if (this.settings.yTickValues) {
            yAxis.tickValues(this.settings.yTickValues);
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

LstmLineChart.prototype.plot = async function () {
    this.canvas.node().getContext("2d").clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.canvas.node().getContext("2d").fillStyle = 'white';
    this.canvas.node().getContext("2d").fillRect(0,0, this.canvasWidth, this.canvasHeight);

    var flattenedZ = [].concat.apply([], this.data.z);
    var minZ = d3.min(flattenedZ);
    var maxZ = d3.max(flattenedZ);

    this.settings.yScale = d3.scaleLinear()
        .domain([maxZ, minZ])
        .range([0, this.canvasHeight]);

    let self = this;
    let x = self.data.x;
    self.data.y.forEach((yVal, idx) => {
        let y = self.data.z[yVal];
        let color = 'rgba(0,0,0,0.2)';
        if (isOutlierGlobal[idx]) {
            color = 'rgba(255,165,0,0.5)'
        }
        this.draw(x, y, this.settings.lineWidth, color)
    });
};

LstmLineChart.prototype.update = async function (newData) {
    this.data = newData;
    this.plot();
};

LstmLineChart.prototype.draw = async function (x, y, lineWidth, strokeStyle) {
    let lineData = x.map((xVal, i) => {
        return {
            x: xVal,
            y: y[i]
        }
    });

    let ctx = this.canvas.node().getContext("2d");
    let xScale = this.settings.xScale;
    let yScale = this.settings.yScale;

    let line = d3.line().x(d => xScale(d.x)).y(d => yScale(d.y)).context(ctx);
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    line(lineData);
    ctx.stroke();
};