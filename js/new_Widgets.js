/*

NODES
	height
	
PERIMETER
	path
	realcoord (formed with borders)
	triangles
	projectivity
	
HULL
	triangles
	solids
	
GRAPH
	nodes
	connectivity
	node perimeters
	
*/

var PRIM_NODE = function(position){
	this.position = position
}

var PRIM_PERIMETER = function(){
	
}

var PRIM_BAND = function(pA,pB,pE,pH){
	this.A = pA
	this.B = pB
	this.E = pE
	this.H = pH
	this.cut = function(pA,pB,pE,pH){
		if(pA>=this.B){return [this]}
		if(pB<=this.A){return [this]}
		if(pE>=this.H){return [this]}
		if(pH<=this.E){return [this]}
		//there is an intersection!
		var product = []
		if(pA>this.A){
			//left piece
			product.push(new PRIM_BAND(this.A,pA,Math.max(this.E,pE),Math.min(this.H,pH)))
			console.log("LEFT PIECE")
			console.log(product[product.length-1])
		}
		if(pB<this.B){
			//right piece
			product.push(new PRIM_BAND(pB,this.B,Math.max(this.E,pE),Math.min(this.H,pH)))
			console.log("RIGHT PIECE")
			console.log(product[product.length-1])
		}
		if(pE>this.E){
			//bottom piece
			product.push(new PRIM_BAND(this.A,this.B,this.E,pE))
			console.log("BOTTOM PIECE")
			console.log(product[product.length-1])
		}
		if(pH<this.H){
			//top piece
			product.push(new PRIM_BAND(this.A,this.B,pH,this.H))
			console.log("TOP PIECE")
			console.log(product[product.length-1])
		}
		return product
	}
}

var PRIM_WALL = function(inworld,outworld,elevation,height){
	this.elevation = elevation
	this.material = OUTERWALL_MATERIAL
	this.height = height
	this.inworld = inworld
	this.outworld = outworld
	this.bands = [new PRIM_BAND(0,1,elevation,height)]
	this.addPortal = function(ins, outs, pE, pH){
		ins[0].y = 0
		ins[1].y = 0
		outs[0].y = 0
		outs[1].y = 0
		//find where ins/outs belong
		//shift inworld/outworld with new ins/outs
		var mark = 0
		var marked = []
		console.log(inworld)
		for(var ii=1;ii<this.inworld.length;ii++){
			if(ins[mark].distanceTo(this.inworld[0])<this.inworld[ii].distanceTo(this.inworld[0])){
				//this is the first insert
				this.inworld.splice(ii,0,ins[mark])
				this.outworld.splice(ii,0,outs[mark])
				for(var jj=0;jj<this.bands.length;jj++){
					if(this.bands[jj].A>=ii){
						this.bands[jj].A++
					}
					if(this.bands[jj].B>=ii){
						this.bands[jj].B++
					}
				}
				marked.push(ii)
				mark++
				console.log(inworld)
			}
			if(mark==2){break}
		}
		console.log(marked)
		//now cut the bands around it
		var IL = this.bands.length
		for(var ii=0;ii<IL;ii++){
			this.bands = this.bands.concat(this.bands[0].cut(marked[0],marked[1],pE,pH))
			this.bands.splice(0,1)
		}
	}
	this.normal = function(){
		var norm = this.inworld[0].clone().sub(this.inworld[this.inworld.length-1])
		norm.y = 0
		var ox = norm.x
		norm.x = -norm.z
		norm.z = ox
		norm.normalize()
		return norm
	}
	this.genMesh = function(){
		var product = []
		for(var ii=0;ii<this.bands.length;ii++){
			var geo = new THREE.Geometry()
			geo.vertices.push(
				new THREE.Vector3(0,this.bands[ii].H,0).add(this.inworld[this.bands[ii].A]),
				new THREE.Vector3(0,this.bands[ii].E,0).add(this.inworld[this.bands[ii].A]),
				new THREE.Vector3(0,this.bands[ii].E,0).add(this.inworld[this.bands[ii].B]),
				new THREE.Vector3(0,this.bands[ii].H,0).add(this.inworld[this.bands[ii].B])
			)
			geo.faces.push(
				new THREE.Face3(0,1,3),
				new THREE.Face3(3,1,2)
			)
			product.push(geo)
		}
		return product
	}
	this.exportVMF = function(){
		var worldObjects = []
		for(var ii=0;ii<this.bands.length;ii++){
			var product = new PRIM_SOLID()
			product.vertices.push(
				new THREE.Vector3(0,this.bands[ii].H,0).add(this.inworld[this.bands[ii].A]),
				new THREE.Vector3(0,this.bands[ii].E,0).add(this.inworld[this.bands[ii].A]),
				new THREE.Vector3(0,this.bands[ii].E,0).add(this.inworld[this.bands[ii].B]),
				new THREE.Vector3(0,this.bands[ii].H,0).add(this.inworld[this.bands[ii].B]),

				new THREE.Vector3(0,this.bands[ii].H,0).add(this.outworld[this.bands[ii].A]),
				new THREE.Vector3(0,this.bands[ii].E,0).add(this.outworld[this.bands[ii].A]),
				new THREE.Vector3(0,this.bands[ii].E,0).add(this.outworld[this.bands[ii].B]),
				new THREE.Vector3(0,this.bands[ii].H,0).add(this.outworld[this.bands[ii].B])
			)
			product.sides.push(
				[2,1,0],
				[6,2,3],
				[5,6,7],
				[1,5,4],
				[1,2,6],
				[4,7,3]
			)
			worldObjects.push(product)
		}
		return worldObjects
	}
	//surfaces
	//portals
	//regions
	
}

