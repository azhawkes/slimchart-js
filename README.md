# slimchart-js
This is a library for fast and simple JavaScript line charts for HTML/Canvas.

It doesn't do animations.

It doesn't do other types of charts... just line charts.

It doesn't support fancy popups when you hover.

It is just fast and simple.

I wrote this because (surprisingly) I couldn't find a great open source chart library that fit the bill. There are many beautiful charting libraries, but all the ones I tried had performance issues after more than a few thousand datapoints. 

## Examples

Take a look at [example.html](example.html) if you're interested.

## Usage

```javascript

var config = {
    canvas: document.getElementById('myCanvas')
 };

var data = {
    labels: ["Jan", "Feb", "Mar"],
    datasets: [
        {
            data: [3.5, 12.2, 6.8]
        },
        {
            data: [5.4, 9.9, 4.6]
        }
    ]
};

new SlimChart(config).draw(data);

```

There are a number of custom options you can pass in the ```config``` object:

* **canvas** - An HTML Canvas element. This is required since that's where the chart will be drawn.
* **axisLineWidth** - How fat (in pixels) the X axis and Y axis lines should be.
* **axisLineColor** - The axis line color (default is #000000).
* **axisTextColor** - The axis text color (default is #000000).
* **xAxisFormatter** - A JavaScript function to format labels on the X axis, if you want to. This is useful for number formats or for hiding values that make the axis too noisy.
* **yAxisFormatter** - A JavaScript function to format labels on the Y axis (see above).
* **yAxisMin** - The minimum value for the Y axis. If not passed, it will be calculated.
* **yAxisMax** - The maximum value for the X axis. If not passed, it will be calculated.
* **yAxisSteps** - The number of step lines to show on the Y axis (the default is 5).
* **datasetLineWidth** - The width of the plotted line for each dataset.
* **datasetColorPicker** - A JavaScript function to let you assign colors for each data set. The default is to pick a random color.
