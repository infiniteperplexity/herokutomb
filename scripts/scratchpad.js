function GreuterGenerator(x,y,n,table) {
	// convex vertices that can spawn new shapes
	this.vertices = [];
	// all squares visited by this Greuter generation process
	this.used = {};
	// list of shapes generated by this Greuter process
	this.shapes = [];
	// frequency table of Greuter shapes
	this.table = table;
}
GreuterGenerator.prototype.getVertex = function() {
	HTomb.Utils.shuffle(this.vertices);
	return this.vertices.pop();
}
GreuterGenerator.prototype.spawn = function(x,y,n,padding) {
	// not sure how to propagate this
	padding = padding || 10;
	// choose how many shapes to spawn
	n = n || HTomb.Utils.dice(2,4)-1;
	let _recurse = function(x,y) {
		// pick a new shape from the frequency table
		let shape = new (this.table.roll())(this);
		// generate the shape centered around x,y
		shape.generate(x,y,this);
		// decrement and re-run
		if (n>0) {
			n-=1;
			// grab a random vertex
			let v = this.getVertex();
			_recurse(v[0],v[1]);
		}
	};
	// kick off recursive generation
	_recurse(x,y);
	// reset the vertices list
	this.vertices = [];
};
GreuterGenerator.prototype.resolve() {
	this.resolved = {};
	this.shapes.sort(function(a,b){
		if (a.zindex<b.zindex) {
			return +1;
		} else if (a.zindex>b.zindex) {
			return -1;
		} else {
			return 0;
		}
		});
	});
	for (let i=0; i<this.shapes.length; i++) {
		this.shapes[i].resolve(this);
	}
}

function GreuterShape(gen) {
	gen.shapes.push(this);
	this.id = gen.shapes.length;
}
GreuterShape.prototype.generate = function(x0,y0,gen) {
	this.zindex = 0;
	this.graves = [];
	this.walls = [];
	for (let x=0; x<w; x++) {
		for (let y=0; y<h; y++) {
			let x1 = x-w/2;
			let y1 = y-h/2;
			let z = HTomb.Tiles.groundLevel(x1,y1);
			if (x1%2===0 || y1%2===0) {
				if (x1>0 && x1<LEVELW-1 && y1>0 && y1<LEVELH-1) {
					this.graves.push([x1,y1,z]);
					if (x===0 || x===w-1 || y===0 || y===h-1) {
						this.walls.push([x1,y1,z]);
					}
				}
			}
			if ((x===0 || x===w-1) && (y===0 || y===h-1)) {
				if (gen.used[coord(x1,y1,z)]===undefined) {
					gen.vertices.push([x1,y1]);
				}
			}
			gen.used[coord(x1,y1)] = this.id;
		}
	}
};
GreuterShape.prototype.resolve = function(gen) {
	for (let i=0; i<this.graves.length; i++) {
		let g = this.graves[i];
		if (gen.resolved[coord(g[0],g[1],g[2])]===undefined) {
			HTomb.Things.Grave().place(g[0],g[1],g[2]);
			gen.resolved[coord(g[0],g[1],g[2])] = this.id;
		}
	}
	for (let i=0; i<this.walls.length; i++) {
		let w = this.walls[i];
		if (gen.resolved[coord(w[0],w[1],w[2])]===undefined) {
			HTomb.World.tiles[w[2]][w[0]][w[1]] = HTomb.Tiles.UpSlopeTile;
			HTomb.World.tiles[w[2]+1][w[0]][w[1]] = HTomb.Tiles.DownSlopeTile;
			gen.resolved[coord(w[0],w[1],w[2])] = this.id;
		}
	}
};





function buildGraveyard(x,y) {
	// how many modules are we placing
	let units = HTomb.Utils.dice(2,4)-1;
	let vertices = [];
	let used = {};
	let edges = {};

	let vertices = [];
	let weights = [rectangleGraves];
	function _recurse(x,y) {
		if (units<=0) {
			return;
		}
		let r = Math.floor(Math.random()*weights.length);
		let v = weights[r](x,y);
		vertices = vertices.concat(v);
		HTomb.Utils.shuffle(vertices);
		let p = vertices.unshift();
		let wh = Math.floor(HTomb.Utils.dice(2,4))/2)
		_recurse(p[0],p[1],HTomb.Utils.dice(2,4)+3,HTomb.Utils.dice(2,4)+3);
	}
	units-=1;
	_recurse(x,y);
}