var PRIM_SOLID = function(){
	this.vertices = []
	this.sides = []
	this.genSideText = function(id,side){
		var uAxis = this.vertices[this.sides[side][1]].clone().sub(this.vertices[this.sides[side][0]])
		var vAxis = this.vertices[this.sides[side][1]].clone().sub(this.vertices[this.sides[side][2]])
		uAxis.normalize()
		vAxis.normalize()
		console.log(uAxis)
		if(vAxis.y==0){
			uAxis.set(1,0,0)
			vAxis.set(0,0,1)
		}else{
			uAxis.y*=-1
		}

		var total = '		side\n\
		{\n\
			"id" "'+(id++)+'"\n\
			"plane" "('+
				this.vertices[this.sides[side][2]].x+' '+
				this.vertices[this.sides[side][2]].z+' '+
				this.vertices[this.sides[side][2]].y+') ('+
				this.vertices[this.sides[side][1]].x+' '+
				this.vertices[this.sides[side][1]].z+' '+
				this.vertices[this.sides[side][1]].y+') ('+
				this.vertices[this.sides[side][0]].x+' '+
				this.vertices[this.sides[side][0]].z+' '+
				this.vertices[this.sides[side][0]].y+')"\n\
			"material" "DEV/REFLECTIVITY_10"\n\
			"uaxis" "['+
				uAxis.x+' '+
				uAxis.z+' '+
				uAxis.y+' 0] 0.25"\n\
			"vaxis" "['+
				vAxis.x+' '+
				vAxis.z+' '+
				vAxis.y+' 0] 0.25"\n\
			"rotation" "0"\n\
			"lightmapsscale" "16"\n\
			"smoothing_groups" "0"\n\
		}\n'
		return [total,id]
	}
	this.genText = function(id){
		var total = '	solid \n\
	{\n\
		"id" "'+(id++)+'"\n'
		for(var ii=0;ii<this.sides.length;ii++){
			var product = this.genSideText(id,ii)
			total+=product[0]
			id = product[1]
		}
		total+='		editor\n\
		{\n\
			"color" "0 236 181"\n\
			"visgroupshown" "1"\n\
			"visgroupautoshown" "1"\n\
		}\n\
	}\n'

		return [total,id]
	}
}