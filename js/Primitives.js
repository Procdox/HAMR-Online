function vector_To_Coord(vector){
	return {X:vector.x,Y:vector.z}
}

function vector_Array_To_Path(vector_array){
	var product = []

	for(var ii=0;ii<vector_array.length;ii++){
		product.push(vector_To_Coord(vector_array[ii]))
	}

	product = [product]

	if(!ClipperLib.Clipper.Orientation(product[0])){
		ClipperLib.Clipper.ReversePaths(product)
	}

	return product
}

function findAngle(x,z){
	if(x==0){
		if(z>0){
			return Math.PI/2
		}else{
			return 3*Math.PI/2
		}
	}
	var product = Math.atan(z/x)
	if(x>0){product+=Math.PI}
	if(product<0){product+=2*Math.PI}
	return product
}

function interp_Segment(f,w,v){
	return new THREE.Vector3(v.x + f * (w.x - v.x), 0, v.z + f * (w.z - v.z))
}

function proj_Segment(p, v, w) {
  var segment_length = v.distanceTo(w);
  if (segment_length == 0) return p.distanceTo(v);

  var t = ((p.x - v.x) * (w.x - v.x) + (p.z - v.z) * (w.z - v.z)) / segment_length;

  t = Math.max(0, Math.min(1, t));

  return interp_Segment(t,w,v)
}

function find_Skew_CD(lower_a,lower_b,upper_a,upper_b,target,accuraccy){
	var best = 0
	var best_distance = 9999

	if(lower_a.distanceTo(target)<10){
		return 0
	}
	if(lower_b.distanceTo(target)<10){
		return 0
	}
	if(upper_a.distanceTo(target)<10){
		return 1
	}
	if(upper_b.distanceTo(target)<10){
		return 1
	}


	var iter_width = 1/accuraccy

	for(var ii=0;ii<=accuraccy+1;ii++){
		var test_a = interp_Segment(iter_width*ii,upper_a,lower_a)
		var test_b = interp_Segment(iter_width*ii,upper_b,lower_b)
		var closest = proj_Segment(target,test_a,test_b)
		if(closest.distanceTo(target)<=best_distance){
			best = iter_width * ii
			best_distance = closest.distanceTo(target)
		}
	}
	console.log(best_distance)
	return best
}

var PRIM_SOLID = function(){
	this.vertices = []
	this.sides = []
	this.materials = []
	this.genSideText = function(id,side){
		var uAxis = this.vertices[this.sides[side][1]].clone().sub(this.vertices[this.sides[side][0]])
		var vAxis = this.vertices[this.sides[side][1]].clone().sub(this.vertices[this.sides[side][2]])
		uAxis.normalize()
		vAxis.normalize()
		var normy = uAxis.clone()
		normy.cross(vAxis)
		normy.normalize()

		if(Math.abs(normy.y)>.999){
			uAxis.set(-1,0,0)
			vAxis.set(0,0,1)
		}else if(Math.abs(normy.y)<.0001){
			uAxis.set(-normy.z,0,-normy.x)
			vAxis.set(0,-1,0)
		}else{
			console.log(normy)
			uAxis.y*=-1
		}

		var total = '		side\n\
		{\n\
			"id" "'+(id++)+'"\n\
			"plane" "('+
				-this.vertices[this.sides[side][0]].x+' '+
				this.vertices[this.sides[side][0]].z+' '+
				this.vertices[this.sides[side][0]].y+') ('+
				-this.vertices[this.sides[side][1]].x+' '+
				this.vertices[this.sides[side][1]].z+' '+
				this.vertices[this.sides[side][1]].y+') ('+
				-this.vertices[this.sides[side][2]].x+' '+
				this.vertices[this.sides[side][2]].z+' '+
				this.vertices[this.sides[side][2]].y+')"\n\
			"material" "'
		total += this.materials[side].export
		total += '"\n\
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
		}
		if(pB<this.B){
			//right piece
			product.push(new PRIM_BAND(pB,this.B,Math.max(this.E,pE),Math.min(this.H,pH)))
		}
		if(pE>this.E){
			//bottom piece
			product.push(new PRIM_BAND(this.A,this.B,this.E,pE))
		}
		if(pH<this.H){
			//top piece
			product.push(new PRIM_BAND(this.A,this.B,pH,this.H))
		}
		return product
	}
}

