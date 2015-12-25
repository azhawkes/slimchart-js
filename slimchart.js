function SlimChart(config) {
    var self = this;

    self.config = {
        axisLineWidth: config.axisLineWidth || 1,
        axisLineColor: config.axisLineColor || "#000000",
        axisTextColor: config.axisTextColor || "#000000",
        xAxisFormatter: config.xAxisFormatter || function (val) {
            return val;
        },
        yAxisFormatter: config.yAxisFormatter || function (value, max) {
            if (value == 0) {
                return "";
            } else if (max <= .1) {
                return value.toFixed(2);
            } else if (max <= 1) {
                return value.toFixed(1);
            } else if (max <= 10) {
                return value.toFixed(1);
            } else {
                return value.toFixed(0);
            }
        },
        yAxisMin: config.yAxisMin,
        yAxisMax: config.yAxisMax,
        yAxisSteps: config.yAxisSteps || 5,
        datasetLineWidth: config.datasetLineWidth || 2,
        datasetColorPicker: config.datasetColorPicker || function (dataset) { 
            return '#' + Math.floor(Math.random()*16777215).toString(16);
        },
        canvas: config.canvas
    };

    if (self.config.canvas instanceof HTMLCanvasElement) {
        self.config.context = canvas.getContext('2d');
    } else {
        throw new Error("canvas is not an element");
    }

    self.draw = function (data) {
        self.clear();
        self.validateData(data);

        var start = new Date().getTime();

        self.scaleForRetina();
        self.analyzeData(data);
        self.drawDatasets(data);
        self.drawAxes(data);

        var end = new Date().getTime();

        console.log("drawn in " + (end - start));
    }

    self.analyzeData = function (data) {
        var config = self.config;
        var ctx = config.context;
        var w = ctx.canvas.clientWidth;
        var h = ctx.canvas.clientHeight;

        config.graphArea = {
            left: 50,
            top: 10,
            bottom: h - 50,
            right: w
        };

        if (typeof(config.yAxisMax) === 'undefined' || typeof(config.yAxisMin) === 'undefined') {
            var yAxisMax = Number.MIN_VALUE;
            var yAxisMin = Number.MAX_VALUE;

            data.datasets.forEach(function(dataset) {
                dataset.data.forEach(function(value) {
                    yAxisMax = Math.max(yAxisMax, value);
                    yAxisMin = Math.min(yAxisMin, value);
                });
            });

            if (typeof(config.yAxisMax) === 'undefined') {
                config.yAxisMax = yAxisMax;
            }

            if (typeof(config.yAxisMin) === 'undefined') {
                config.yAxisMin = yAxisMin;
            }

            config.yAxisMax = self.calculateYAxisCeiling(config.yAxisMax);
        }

        config.xStep = (config.graphArea.right - config.graphArea.left) / data.labels.length;
    }

    self.drawAxes = function (data) {
        var config = self.config;
        var ctx = config.context;
        var g = config.graphArea;

        ctx.translate(0.5, 0.5);
        ctx.lineWidth = config.axisLineWidth;
        ctx.strokeStyle = config.axisLineColor;
        ctx.beginPath();
        ctx.moveTo(g.left, g.top);
        ctx.lineTo(g.left, g.bottom);
        ctx.lineTo(g.right, g.bottom);
        ctx.stroke();
        ctx.fillStyle = config.axisTextColor;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';

        for (var i = 0; i < data.labels.length; i++) {
            var x = Math.round(g.left + (config.xStep * i));
            var y = g.bottom;
            var t = config.xAxisFormatter(data.labels[i]);

            if (t) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + 5);
                ctx.stroke();

                ctx.fillText(t, x, y + 5);
            }
        }

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'end';

        var yStep = (g.bottom - g.top) / config.yAxisSteps;

        for (var i = 0; i <= config.yAxisSteps; i++) {
            var x = g.left;
            var y = g.top + (i * yStep);
            var steps = config.yAxisSteps;
            var range = config.yAxisMax - config.yAxisMin;
            var v = config.yAxisMax - (i / config.yAxisSteps) * range;
            var t = config.yAxisFormatter(v, config.yAxisMax);

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 5, y);
            ctx.stroke();

            ctx.fillText(t, x - 8, y);
        }

        ctx.translate(0, 0);
    }

    self.drawDatasets = function (data) {
        var config = self.config;
        var ctx = config.context;
        var g = config.graphArea;
        var width = g.right - g.left;
        var height = g.bottom - g.top;
        var range = config.yAxisMax - config.yAxisMin;

        data.datasets.forEach(function (dataset) {
            ctx.lineWidth = config.datasetLineWidth;
            ctx.strokeStyle = config.datasetColorPicker(dataset);
            ctx.beginPath();

            dataset.data.forEach(function (val, i) {
                var ratio = (val - config.yAxisMin) / (config.yAxisMax - config.yAxisMin);
                var x = g.left + (i * config.xStep);
                var y = g.bottom - (height * ratio);

                if (i == 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        });
    }

    self.scaleForRetina = function () {
        var ctx = self.config.context;
        var width = ctx.canvas.width;
        var height = ctx.canvas.height;

        if (window.devicePixelRatio) {
            ctx.canvas.style.width = width + "px";
            ctx.canvas.style.height = height + "px";
            ctx.canvas.height = height * window.devicePixelRatio;
            ctx.canvas.width = width * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
    }

    self.clear = function () {
        self.config.context.clearRect(0, 0, self.config.canvas.width, self.config.canvas.height);
    }

    
    self.calculateYAxisCeiling = function (value) {
        var steps = self.config.yAxisSteps;
        var magnitude = Math.floor(Math.log(value) / Math.LN10);
        var multiplier = Math.pow(10, magnitude);
        var stepSize = multiplier * Math.ceil(value / steps / multiplier);

        return stepSize * steps;
    }

    self.validateData = function (data) {
        if (!data) {
            throw new Error("data is required");
        } else if (!Array.isArray(data.labels)) {
            throw new Error("data.labels must be an array");
        } else if (!Array.isArray(data.datasets)) {
            throw new Error("data.datasets must be an array");
        }
    }
}
