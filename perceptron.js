var svg = document.querySelector('svg');

function createSvgElement(nodeName, attributes) {
	var el = document.createElementNS('http://www.w3.org/2000/svg', nodeName);
	for (var i in attributes)
		if (i.indexOf(',') != -1) {
			var ns = i.split(',');
			el.setAttributeNS(ns[0], ns[1], attributes[i]);
		} 
		else
			el.setAttribute(i, attributes[i]);
	return el;
}

function getCursorPoint(e) {
	var pt = svg.createSVGPoint();
	pt.x = e.clientX;
	pt.y = e.clientY;
    return pt.matrixTransform(svg.getElementById('inputs').getScreenCTM().inverse());
}

var TIME = 1500;
var RATE = 0.25;
var current = -1;
var bias = 0;
var wx = 0;
var wy = 0;
var inputs = [];

document.getElementById('plane').style.WebkitTransition = '-webkit-transform ' + TIME / 3 + 'ms ease-in-out';
svg.onmousedown = function (e) {
	var pt = getCursorPoint(e);
	addInput(pt.x, pt.y, e.button != 2);
	return false;
};

var rwx = Math.random() - 0.5;
var rwy = Math.random() - 0.5;
var bias = Math.random() - 0.5;
for (var i = 0; i < 60; i++) {
	var x = 2 * (Math.random() - 0.5) * 450;
	var y = 2 * (Math.random() - 0.5) * 300;
	addInput(x, y, rwx * x + rwy * y > bias * 100);
}

function addInput(x, y, desired) {
	var el = createSvgElement('use', {
		'x': x,
		'y': y,
		'http://www.w3.org/1999/xlink,href': '#input' + (desired ? 1 : 0)
	});
	
	inputs.push({
		'x': x, 
		'y': y, 
		'el': el,
		'desired': desired ? 1 : 0
	});
	
	svg.getElementById('inputs').appendChild(el);
}

(function train() {
	if (!inputs.length) {
		setTimeout(train, TIME / 2);
		return;
	}
		
	// Select the next point and calculate the perceptron's value.
	var input = inputs[current = (current + 1) % inputs.length];
	var result = wx * input.x + wy * input.y + bias > 0 ? 1 : 0;
	console.log(current, 'actual', result, 'desired', input.desired, 'bias', bias, 'score', wx * input.x + wy * input.y + bias);
	
	if (input.desired != result) {
		input.el.style.filter = 'url(#selected)';
		document.getElementById('band').style.stroke = input.desired ? '#0f0' : '#f00';
		document.getElementById('band').setAttribute('x1', wx);
		document.getElementById('band').setAttribute('y1', wy);
		document.getElementById('band').setAttribute('x2', input.x);
		document.getElementById('band').setAttribute('y2', input.y);
		
		bias += RATE * (input.desired - result) * 100;
		wx += RATE * (input.desired - result) * input.x;
		wy += RATE * (input.desired - result) * input.y;
		
		setTimeout(function () {
			input.el.style.filter = '';
			document.getElementById('band').setAttribute('x1', 0);
			document.getElementById('band').setAttribute('y1', 0);
			document.getElementById('band').setAttribute('x2', 0);
			document.getElementById('band').setAttribute('y2', 0);
		
			// Update the plane.
			var length = Math.sqrt(wx * wx + wy * wy);
			document.getElementById('plane').style.WebkitTransform = 'rotate(' + Math.atan2(wy, wx) + 'rad)';
			document.getElementById('normal').setAttribute('x2', length);
			document.getElementById('arrowhead').setAttribute('points', (length-15) + ',7 ' + length + ',0 ' + (length-15)+',-7');
		}, TIME / 3);
		
		setTimeout(train, TIME);
	}
	
	else
		setTimeout(train, TIME / 30);
}());