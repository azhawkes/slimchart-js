//
// Usage:
//
// var config = {
//     canvas: document.getElementById('myCanvas')
// };
//
// var data = {
//     labels: ["Jan", "Feb", "Mar"],
//     datasets: [
//         {
//             data: [3.5, 12.2, 6.8]
//         },
//         {
//             data: [5.4, 9.9, 4.6]
//         }
//     ]
// };
//
// new SlimChart(config).draw(data);
//
function SlimChart(config) {
    var self = this;

    // 
    // Override these default configuration parameters yourself
    // 
    self.initialize = function (config) {
        self.config = {
            canvas: config.canvas, // required - a canvas element
            axisLineWidth: config.axisLineWidth || 1,
            axisLineColor: config.axisLineColor || "#000000",
            axisTextColor: config.axisTextColor || "#000000",
            xAxisFormatter: config.xAxisFormatter || self.defaultXAxisFormatter,
            yAxisFormatter: config.yAxisFormatter || self.defaultYAxisFormatter,
            yAxisMin: config.yAxisMin,
            yAxisMax: config.yAxisMax,
            yAxisSteps: config.yAxisSteps || 5,
            yAxisStepLineColor: config.yAxisStepLineColor || "rgba(0, 0, 0, 0)",
            datasetLineWidth: config.datasetLineWidth || 2,
            datasetColorPicker: config.datasetColorPicker || self.defaultColorPicker,
            datasetPointSizePicker: config.datasetPointSizePicker || self.defaultPointSizePicker,
            smooth: config.smooth || false,
            tension: config.tension || 4
        };

        self.calculations = {};

        if (self.config.canvas instanceof HTMLCanvasElement) {
            self.config.context = self.config.canvas.getContext('2d');
        } else {
            throw new Error("canvas is not an element");
        }
    };

    //
    // Draws (or redraws) the chart; this can safely be called again with new data
    //
    self.draw = function (data) {
        self.clear();
        self.validateData(data);

        var start = new Date().getTime();

        self.scaleForRetina();
        self.analyzeData(data);
        self.drawAxes(data);
        self.drawDatasets(data);

        var end = new Date().getTime();

        console.log("drawn in " + (end - start));
    };

    //
    // Analyzes chart data to compute maximum and minimum
    //
    self.analyzeData = function (data) {
        var config = self.config;
        var calculations = self.calculations;
        var ctx = config.context;
        var w = ctx.canvas.width;
        var h = ctx.canvas.height;

        if (window.devicePixelRatio) {
            w = w / window.devicePixelRatio;
            h = h / window.devicePixelRatio;
        }

        calculations.graphArea = {
            left: 50,
            top: 10,
            bottom: h - 50,
            right: w
        };

        var yAxisMax = Number.MIN_VALUE;
        var yAxisMin = Number.MAX_VALUE;

        data.datasets.forEach(function (dataset) {
            dataset.data.forEach(function (value) {
                yAxisMax = Math.max(yAxisMax, value);
                yAxisMin = Math.min(yAxisMin, value);
            });
        });

        if (typeof(config.yAxisMax) !== 'undefined') {
            calculations.yAxisMax = config.yAxisMax;
        } else if (yAxisMax == Number.MIN_VALUE) {
            calculations.yAxisMax = 100;
        } else {
            calculations.yAxisMax = self.calculateYAxisCeiling(yAxisMax);
        }

        if (typeof(config.yAxisMin) !== 'undefined') {
            calculations.yAxisMin = config.yAxisMin;
        } else if (yAxisMin == Number.MAX_VALUE) {
            calculations.yAxisMin = 0;
        } else {
            calculations.yAxisMin = yAxisMin;
        }

        calculations.xStep = (calculations.graphArea.right - calculations.graphArea.left) / data.labels.length;
    };

    //
    // Draws the x-axis, y-axis, and labels
    //
    self.drawAxes = function (data) {
        var config = self.config;
        var calculations = self.calculations;
        var ctx = config.context;
        var g = calculations.graphArea;

        ctx.translate(0.5, 0.5);
        ctx.lineWidth = config.axisLineWidth;
        ctx.strokeStyle = config.axisLineColor;
        ctx.fillStyle = config.axisTextColor;

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'end';

        var yStep = (g.bottom - g.top) / config.yAxisSteps;

        for (var i = 0; i <= config.yAxisSteps; i++) {
            var x = g.left;
            var y = g.top + (i * yStep);
            var range = calculations.yAxisMax - calculations.yAxisMin;
            var v = calculations.yAxisMax - (i / config.yAxisSteps) * range;
            var t = config.yAxisFormatter(v, calculations.yAxisMax);

            if (config.yAxisStepLineColor) {
                ctx.strokeStyle = config.yAxisStepLineColor;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(g.right, y);
                ctx.stroke();
            }

            ctx.strokeStyle = config.axisLineColor;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 5, y);
            ctx.stroke();

            ctx.fillText(t, x - 8, y);
        }

        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';

        for (var i = 0; i < data.labels.length; i++) {
            var x = Math.round(g.left + (calculations.xStep * i));
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

        ctx.beginPath();
        ctx.moveTo(g.left, g.top);
        ctx.lineTo(g.left, g.bottom);
        ctx.lineTo(g.right, g.bottom);
        ctx.stroke();

        ctx.translate(-0.5, -0.5);
    };

    //
    // Draws a line showing values for each dataset
    //
    self.drawDatasets = function (data) {
        var config = self.config;
        var calculations = self.calculations;
        var ctx = config.context;
        var g = calculations.graphArea;
        var height = g.bottom - g.top;

        data.datasets.forEach(function (dataset) {
            var pointSize = config.datasetPointSizePicker(dataset);
            var lastX;
            var lastY;

            ctx.lineWidth = config.datasetLineWidth;
            ctx.strokeStyle = config.datasetColorPicker(dataset);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();

            dataset.data.forEach(function (val, i) {
                var ratio = (val - config.yAxisMin) / (calculations.yAxisMax - config.yAxisMin);
                var x = Math.round(g.left + (i * calculations.xStep));
                var y = Math.round(g.bottom - (height * ratio));

                if (i == 0) {
                    ctx.moveTo(x, y);
                } else {
                    if (self.config.smooth) {
                        var deltaX = x - lastX;
                        var deltaY = y - lastY;
                        var midpointX = Math.round(lastX + (deltaX / 2));
                        var midpointY = Math.round(lastY + (deltaY / 2));

                        ctx.quadraticCurveTo(lastX + Math.round(deltaX / self.config.tension), lastY, midpointX, midpointY);
                        ctx.quadraticCurveTo(x - Math.round(deltaX / self.config.tension), y, x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                if (pointSize) {
                    ctx.fillRect(x - pointSize / 2, y - pointSize / 2, pointSize, pointSize);
                }

                lastX = x;
                lastY = y;
            });

            ctx.stroke();
        });
    };

    //
    // Scales the canvas for retina devices
    //
    self.scaleForRetina = function () {
        var ctx = self.config.context;

        if (window.devicePixelRatio) {
            var width = ctx.canvas.width;
            var height = ctx.canvas.height;

            if (!ctx.canvas.scaled) {
                ctx.canvas.height = height * window.devicePixelRatio;
                ctx.canvas.width = width * window.devicePixelRatio;
                ctx.canvas.style.width = width + "px";
                ctx.canvas.style.height = height + "px";
                ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                ctx.canvas.scaled = "true";
            }
        }
    };

    //
    // Clears the canvas
    //
    self.clear = function () {
        self.config.context.clearRect(0, 0, self.config.canvas.width, self.config.canvas.height);
    };


    //
    // Calculates the graph ceiling for the y-axis (allowing for a nice round
    // number as the maximum)
    //
    self.calculateYAxisCeiling = function (value) {
        var steps = self.config.yAxisSteps;
        var magnitude = Math.floor(Math.log(value) / Math.LN10);
        var multiplier = Math.pow(10, magnitude);
        var relative = value / multiplier;

        if (relative < 2) {
            return 2 * multiplier;
        } else if (relative < 3) {
            return 3 * multiplier;
        } else if (relative < 5) {
            return 5 * multiplier;
        } else {
            return 10 * multiplier;
        }
    };

    //
    // Validates the chart data has the bare minimum
    //
    self.validateData = function (data) {
        if (!data) {
            throw new Error("data is required");
        } else if (!Array.isArray(data.labels)) {
            throw new Error("data.labels must be an array");
        } else if (!Array.isArray(data.datasets)) {
            throw new Error("data.datasets must be an array");
        }
    };

    //
    // Default x-axis formatter that returns the literal value
    //
    self.defaultXAxisFormatter = function (val) {
        return val;
    };

    //
    // Default y-axis formatter that shows a reasonable amount of precision
    //
    self.defaultYAxisFormatter = function (value, max) {
        if (value == 0) {
            return "";
        } else if (max <= 0.1) {
            return value.toFixed(3);
        } else if (max <= 1) {
            return value.toFixed(1);
        } else if (max <= 10) {
            return value.toFixed(1);
        } else {
            return value.toFixed(0);
        }
    };

    //
    // Default dataset color picker that picks a random color per dataset
    //
    self.defaultColorPicker = function (dataset) {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
    };

    //
    // Default dataset point size picker that returns 0 (no points shown)
    //
    self.defaultPointSizePicker = function (dataset) {
        return 0;
    };

    self.initialize(config);
}