var PRIM_WALL = function(inworld,outworld,elevation,height){
	this.front_material = Mat_Blu_Wall
	this.edge_material = Mat_Blue_Floor
	this.back_material = Mat_Nodraw

	this.elevation = elevation
	//this.material = OUTERWALL_MATERIAL
	this.height = height
	this.inworld = []
	for(var ii=0;ii<inworld.length;ii++){
		this.inworld.push(inworld[ii].clone())
	}
	this.outworld = []
	for(var ii=0;ii<outworld.length;ii++){
		this.outworld.push(outworld[ii].clone())
	}
	this.bands = [new PRIM_BAND(0,1,elevation,height)]

	this.direction = this.outworld[1].clone().sub(this.outworld[0])
	this.direction.y = 0

	this.width = this.direction.length()
	this.normal = this.direction.clone()

	this.direction.normalize()

	var ox = this.normal.x
	this.normal.x = this.normal.z
	this.normal.z = - ox

	this.normal.normalize()

	this.addPortal = function(portal){
		var relative = portal.control.position.clone().sub(this.outworld[0])
		relative.y = 0
		if((portal.elevation-portal.framewidth >= this.height) || (portal.elevation + portal.height + portal.framewidth <= this.elevation)){ //portal interacts with this elevation
			return
		}
		if(relative.clone().normalize().dot(this.direction) <= .99){ //portal lies on line
			return
		}
		if(relative.dot(this.direction) >= this.width){ //portal is withing segment
			return
		}

		portal.normal = this.normal.clone()

		outs = [this.direction.clone().multiplyScalar(-(portal.width + portal.framewidth*2)/2).add(portal.control.position),
			this.direction.clone().multiplyScalar((portal.width + portal.framewidth*2)/2).add(portal.control.position)]

		var offset = this.normal.clone().multiplyScalar(8)

		ins = [outs[0].clone().add(offset),outs[1].clone().add(offset)]

		pE = portal.elevation - portal.framewidth
		pH = portal.elevation + portal.height + portal.framewidth

		ins[0].y = 0
		ins[1].y = 0
		outs[0].y = 0
		outs[1].y = 0

		//find where ins/outs belong
		//shift inworld/outworld with new ins/outs
		var mark = 0
		var marked = []
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
			}//deal with repeat points!!!
			if(mark==2){break}
		}
		//now cut the bands around it
		var IL = this.bands.length
		for(var ii=0;ii<IL;ii++){
			this.bands = this.bands.concat(this.bands[0].cut(marked[0],marked[1],pE,pH))
			this.bands.splice(0,1)
		}
	}
	this.genMesh = function(){
		for(var ii=0;ii<this.outworld.length;ii++){
			this.inworld[ii].y=0
		}
		for(var ii=0;ii<this.outworld.length;ii++){
			this.outworld[ii].y=0
		}

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
				new THREE.Face3(3,1,0),
				new THREE.Face3(2,1,3)
			)
			geo.computeFaceNormals()
			geo.computeVertexNormals()
			geo.computeMorphNormals()
			product.push(new THREE.Mesh(geo,this.front_material.editor))
		}
		return product
	}
	this.exportVMF = function(){
		for(var ii=0;ii<this.outworld.length;ii++){
			this.inworld[ii].y=0
		}
		for(var ii=0;ii<this.outworld.length;ii++){
			this.outworld[ii].y=0
		}
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
				[0,1,2],
				[3,2,6],
				[7,6,5],
				[4,5,1],
				[6,2,1],
				[3,7,4]
			)
			product.materials.push(
				this.front_material,
				this.edge_material,
				this.back_material,
				this.edge_material,
				this.edge_material,
				this.edge_material
			)
			worldObjects.push(product)
		}
		return worldObjects
	}
	//surfaces
	//portals
	//regions

}