function _rect(x0,y0,w,h) {
	let obj = {};
	obj.edges = {};
	obj.used = {};
	obj.id = 1;
	obj.zindex = 0;
	obj.graves = {};
	for (let x=0; x<w; x++) {
		for (let y=0; y<h; y++) {
			let x1 = x-w/2;
			let y1 = y-h/2;
			let z = HTomb.Tiles.groundLevel(x1,y1);
			obj.used[coord(x1,y1,z)] = true;
			if (x1%2===0 || y1%2===0) {
				if (x1>0 && x1<LEVELW-1 && y1>0 && y1<LEVELH-1) {
					obj.graves[coord(x1,y1,z)] = true;
					if (x===0 || x===w-1 || y===0 || y===h-1) {
						obj.edges[coord(x1,y1,z)] = true;
					}
				}
			}
		}
	}
	objects.push(obj);
	_rect()
}
/*
more possibilities...
	- diamond shape
	- rows of graves
	- columns of graves
	- checkerboard graves
	- rectangular spiral (what function?  not either or...we could do it the similar way)
	- we'll just stick with these two for now
*/

function rectangleGraves(x0, y0, w, h) {
	for (let x=0; x<w; x++) {
		for (let y=0; y<h; y++) {
			let x1 = x-w/2;
			let y1 = y-h/2;
			let z = HTomb.Tiles.groundLevel(x1,y1);
			if (x1%2===0 || y1%2===0) {
				if (x1>0 && x1<LEVELW-1 && y1>0 && y1<LEVELH-1) {
					// should be a placegrave function....
					HTomb.Things.Tombstone().place(x1,y1,z);
				}
			}
		}
	}
	let vertices = [];
	if (x0+w/2<LEVELW-1) {
		if (y0+h/2<LEVELH-1) {
			vertices.push([x0+w/2,y0+h/2]);
		}
		if (y0-h/2>0) {
			vertices.push([x0+w/2,y0-h/2]);
		}
	}
	if (x0-w/2>0) {
		if (y0+h/2<LEVELH-1) {
			vertices.push([x0-w/2,y0+h/2]);
		}
		if (y0-h/2>0) {
			vertices.push([x0-w/2,y0-h/2]);
		}
	}
}

function circularGraves(x0, y0, r) {
	for (let i=0; i<r; i++) {
		let ring = HTomb.Path.concentric[i];
		for (let j=0; j<ring.length; j++) {
			let x = ring[j][0]+x0;
			let y = ring[j][1]+y0;
			let z = HTomb.Tiles.groundLevel(x,y);
			if (i%2===0) {
				if (x>0 && x<LEVELW-1 && y>0 && y<LEVELH-1) {
					HTomb.Things.Tombstone.place(x,y,z);
				}
			}
		}
	}
}

function FreqTable(args) {
	var container = Object.create(Array.prototype);
	for (var method in ItemContainer.prototype) {
		if (ItemContainer.prototype.hasOwnProperty(method)) {
			container[method] = ItemContainer.prototype[method];
		}
	}
	if (Array.isArray(args)) {
		for (var i=0; i<args.length; i++) {
			container.push(args[i]);
		}
	}
	return container;
}
HTomb.Utils.FreqTable = FreqTable;
FreqTable.prototype = {
	push: function(thing,n) {
		if (n) {
			thing = [n, thing];
		}
		Array.prototype.push.call(this,thing);
	},
	roll: function(callb) {
		callb = callb || function() {return true;};
		var cumulative = 0;
		var table = [];
		for (var k=0; k<this.length; k++) {
			if (callb(this[k][1])) {
				table.push(this[k]);
			}
		}
		if (table.length===0) {
			return;
		}
		for (var i=0; i<table.length; i++) {
			cumulative+=table[i][0];
		}
		var roll = Math.random()*cumulative;
		cumulative = 0;
		for (var j=0; table.length; j++) {
			cumulative+=table[j][0];
			if (roll<cumulative) {
				return table[j][1];
			}
		}
	}
};

/*
so...placegrave could be a grave, or a statue, or an empty space,
or a shrub...but let's not do that for now...or a pool, or a crypt.

*/