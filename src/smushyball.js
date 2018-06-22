(function() {

var resolution		= 1000;
var deformFactor	= 1000;
var healFactor		= 10;
var surfaceFactor	= 20;

function SmushyBall()
{
	try
	{
		this.debug = {
			on: true,
			dt_log: [],
			dt_log_limit: 100,
			framerate: '-'
		};

		this.last_update = new Date().getTime();

		// init
		this.initCanvas();
		this.initPoints();

		// loop
		this.loop();
	}
	catch (e)
	{
		console.error('SmushyBall Error:', e);
	}
}

SmushyBall.prototype.debugUpdate = function(dt)
{
	var debug = this.debug;
	if (!debug.on)
		{ return; }

	debug.dt_log.push(dt);
	if (debug.dt_log.length >= debug.dt_log_limit)
	{
		var sum = 0;
		var l = debug.dt_log.length;
		for (var i = 0; i < l; i++)
		{
			sum += debug.dt_log[i];
		}
		debug.framerate = Math.round(l / sum);
		debug.dt_log = [];
	}
};

SmushyBall.prototype.debugDraw = function(dt)
{
	var debug = this.debug;
	if (!debug.on)
		{ return; }

	if (debug.framerate)
	{
		this.context.font = "20px Monospace";
		this.context.fillText(debug.framerate + ' fps',10,20);
	}
};

SmushyBall.prototype.initCanvas = function() {
	var _this = this;
	var canvas = document.getElementById('smushyball');
	if (!canvas)
		{ throw new Error('Canvas not found.'); }

	canvas.addEventListener('mousemove', function(e) {
		_this.mouseX = e.offsetX;
		_this.mouseY = e.offsetY;
	});

	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	this.canvas = canvas;
	this.context = canvas.getContext('2d');
};

SmushyBall.prototype.initPoints = function() {
	var w = this.canvas.width;
	var h = this.canvas.height;

	var center = {x: w/2, y: h/2};
	var radius = Math.min(w, h) / 5;
	var num = resolution;

	this.points = [];
	var dir, x, y, point, last;
	for (var i = 0; i < num; i++)
	{
		dir = i * 2*Math.PI / num;
		x = radius * Math.sin(dir) + center.x;
		y = radius * Math.cos(dir) + center.y;

		last = point;
		point = new SmushyBall.Point(x, y);
		if (last)
			{ last._next = point; }
		point._last = last;
		this.points.push(point);
	}
	this.points[0]._last = point;
	point._next = this.points[0];
};

SmushyBall.prototype.loop = function() {
	var dt = (new Date().getTime() - this.last_update) / 1000;

	this.update(dt);
	this.draw();
	this.last_update = new Date().getTime();

	var _this = this;
	setTimeout(function() {
		_this.loop.apply(_this);
	}, 0);
};

SmushyBall.prototype.update = function(dt)
{
	if (!this.mouseX || !this.mouseY)
		{ return; }

	var mouseX = this.mouseX,
		mouseY = this.mouseY;

	if (this.points.length > 0)
	{
		var point;
		for (var i = 0, l = this.points.length; i < l; i++)
		{
			point = this.points[i];

			point.surfaceTension(dt);
			point.deform(dt, mouseX, mouseY);
			point.heal(dt);
		}
	}

	this.debugUpdate(dt);
}

SmushyBall.prototype.draw = function()
{
	var canvas = this.canvas;
	var ctx = this.context;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#bd7e00';
	ctx.strokeStyle = '#ffff00';
	ctx.lineWidth = 2;

	ctx.beginPath();

	if (this.points.length > 0)
	{
		var point, last, next;
		for (var i = 0, l = this.points.length; i <= l; i++)
		{
			point = this.points[i % l];

			if (i === 0)
				ctx.moveTo(point.x, point.y);
			else
				ctx.lineTo(point.x, point.y);
		}
	}
	ctx.fill();
	ctx.stroke();

	this.debugDraw();
};


SmushyBall.Point = function(x, y) {
	this.x = x;
	this.y = y;
	this.anchor = {
		x: x,
		y: y
	};
};
SmushyBall.Point.prototype.set = function(property, value)
{
	if (!property)
		{ return console.error('SmushyBall.Point.set(): bad property - '+property); }
	if (!value)
		{ return console.error('SmushyBall.Point.set(): bad value - '+value); }
	this[property] = value;
};

SmushyBall.Point.prototype.back = function(steps)
{
	steps = steps || 1;

	var ref = this;
	for (var i = 0; i < steps; i++)
	{
		ref = ref._last;
	}

	return ref;
};
SmushyBall.Point.prototype.forward = function(steps)
{
	steps = steps || 1;

	var ref = this;
	for (var i = 0; i < steps; i++)
	{
		ref = ref._next;
	}

	return ref;
};

/**
 * Distort point with mouse interaction.
 * @param float dt Delta Time
 * @param int mouseX Mouse X position
 * @param int mouseY Mouse Y position
 */
SmushyBall.Point.prototype.deform = function(dt, mouseX, mouseY)
{
	if (!mouseX || !mouseY)
		{ return; }

	var xdiff, ydiff, dir, dist, power, deformX, deformY;

	xdiff = Math.floor(mouseX - this.x);
	ydiff = Math.floor(mouseY - this.y);
	dir = Math.atan2(ydiff, xdiff);
	dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff);

	power = deformFactor / dist*dist;

	deformX = dt * power * Math.cos(dir);
	deformY = dt * power * Math.sin(dir);

	if (isNaN(deformX) || isNaN(deformY))
	{
		return;
	}

	this.x -= deformX;
	this.y -= deformY;
};

/**
 * Make point return to its anchor.
 * @param float dt Delta Time
 */
SmushyBall.Point.prototype.heal = function(dt)
{
	var xdiff, ydiff, dir, dist, power;

	xdiff = Math.floor(this.anchor.x - this.x);
	ydiff = Math.floor(this.anchor.y - this.y);
	dir = Math.atan2(ydiff, xdiff);
	dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff);

	power = healFactor * dist;

	deformX = dt * power * Math.cos(dir);
	deformY = dt * power * Math.sin(dir);

	if (isNaN(deformX) || isNaN(deformY))
	{
		return;
	}

	this.x += deformX;
	this.y += deformY;
};

/**
 * Make point resist being pulled from its neighbors
 * @param float dt Delta Time
 */
SmushyBall.Point.prototype.surfaceTension = function(dt)
{
	var power = surfaceFactor;

	var points = [];
	points.push(this.back());
	points.push(this.forward());

	var p, xdiff, ydiff, dir, dist, deformX, deformY;
	for (var i in points)
	{
		p = points[i];
		xdiff = Math.floor(this.x - p.x);
		ydiff = Math.floor(this.y - p.y);
		dir = Math.atan2(ydiff, xdiff);
		dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff);

		deformX = dt * power * dist * Math.cos(dir);
		deformY = dt * power * dist * Math.sin(dir);

		if (isNaN(deformX) || isNaN(deformY))
		{
			continue;
		}

		this.x -= deformX;
		this.y -= deformY;
	}
};

window.smushyBall = new SmushyBall();

})();