var PRIM_SURFACE = function(border,normal){
	this.front_material = Mat_Blue_Floor
	this.edge_material = Mat_Blue_Floor
	this.back_material = Mat_Nodraw
	this.thickness = 8
	this.normal = normal

	this.quad = new THREE.Quaternion().setFromUnitVectors(this.normal,new THREE.Vector3(0,1,0))
	this.rot = findAngle(this.normal.x,this.normal.z)
	this.realCoords = [border.flatten()]
	this.project = function(product){
		for(var ii=0;ii<product.length;ii++){
			product[ii].applyQuaternion(this.quad)
			product[ii].applyAxisAngle(new THREE.Vector3(0,1,0),this.rot)
		}
		//verify offset!
		return product
	}
	var product = border.flatten()
	product = this.project(product)
	this.offset = product[0].y
	this.path = vector_Array_To_Path(product)
	if(!ClipperLib.Clipper.Orientation(this.path[0])){
		ClipperLib.Clipper.ReversePaths(this.path)
		this.realCoords[0].reverse()
	}
	this.subtract = function(border){
		var target = vector2path(this.project(border.flatten()))
		var tempCoords = border.flatten()

		var cpr = new ClipperLib.Clipper();
		cpr.StrictlySimple = true;
		if(!ClipperLib.Clipper.Orientation(target[0])){
			ClipperLib.Clipper.ReversePaths(target)
			tempCoords.reverse()
		}
		var solution_paths = new ClipperLib.Paths();


		cpr.AddPaths(this.path, ClipperLib.PolyType.ptSubject, true);
		cpr.AddPaths(target, ClipperLib.PolyType.ptClip, true);

		cpr.Execute(ClipperLib.ClipType.ctDifference, solution_paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
		ClipperLib.Clipper.CleanPolygons(solution_paths)
		var realCoords = []
		for(var ii=0;ii<solution_paths.length;ii++){
			var pathCoords = []
			for(var jj=0;jj<solution_paths[ii].length;jj++){
				for(var kk=0;kk<target[0].length;kk++){
					if(solution_paths[ii][jj].X == target[0][kk].X && solution_paths[ii][jj].Y == target[0][kk].Y){
						pathCoords.push(tempCoords[kk].clone())
						break
					}
				}
				if(pathCoords.length>jj){continue}
				for(var kk=0;kk<this.path.length;kk++){
					for(var ll=0;ll<this.path[kk].length;ll++){
						if(solution_paths[ii][jj].X == this.path[kk][ll].X && solution_paths[ii][jj].Y == this.path[kk][ll].Y){
							pathCoords.push(this.realCoords[kk][ll].clone())
							break
						}
					}
					if(pathCoords.length>jj){break}
				}
			}
			realCoords.push(pathCoords)
			if(pathCoords.length<solution_paths[ii].length){
				console.log("Could not find Vertices!")
				console.log(solution_paths, this.path, target)
			}
		}
		this.realCoords = realCoords
		this.path = solution_paths
	}
	this.simplify = function(){
		//this function can break, later add a check that verifies target insert edges do not cross other edges
		var pathed = []
		var postions = []

		for(var ii=0;ii<this.path[0].length;ii++){
			pathed.push(this.path[0][ii])
			postions.push(this.realCoords[0][ii])
		}

		var included = []
		for(var ii=1;ii<this.path.length;ii++){
			included.push(ii)
		}

		while(included.length>0){
			var min_score = 10000000, score
			var target_path = included[0]
			var target_index = 0
			var target_insert = 0
			for(var ii=0;ii<included.length;ii++){
				for(var jj=0;jj<this.path[included[ii]].length;jj++){
					for(var kk=0;kk<pathed.length;kk++){
						score = this.realCoords[included[ii]][jj].distanceTo(postions[kk])
						if(score<min_score){
							min_score = score
							target_path = included[ii]
							target_index = jj
							target_insert = kk
						}
					}
				}
			}
			var insert_path = []
			var insert_pos = []
			for(var ii=0;ii<this.path[target_path].length;ii++){
				var index = (ii+target_index)%(this.path[target_path].length)
				insert_path.push(this.path[target_path][index])
				insert_pos.push(this.realCoords[target_path][index])
			}
			insert_path.push(this.path[target_path][target_index])
			insert_pos.push(this.realCoords[target_path][target_index])
			insert_path.push(pathed[target_insert])
			insert_pos.push(postions[target_insert])

			insert_path.unshift(target_insert+1,0)
			insert_pos.unshift(target_insert+1,0)
			Array.prototype.splice.apply(pathed, insert_path);
			Array.prototype.splice.apply(postions, insert_pos);
			included.splice(included.indexOf(target_path),1)
		}


		for(var ii=0;ii<pathed.length;ii++){
			var temp = new THREE.Vector3(pathed[ii].X,0,pathed[ii].Y)
			pathed[ii] = temp
		}

		return [pathed,postions]
	}
	this.genMesh = function(){
		//start with just outer border
		var flat = this.simplify()
		var faces = decompose_Shape(flat[0])
		var geo = new THREE.Geometry()
		for(var ii=0;ii<faces.length;ii++){
			geo.faces.push(new THREE.Face3(faces[ii][0],faces[ii][1],faces[ii][2]))
		}
		geo.vertices = flat[1]
		geo.computeFaceNormals()
		geo.computeVertexNormals()
		geo.computeMorphNormals()
		return [new THREE.Mesh(geo,this.front_material.editor)]
	}
	this.display = function(){
		for(var ii=0;ii<this.path.length;ii++){
			var geometry = new THREE.Geometry()
			var v
			for(var jj=0;jj<this.path[ii].length;jj++){
				v = new THREE.Vector3(this.path[ii][jj].X,track,this.path[ii][jj].Y)
				geometry.vertices.push(v.clone())
			}
			v.add(new THREE.Vector3(0,5,0))
			geometry.vertices.push(v)
			//var line = new THREE.Line(geometry)
			//reality.add(line)
		}
		track += 20
	}
	this.findDivision = function(){
		var flat = this.simplify()
		var faces = decompose_Shape(flat[0])
		var shapes = merge_Tris(faces,flat[0])
		var reals = flat[1].slice(0)
		var finals = shapes.slice(0)
		for(var ii=0;ii<flat.length;ii++){
			flat[0].push(flat[0].splice(0,1)[0])
			flat[1].push(flat[1].splice(0,1)[0])
			faces = decompose_Shape(flat[0])
			shapes = merge_Tris(faces,flat[0])
			if(shapes.length<finals.length){
				reals = flat[1].slice(0)
				finals = shapes.slice(0)
			}
		}
		return [reals,finals]
	}
	this.exportVMF = function(){
		var worldObjects = []

		var splits = this.findDivision()
		var reals = splits[0]
		var shapes = splits[1]

		for(var ii=0;ii<shapes.length;ii++){
			var product = new PRIM_SOLID()

			var upper = []
			var lower = []

			for(var jj=0;jj<shapes[ii].length;jj++){
				product.vertices.push(
					reals[shapes[ii][jj]].clone().sub(this.normal.clone().multiplyScalar(-this.thickness)),
					reals[shapes[ii][jj]].clone()
				)
				var A = 2*jj + 1
				var B = 2*jj
				var C = (2*jj + 2) % (2 * shapes[ii].length)
				product.sides.push([C,B,A])
				upper.push(A)
				lower.push(B)
				product.materials.push(this.edge_material)
			}
			upper.reverse()
			product.sides.push(lower)
			product.sides.push(upper)

			product.materials.push(
				this.back_material,
				this.front_material
			)

			worldObjects.push(product)
		}
		return worldObjects
	}
}

var PRIM_RAMP = function(o_border,f_border,height,elevation){
	this.front_material = Mat_Playerclip
	this.edge_material = Mat_Playerclip
	this.back_material = Mat_Playerclip
	this.thickness = 8
	this.heights = []
	this.elevation = elevation

	o_border[0].y=0
	o_border[1].y=0
	o_border[2].y=0
	o_border[3].y=0

	this.f_border = []
	for(var ii=0;ii<f_border.length;ii++){
		this.f_border[ii] = f_border[ii].clone()
		this.f_border[ii].y = 0
		var f = find_Skew_CD(o_border[0],o_border[1],o_border[3],o_border[2],this.f_border[ii],10000)

		this.heights.push(f * height)
	}
	this.heights.reverse()
	this.f_border.reverse()
	console.log("ramp heights")
	console.log(this.f_border)
	console.log(this.heights)

	this.genMesh = function(){
		var geo = new THREE.Geometry()
		console.log("ramp decompose:",this.f_border)
		var faces = decompose_Shape(this.f_border)
		for(var ii=0;ii<faces.length;ii++){
			geo.faces.push(new THREE.Face3(faces[ii][2],faces[ii][1],faces[ii][0]))
		}
		for(var ii=0;ii<this.f_border.length;ii++){
			var temp = this.f_border[ii].clone()
			temp.y = Math.round(this.heights[ii] + this.elevation)
			geo.vertices.push(temp)
		}
		geo.computeFaceNormals()
		geo.computeVertexNormals()
		geo.computeMorphNormals()
		return [new THREE.Mesh(geo,this.front_material.editor)]
	}
	this.exportVMF = function(){
		var worldObjects = []

		var shapes = this.genMesh()
		shapes = shapes[0].geometry

		for(var ii=0;ii<shapes.faces.length;ii++){
			var product = new PRIM_SOLID()

			product.vertices.push(
				shapes.vertices[shapes.faces[ii].a].clone(),
				shapes.vertices[shapes.faces[ii].a].clone(),
				shapes.vertices[shapes.faces[ii].b].clone(),
				shapes.vertices[shapes.faces[ii].b].clone(),
				shapes.vertices[shapes.faces[ii].c].clone(),
				shapes.vertices[shapes.faces[ii].c].clone()
			)
			product.vertices[0].y += 1
			product.vertices[2].y += 1
			product.vertices[4].y += 1
			product.vertices[1].y = this.elevation//-8
			product.vertices[3].y = this.elevation//-8
			product.vertices[5].y = this.elevation//-8

			product.sides.push(
				[5,0,1],
				[1,2,3],
				[3,4,5],
				[4,2,0],
				[1,3,5]
			)

			product.materials.push(
				this.edge_material,
				this.edge_material,
				this.edge_material,
				this.back_material,
				this.front_material
			)

			worldObjects.push(product)
		}
		return worldObjects
	}
}
