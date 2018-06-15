define(function() {

var resolution	= 1000;
var hurtFactor	= 2000;
var healFactor	= 20;

function SmushyBall()
{
	try
	{
		this.debug = {
			dt_log: [],
			dt_log_limit: 20,
			framerate: null
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
	var radius = Math.min(w, h) / 4;
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
	this.debug.dt_log.push(dt);
	if (this.debug.dt_log.length >= this.debug.dt_log_limit)
	{
		var sum = 0;
		var l = this.debug.dt_log.length;
		for (var i = 0; i < l; i++)
		{
			sum += this.debug.dt_log[i];
		}
		this.debug.framerate = l / sum;
		this.debug.dt_log = [];
		console.log(this.debug.framerate + ' fps');
	}

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

			point.hurt(dt, mouseX, mouseY);
			point.heal(dt);
		}
	}
}

SmushyBall.prototype.draw = function()
{
	var canvas = this.canvas;
	var ctx = this.context;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#660000';
	ctx.strokeStyle = '#ff0000';

	ctx.beginPath();

	if (this.points.length > 0)
	{
		var point, last, next;
		var xdiff, ydiff, dist1, dist2, dir1, dir2;
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
};

SmushyBall.Point = function(x, y) {
	this.x = x;
	this.y = y;
	this.anchor = {
		x: x,
		y: y
	};
};
SmushyBall.Point.prototype.hurt = function(dt, mouseX, mouseY)
{
	if (!mouseX || !mouseY)
		{ return; }

	var xdiff, ydiff, dir, dist, power;

	xdiff = mouseX - this.x;
	ydiff = mouseY - this.y;
	dir = Math.atan2(ydiff, xdiff);
	dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff);

	power = hurtFactor / dist*dist;

	this.x -= dt * power * Math.cos(dir);
	this.y -= dt * power * Math.sin(dir);
};
SmushyBall.Point.prototype.heal = function(dt)
{
	var xdiff, ydiff, dir, dist, power;

	xdiff = this.anchor.x - this.x;
	ydiff = this.anchor.y - this.y;
	dir = Math.atan2(ydiff, xdiff);
	dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff);

	power = healFactor * dist;

	this.x += dt * power * Math.cos(dir);
	this.y += dt * power * Math.sin(dir);
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

return new SmushyBall();
});
