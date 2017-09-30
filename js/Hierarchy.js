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

function find_Line_Intersection(A_S,A_E,B_S,B_E){
	// if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
	var denominator, a, b, numerator1, numerator2
	var result = new THREE.Vector3()
	denominator = ((B_E.z - B_S.z) * (A_E.x - A_S.x)) - ((B_E.x - B_S.x) * (A_E.z - A_S.z))
	if (denominator == 0) {
		return false
	}
	a = A_S.z - B_S.z;
	b = A_S.x - B_S.x;
	numerator1 = ((B_E.x - B_S.x) * a) - ((B_E.z - B_S.z) * b)
	numerator2 = ((A_E.x - A_S.x) * a) - ((A_E.z - A_S.z) * b)
	a = numerator1 / denominator
	b = numerator2 / denominator

	// if we cast these lines infinitely in both directions, they intersect here:
	result.x = A_S.x + (a * (A_E.x - A_S.x))
	result.z = A_S.z + (a * (A_E.z - A_S.z))
	/*
		// it is worth noting that this should be the same as:
		x = B_S.x + (b * (B_E.x - B_S.x));
		y = B_S.x + (b * (B_E.z - B_S.z));
		*/
	// if line1 is a segment and line2 is infinite, they intersect if:
	if (a <= 0 || a >= 1) {
		return false
	}
	// if line2 is a segment and line1 is infinite, they intersect if:
	if (b <= 0 || b >= 1) {
		return false
	}
	// if line1 and line2 are segments, they intersect if both of the above are true
	return result
}

function find_Border_Intersections(A,B){
	var product = []
	for(var ii=0;ii<A.length;ii++){
		for(var jj=0;jj<B.length;jj++){
			var result = find_Line_Intersection(A[ii],A[(ii+1)%A.length],B[jj],B[(jj+1)%B.length])
			if(result){
				product.push([ii,jj,result])
			}
		}
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

class Material{
	constructor(){
		this.editor = new THREE.MeshPhongMaterial({color: 0x6B6964})
		this.export = "tools/toolsnodraw"
}
}

var Mat_Blue_Floor = new Material()
Mat_Blue_Floor.export = "dev/graygrid"

var Mat_Blu_Wall = new Material()
Mat_Blu_Wall.editor = new THREE.MeshPhongMaterial({color: 0x445A77})
Mat_Blu_Wall.export = "dev/reflectivity_40"

var Mat_Blu_Detail = new Material()
Mat_Blu_Detail.editor = new THREE.MeshPhongMaterial({color: 0x7B7974})
Mat_Blu_Detail.export = "dev/reflectivity_50"

var Mat_Ground = new Material()
Mat_Ground.editor = new THREE.MeshPhongMaterial({color: 0x6B8A64})
Mat_Ground.export = "dev/reflectivity_30"

var Mat_Playerclip = new Material()
Mat_Playerclip.editor = new THREE.MeshPhongMaterial({color: 0x8B4684})
Mat_Playerclip.export = "tools/toolsplayerclip"

var Mat_Nodraw = new Material()



var PRIM_WALL = function(inworld,outworld,elevation,height){
	this.front_material = Mat_Blu_Wall
	this.edge_material = Mat_Blue_Floor
	this.back_material = Mat_Nodraw
	
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
		if(pathed.length>4){
			//displayPath(pathed,300)
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
console.log("Stop")

class Hamr_Path{
	find_Intersections(vector_array){
		var product = []
		var temp_real = this.gen_Real_Paths()
		for(var ii=0;ii<temp_real.length;ii++){
			var result = find_Border_Intersections(temp_real[ii],vector_array)
			for(var jj=0;jj<result.length;jj++){
				product.push(result[jj][2])
			}
		}
		return product
	}
	
	add(vector_array){
		this.reals = this.reals.concat(this.find_Intersections(vector_array))
		this.reals = this.reals.concat(vector_array)
		this.condense_Reals()
		
		var addition = vector_Array_To_Path(vector_array)
		var product = new ClipperLib.Paths();
		
		var cpr = new ClipperLib.Clipper();
		cpr.AddPaths(this.path, ClipperLib.PolyType.ptSubject, true);
		cpr.AddPaths(addition, ClipperLib.PolyType.ptClip, true);
		
		cpr.StrictlySimple = true;
		cpr.Execute(ClipperLib.ClipType.ctUnion, product, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
		
		ClipperLib.Clipper.CleanPolygons(product)
		
		this.path = product
	}
	subtract(vector_array){
		this.reals = this.reals.concat(this.find_Intersections(vector_array))
		this.reals = this.reals.concat(vector_array)
		this.condense_Reals()
		
		var subtraction = vector_Array_To_Path(vector_array)
		var product = new ClipperLib.Paths();
		
		var cpr = new ClipperLib.Clipper();
		cpr.AddPaths(this.path, ClipperLib.PolyType.ptSubject, true);
		cpr.AddPaths(subtraction, ClipperLib.PolyType.ptClip, true);
		
		cpr.StrictlySimple = true;
		cpr.Execute(ClipperLib.ClipType.ctDifference, product, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
		
		ClipperLib.Clipper.CleanPolygons(product)
		
		this.path = product
	}
	restrict(vector_array){
		this.reals = this.reals.concat(this.find_Intersections(vector_array))
		this.reals = this.reals.concat(vector_array)
		this.condense_Reals()
		
		var filter = vector_Array_To_Path(vector_array)
		var product = new ClipperLib.Paths();
		
		var cpr = new ClipperLib.Clipper();
		cpr.AddPaths(this.path, ClipperLib.PolyType.ptSubject, true);
		cpr.AddPaths(filter, ClipperLib.PolyType.ptClip, true);
		
		cpr.StrictlySimple = true;
		cpr.Execute(ClipperLib.ClipType.ctIntersection, product, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
		
		ClipperLib.Clipper.CleanPolygons(product)
		
		this.path = product
	}
	
	condense_Reals(){
		for(var ii=0;ii<this.reals.length-1;ii++){
			
			for(var jj=ii+1;jj<this.reals.length;jj++){
				
				if(this.reals[ii].equals(this.reals[jj])){
					this.reals.splice(jj,1)
					jj--
				}
			}
		}
	}
	find_Real(coord){
		var test = new THREE.Vector3(coord.X,this.reals[0].y,coord.Y)
		var minimum = test.distanceTo(this.reals[0])
		var canidate = 0
		
		for(var ii=1;ii<this.reals.length;ii++){
			test.y = this.reals[ii].y
			
			if(test.distanceTo(this.reals[ii])<minimum){
				canidate = ii
				minimum = test.distanceTo(this.reals[ii])
			}
		}
		
		return this.reals[canidate]
	}
	gen_Real_Paths(){
		var product = []
		
		for(var ii=0;ii<this.path.length;ii++){
			var sub_product = []
			
			for(var jj=0;jj<this.path[ii].length;jj++){
				var result = this.find_Real(this.path[ii][jj]).clone()
				result.y = this.height
				sub_product.push(result)
			}
			
			product.push(sub_product)
		}
		
		return product
	}
	
	gen_Simple_Paths(){
		//console.log("simple")
		//console.log(this)
		var products = []
		for(var ii=0;ii<this.path.length;ii++){
			if(!ClipperLib.Clipper.Orientation(this.path[ii])){
				continue
			}
			
			var path = [this.path[ii]]
			
			for(var jj=0;jj<this.path.length;jj++){
				if(ClipperLib.Clipper.Orientation(this.path[jj])){
					continue
				}
				
				var subtract = this.path[jj].slice(0).reverse()
				var product = new ClipperLib.Paths();
				
				var cpr = new ClipperLib.Clipper();
				cpr.AddPaths(path, ClipperLib.PolyType.ptSubject, true);
				cpr.AddPaths([subtract], ClipperLib.PolyType.ptClip, true);
				
				cpr.StrictlySimple = true;
				cpr.Execute(ClipperLib.ClipType.ctDifference, product, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
				
				path = product
			}
			
			//time to simplify
			for(var jj=1;jj<path.length;jj++){
				//form a pseudo vector array for path[0]
				var test_zero = []
				for(var kk=0;kk<path[0].length;kk++){
					test_zero.push({x:path[0][kk].X,z:path[0][kk].Y})
				}
				
				//form a pseudo vector array for path[jj]
				var test_jj = []
				for(var kk=0;kk<path[jj].length;kk++){
					test_jj.push({x:path[jj][kk].X,z:path[jj][kk].Y})
				}
				
				//we need to find the optimal pair to merge
				var best_kk = 0
				var best_nn = 0
				var best_distance = 9999
				
				for(var kk=0;kk<path[0].length;kk++){
					
					for(var nn=0;nn<path[jj].length;nn++){
						//form a pseudo vector array for our line
						var dist = Math.pow(path[0][kk].X - path[jj][nn].X, 2) + Math.pow(path[0][kk].Y - path[jj][nn].Y, 2)
						dist = Math.pow(dist,.5)
						
						if(dist>best_distance){
							continue
						}
						
						var test_line = [{x:path[0][kk].X,z:path[0][kk].Y},{x:path[jj][nn].X,z:path[jj][nn].X}]
						
						var Touches_zero = find_Border_Intersections(test_zero,test_line)
						var Touches_jj = find_Border_Intersections(test_jj,test_line)
						
						if(Touches_zero.length>0){
							continue
						}
						if(Touches_jj.length>0){
							continue
						}
						best_kk = kk
						best_nn = nn
						best_distance = dist
					}
				}
				
				//now we merge at the pair we've selected
				var edge = path[0][best_kk]
				for(var nn=0;nn<path[jj].length+1;nn++){
					path[0].splice(best_kk+nn,0,path[jj][(best_nn + nn)%path[jj].length])
				}
				path[0].splice(best_kk,0,edge)
			}
			
			var sub_product = []
			for(var jj=0;jj<path[0].length;jj++){
				var result = this.find_Real(path[0][jj]).clone()
				result.y = this.height
				sub_product.push(result)
			}
			//console.log(sub_product)
			products.push(sub_product)
		}
		//console.log(products)
		return products
	}
	
	constructor(vector_array){
		if(vector_array.length<3){
			throw "vector array must form a shape"
		}
		this.height = vector_array[0].y
		
		this.reals = vector_array
		this.path = vector_Array_To_Path(vector_array)
		
		if(!ClipperLib.Clipper.Orientation(this.path[0])){
			ClipperLib.Clipper.ReversePaths(this.path)
		}
		
		this.condense_Reals()
	}
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

class Hamr_Element{
	//an element of the hierarchy that is a hamr level
	constructor(){
		this.id = 0
		this.name = ""
		this.children = []
		this.childtypes = []
		this.childtypetitles = []
		this.hidden = false
		this.methods = ["remove"]
		this.methodtitles = ["Remove This"]
		this.settings = ["elevation","enabled"]
		this.settingtitles = ["Elevation","Enable"]
		this.settingtypes = [1,2]
		
		this.elevation = 0
		this.enabled = true
		
		this.visible = 1  //hidden, transparent (disabled), opaque (selectable), widgets (control)
		this.save_delimiter = ";"
		this.save_signature = "P"
		this.position = new THREE.Vector3(0,0,0)//
		this.parent = 0
		
		this.brush = 0
		this.object = 0
		this.control = new Point_Widget(this.position.clone(),this)
		this.folder = 0
		this.menu = 0
	}
	
	//hamr functions
	move(vector){
		//this.position.add(vector)
		this.elevation += vector.y
		this.control.move(vector)
	}
	drag(vector){
		for(var ii=0;ii<this.children.length;ii++){
			this.children[ii].move(vector)
		}
	}
	snap(){
		this.control.snap()
		this.elevation = Math.round(this.elevation)
		for(var ii=0;ii<this.children.length;ii++){
			this.children[ii].snap()
		}
	}
	update(){
		var height = this.elevation-this.control.height()
		if(height!=0){
			this.control.move(new THREE.Vector3(0,height,0))
		}
	}
	gen_Hamr_Brush(){
		//generates and stores the 
		this.brush = 0
		return this.brush
	}
	
	gen_Visible_Obj(){
		var objects = this.control.display()
		if(this==FOCUS){
			objects = objects.concat(this.control.edit())
		}
		return objects
	}
	list_Visible_Objs(){
		this.update()
		//generates a list of visible THREE JS objects
		var objects = this.gen_Visible_Obj()
		for(var ii=0;ii<this.children.length;ii++){
			objects = objects.concat(this.children[ii].list_Visible_Objs())
		}
		return objects
	}
	
	gen_Control_Obj(){
		var objects = []
		if(this.enabled){
			objects = objects.concat(this.control.display())
			objects = objects.concat(this.control.edit())
		}
		return objects
	}
	list_Control_Objs(){
		var objects = this.gen_Control_Obj()
		return objects
	}
	
	gen_Preview_Obj(){
		return []
	}
	list_Preview_Objs(){
		//generates a list of preview THREE JS objects
		var objects = this.gen_Preview_Obj()
		for(var ii=0;ii<this.children.length;ii++){
			objects = objects.concat(this.children[ii].list_Preview_Objs())
		}
		return objects
	}
	
	gen_Export_Obj(){
		return []
	}
	list_Export_Objs(){
		var objects = this.gen_Export_Obj()
		for(var ii=0;ii<this.children.length;ii++){
			objects = objects.concat(this.children[ii].list_Export_Objs())
		}
		return objects
	}
	
	gen_Save_Text(){
		//generate the save text for this object
		var save_text = this.save_signature + this.control.gen_Save_Text() + this.save_delimiter
		
		for(var ii=0;ii<this.settings.length;ii++){
			save_text += this[this.settings[ii]] + this.save_delimiter
		}
		
		for(var ii=0;ii<this.children.length;ii++){
			save_text += this.children[ii].gen_Save_Text() + this.save_delimiter
		}
		return save_text
	}
	parse_Load_Text(load_text){
		var tuple = this.parse_Load_Settings(load_text)
	}
	parse_Load_Settings(load_text){
		//load this objects settings from save text
		var tuple = gatherThoughts(load_text,0,this.save_delimiter)
		this.control.parse_Load_Text(tuple[0])
		this.elevation = this.control.height()
		
		for(var ii=0;ii<this.settings.length;ii++){
			tuple = gatherThoughts(load_text,tuple[1],this.save_delimiter)
			if(this.settingtypes[ii]==0){
				this[this.settings[ii]] = tuple[0]
			}else if(this.settingtypes[ii]==1){
				this[this.settings[ii]] = parseInt(tuple[0])
			}else{
				this[this.settings[ii]] = (tuple[0]=="true")
			}
			if(tuple[1]>=load_text.length){break}
		}
		return tuple
	}
	
	//hierarchy funcions
	choose(){
		if(this==FOCUS&&WORLD.mode==0){return}
		PROTO = 0
		CALL = "h_move"
		settings_gui.remove(FOCUS.menu)
		this.menu = settings_gui.addFolder(this.name + " " + this.id)
		var add_menu = this.menu.addFolder("--Add Element--")
		for(var ii=0;ii<this.settings.length;ii++){
			this.menu.add(this,this.settings[ii]).name(this.settingtitles[ii]).onFinishChange(function(value){
				this.object.update()
			})
		}
		for(var ii=0;ii<this.methods.length;ii++){
			this.menu.add(this,this.methods[ii]).name(this.methodtitles[ii])
		}
		for(var ii=0;ii<this.childtypes.length;ii++){
			add_menu.add(this, this.childtypes[ii]).name(this.childtypetitles[ii])
		}
		add_menu.open()
		this.menu.open()
		FOCUS = this
		OBJECTS = this.list_Control_Objs()
		WORLD.update_Display()
	}
	
	remove(){
		//remove any trace of self then remove self from parent
		this.parent.folder.remove(this.folder)
		this.parent.remove_Child(this)
		WORLD.update_Display()
		this.parent.choose()
	}
	remove_Child(target){
		//remove child object from self.
		for(var ii=0;ii<this.children.length;ii++){
			if(this.children[ii]==target){
				this.children.splice(ii,1)
				break
			}
		}
		console.log(target,"is not a child of ", this)
	}
	
	safe_ID(){
		if(this.children.length==0){return 0}
		return this.children[this.children.length-1].id+1
	}
	add_Child(position,my_child){
		if(my_child!=0){
			my_child.id = this.safe_ID()
			my_child.move(position)
			my_child.move(new THREE.Vector3(0,this.elevation,0))
			my_child.snap()
			my_child.folder = this.folder.addFolder(my_child.name+ " "+my_child.id)
			my_child.folder.add(my_child,"choose").name("Select")
			my_child.folder.open()
			my_child.parent = this
			this.children.push(my_child)
			my_child.choose()
		}
		PROTO = 0
		CALL = "h_move"
	}
	
	proto_Clone(){
		return new Hamr_Element()
	}
	deep_Clone(){
		//returns a deep clone of this
		var clone_me = this.proto_Clone()
		for(var ii=0;ii<this.children.length;ii++){
			var clone_child = this.children[ii].deep_Clone()
			clone_child.parent = clone_me
			clone_me.children.push(clone_child)
		}
		
		
		
		
		clone_me.parent = this.parent
		return clone_me
	}
	shallow_Clone(){
		var clone_me = this.proto_Clone()
		for(var ii=0;ii<this.children.length;ii++){
			clone_me.children.push(this.children[ii])
		}
		this.copy_Settings_To(clone_me)
		
		
		
		clone_me.parent = 0
		return clone_me
	}
	
	copy_Settings_To(Target){
		for(var ii=0;ii<this.settings.length;ii++){
			if(Target.settings.indexOf(this.settings[ii])>=0){
				Target[this.settings[ii]] = this[this.settings[ii]]
			}
		}
	}
}

class Hamr_Ramp_Element extends Hamr_Element{
	constructor(id){
		super(id)
		this.save_delimiter = "/"
		this.save_signature = "R"
		this.name = "Ramp"
		
		this.control = Square_Border(128,0,this)
		
		//this.childtypes.push()
		//this.childtypetitles.push()
		
		//this.methods.push()
		//this.methodtitles.push()
		
		this.height = 32
		this.thickness = 8
		this.underfill = false
		this.steps = 1
		this.settings.push("height","thickness","underfill","steps")
		this.settingtitles.push("Height","Thickness","Create Supports","Steps")
		this.settingtypes.push(1,1,2,1)
	}
	update(){
		var height = this.elevation-this.control.height()
		if(height!=0){
			this.control.move(new THREE.Vector3(0,height,0))
		}
		this.control.vertices[2].position.y = this.control.vertices[0].position.y + this.height
		this.control.vertices[3].position.y = this.control.vertices[0].position.y + this.height
		this.control.move(new THREE.Vector3(0,0,0))
	}
	proto_Clone(){
		return new Hamr_Ramp_Element()
	}
}

class Hamr_Platform_Element extends Hamr_Element{
	constructor(id){
		super(id)
		this.save_delimiter = "/"
		this.save_signature = "P"
		this.name = "Platform"
		
		this.control = Square_Border(128,0,this)
		
		//this.childtypes.push()
		//this.childtypetitles.push()
		
		this.methods.push("add_Control","remove_Control")
		this.methodtitles.push("Add Border Node","Remove Node")
		
		this.height = 0
		this.thickness = 8
		this.underfill = false
		this.settings.push("thickness","underfill")
		this.settingtitles.push("Thickness","Create Supports")
		this.settingtypes.push(1,2)
	}
	add_Control(){
		CALL = "add_Node"
	}
	add_Node(position){
		position.y = this.elevation
		this.control.add_Node(position)
		OBJECTS = this.list_Control_Objs()
		WORLD.update_Display()
		CALL = "h_move"
	}
	remove_Control(){
		CALL = "remove_Node"
	}
	remove_Node(position){
		this.control.remove_Node(position)
		OBJECTS = this.list_Control_Objs()
		WORLD.update_Display()
		CALL = "h_move"
	}
	proto_Clone(){
		return new Hamr_Platform_Element()
	}
}

class Hamr_Room_Element extends Hamr_Element{
	constructor(id){
		super(id)
		this.save_delimiter = "]"
		this.save_signature = "R"
		this.name = "Interior Room"
		
		this.control = Square_Border(256,0,this)
		
		this.childtypes.push("add_Platform","add_Ramp")
		this.childtypetitles.push("Platform","Ramp")
		
		this.methods.push("add_Control","remove_Control")
		this.methodtitles.push("Add Border Node","Remove Node")
		
		this.height = 192
		this.playerclip = true
		this.foundation = true
		//this.ceiling = true  //add me, if false, extend walls to roof and subtract room ceiling from roof
		this.settings.push("height","playerclip","foundation")
		this.settingtitles.push("Height","Playerclip Roof","Connect to Ground")
		this.settingtypes.push(1,2,2)
	}
	gen_Preview_Obj(){
		var product = []
		
		var extension = this.control.flatten()
		extension.push(extension[0])
		extension = Inset_Path(extension,8)
		extension.splice(0,1)
		
		var sorted_children = this.children.slice(0)
		
		function sort_by_elevation(a,b){
			return a.elevation - b.elevation;
		}
		
		sorted_children.sort(sort_by_elevation)
		
		for(var ii=sorted_children.length-1;ii>=0;ii--){
			var current_target = new Hamr_Path(sorted_children[ii].control.flatten())
			current_target.restrict(extension)
			for(var jj=ii+1;jj<sorted_children.length;jj++){
				if(!sorted_children[jj].underfill){
					if(sorted_children[jj].elevation - sorted_children[jj].thickness >= sorted_children[ii].elevation + sorted_children[ii].height){
						continue
					}
				}
				var current_subtraction = sorted_children[jj].control.flatten()
				current_target.subtract(current_subtraction)
			}
			var reals = current_target.gen_Simple_Paths()
			if(sorted_children[ii].name=="Ramp"){
				if(sorted_children[ii].steps<=1){
					for(var jj=0;jj<reals.length;jj++){
						reals[jj].reverse()
						var surface = new PRIM_RAMP(sorted_children[ii].control.flatten(),reals[jj],sorted_children[ii].height,sorted_children[ii].elevation)
						surface.front_material = Mat_Blu_Detail
						surface.edge_material = Mat_Blu_Wall
						surface.back_material = Mat_Blu_Detail
						surface.detail = true
						product.push(surface)
					}
				}else{
					//var generate step pattern
					var steps = []
					var original = sorted_children[ii].control.flatten()
					var step_height = sorted_children[ii].height/sorted_children[ii].steps
					
					for(var jj=0;jj<sorted_children[ii].steps;jj++){
						var front = jj/sorted_children[ii].steps
						var end = (jj+1)/sorted_children[ii].steps
						
						for(var kk=0;kk<reals.length;kk++){
							var step_path = new Hamr_Path([
								interp_Segment(front,original[3],original[0]),
								interp_Segment(front,original[2],original[1]),
								interp_Segment(end,original[2],original[1]),
								interp_Segment(end,original[3],original[0])])
							reals[kk].reverse()
							step_path.restrict(reals[kk])
							
							var step = step_path.gen_Real_Paths()
							for(var nn=0;nn<step.length;nn++){
								step[nn].reverse()
								var step_part = new PRIM_RAMP(sorted_children[ii].control.flatten(),step[nn],sorted_children[ii].height,step_height*jj + sorted_children[ii].elevation)
								for(var mm=0;mm<step_part.heights.length;mm++){
									step_part.heights[mm] -= step_height*jj
								}
								step_part.detail = true
								product.push(step_part)
								var temp_border = new Border_Widget()
								for(var mm=0;mm<step[nn].length;mm++){
									var pos = step[nn][mm].clone()
									pos.y = step_height*jj + sorted_children[ii].elevation
									temp_border.vertices.push(new Point_Widget(pos,temp_border))
								}
								var surface = new PRIM_SURFACE(temp_border,new THREE.Vector3(0,-1,0))
								surface.front_material = Mat_Blu_Detail
								surface.edge_material = Mat_Blu_Wall
								surface.back_material = Mat_Blu_Detail
								surface.detail = true
								product.push(surface)
							}
							
						}
						
						
					}
				}
					
			}else{
				for(var jj=0;jj<reals.length;jj++){
					reals[jj].reverse()
					var temp_border = new Border_Widget()
					for(var kk=0;kk<reals[jj].length;kk++){
						temp_border.vertices.push(new Point_Widget(reals[jj][kk],temp_border))
					}
					var surface = new PRIM_SURFACE(temp_border,new THREE.Vector3(0,-1,0))
					surface.front_material = Mat_Blu_Detail
					surface.edge_material = Mat_Blu_Wall
					surface.back_material = Mat_Blu_Detail
					surface.detail = true
					product.push(surface)
				}
			}
		}
		
		return product
	}
	add_Control(){
		CALL = "add_Node"
	}
	add_Node(position){
		position.y = this.elevation
		this.control.add_Node(position)
		OBJECTS = this.list_Control_Objs()
		WORLD.update_Display()
		CALL = "h_move"
	}
	remove_Control(){
		CALL = "remove_Node"
	}
	remove_Node(position){
		this.control.remove_Node(position)
		OBJECTS = this.list_Control_Objs()
		WORLD.update_Display()
		CALL = "h_move"
	}
	add_Platform(){
		var my_child = new Hamr_Platform_Element(this.safe_ID())
		PROTO = my_child
		CALL = "add_Child"
	}
	add_Ramp(){
		var my_child = new Hamr_Ramp_Element(this.safe_ID())
		PROTO = my_child
		CALL = "add_Child"
	}
	parse_Load_Text(load_text){
		var tuple = this.parse_Load_Settings(load_text)
		while(tuple[1]<load_text.length){
			tuple = gatherThoughts(load_text,tuple[1],this.save_delimiter)
			if(tuple[0][0]=="R"){
				this.add_Ramp()
				var temp = PROTO
				this.add_Child(new THREE.Vector3(),PROTO)
				temp.parse_Load_Text(tuple[0].slice(1))
			}else if(tuple[0][0]=="P"){
				this.add_Platform()
				var temp = PROTO
				this.add_Child(new THREE.Vector3(),PROTO)
				temp.parse_Load_Text(tuple[0].slice(1))
			}
		}
	}
	proto_Clone(){
		return new Hamr_Room_Element()
	}
}

class Hamr_Portal_Element extends Hamr_Element{
	constructor(id){
		super(id)
		this.save_delimiter = "]"
		this.save_signature = "P"
		this.name = "Portal"
		
		//this.childtypes.push()
		//this.childtypetitles.push()
		
		//this.methods.push()
		//this.methodtitles.push()
		
		this.width = 192
		this.height = 160
		this.framewidth = 8
		this.settings.push("width","height")
		this.settingtitles.push("Width","Height")
		this.settingtypes.push(1,1)
	}
	gen_Preview_Obj(){
		if(this.normal==0){
			return
		}
		var direction = this.normal.clone()
		var ox = direction.x
		direction.x = direction.z
		direction.z = -ox
		
		var hf_offset = direction.clone().normalize().multiplyScalar((this.width + this.framewidth*2)/2)
		var hi_offset = direction.clone().normalize().multiplyScalar((this.width)/2)
		this.normal.normalize().multiplyScalar(8)
		var v_offset = new THREE.Vector3(0,this.height,0)
		
		var product = []
		
		var bot_surface = new Border_Widget()
		bot_surface.vertices.push(
			new Point_Widget(this.control.position.clone().sub(hf_offset).sub(this.normal),bot_surface),
			new Point_Widget(this.control.position.clone().sub(hf_offset).add(this.normal),bot_surface),
			new Point_Widget(this.control.position.clone().add(hf_offset).add(this.normal),bot_surface),
			new Point_Widget(this.control.position.clone().add(hf_offset).sub(this.normal),bot_surface)
		)
		product.push(new PRIM_SURFACE(bot_surface,new THREE.Vector3(0,-1,0)))
		
		var top_surface = new Border_Widget()
		top_surface.vertices.push(
			new Point_Widget(this.control.position.clone().add(hf_offset).add(v_offset).sub(this.normal),top_surface),
			new Point_Widget(this.control.position.clone().add(hf_offset).add(v_offset).add(this.normal),top_surface),
			new Point_Widget(this.control.position.clone().sub(hf_offset).add(v_offset).add(this.normal),top_surface),
			new Point_Widget(this.control.position.clone().sub(hf_offset).add(v_offset).sub(this.normal),top_surface)
		)
		product.push(new PRIM_SURFACE(top_surface,new THREE.Vector3(0,1,0)))
		
		var left_surface = new Border_Widget()
		left_surface.vertices.push(
			new Point_Widget(this.control.position.clone().add(hi_offset).sub(this.normal),left_surface),
			new Point_Widget(this.control.position.clone().add(hi_offset).add(this.normal),left_surface),
			new Point_Widget(this.control.position.clone().add(hi_offset).add(v_offset).add(this.normal),left_surface),
			new Point_Widget(this.control.position.clone().add(hi_offset).add(v_offset).sub(this.normal),left_surface)
		)
		product.push(new PRIM_SURFACE(left_surface,direction))
		
		var rite_surface = new Border_Widget()
		rite_surface.vertices.push(
			new Point_Widget(this.control.position.clone().sub(hi_offset).add(this.normal),rite_surface),
			new Point_Widget(this.control.position.clone().sub(hi_offset).sub(this.normal),rite_surface),
			new Point_Widget(this.control.position.clone().sub(hi_offset).add(v_offset).sub(this.normal),rite_surface),
			new Point_Widget(this.control.position.clone().sub(hi_offset).add(v_offset).add(this.normal),rite_surface)
		)
		product.push(new PRIM_SURFACE(rite_surface,direction.clone().multiplyScalar(-1)))
		
		product[0].interior = true
		product[1].interior = true
		product[2].interior = true
		product[3].interior = true
		
		return product
	}
	proto_Clone(){
		return new Hamr_Portal_Element()
	}
}

class Hamr_Exterior_Element extends Hamr_Element{
	constructor(id){
		super(id)
		this.save_delimiter = "]"
		this.save_signature = "E"
		this.name = "Exterior Wall"
		
		this.control = Square_Border(448,0,this)
		
		//this.childtypes.push()
		//this.childtypetitles.push()
		
		this.methods.push("add_Control","remove_Control")
		this.methodtitles.push("Add Border Node","Remove Node")
		
		this.height = 256
		this.playerclip = true
		this.foundation = true
		this.settings.push("height","playerclip","foundation")
		this.settingtitles.push("Height","Playerclip Roof","Connect to Ground")
		this.settingtypes.push(1,2,2)
	}
	add_Control(){
		CALL = "add_Node"
	}
	add_Node(position){
		position.y = this.elevation
		this.control.add_Node(position)
		OBJECTS = this.list_Control_Objs()
		WORLD.update_Display()
		CALL = "h_move"
	}
	remove_Control(){
		CALL = "remove_Node"
	}
	remove_Node(position){
		this.control.remove_Node(position)
		OBJECTS = this.list_Control_Objs()
		WORLD.update_Display()
		CALL = "h_move"
	}
	proto_Clone(){
		return new Hamr_Floor()
	}
}

function displayPath(target,height){
	var geometry = new THREE.Geometry()
	var v
	var t = 0
	for(var ii=0;ii<target.length;ii++){
		v = target[ii].clone()
		//v.x += 10*Math.random() - 5
		//v.y += 10*Math.random() - 5
		//v.z += 10*Math.random() - 5
		//v.y = height + t*2
		t++
		geometry.vertices.push(v.clone())
	}
	v = target[0].clone()
	geometry.vertices.push(v)
	var line = new THREE.Line(geometry)
	reality.add(line)
}

function Inset_Path(Target,width){
	
	var splits = []
	splits.push(Target[0].clone().sub(Target[Target.length-2]).normalize())
	for(var ii=1;ii<Target.length;ii++){
		splits.push(Target[ii].clone().sub(Target[ii-1]).normalize())
	}
	
	//now to create the decension angles
	var raw_attractor
	var offset

	var geometry = []
	for(var ii=0;ii<Target.length-1;ii++){
		//going toward the center is not the bisector
		raw_attractor = splits[ii].clone().sub(splits[ii+1]);
		raw_attractor.normalize();
		
		var back_angle = Math.acos(raw_attractor.dot(splits[ii]));//angle between
		raw_attractor.divideScalar(Math.sin(back_angle));
		raw_attractor.multiplyScalar(width);
		var test_angle = new THREE.Vector3();
		test_angle.x = -splits[ii].z;
		test_angle.z = splits[ii].x;
		if(test_angle.dot(splits[ii+1])<0){//convex
			geometry.push(Target[ii].clone().sub(raw_attractor))
		}else{ //concave
			geometry.push(Target[ii].clone().add(raw_attractor))
		}
	}
	geometry.push(geometry[0].clone());
	
	return geometry
}

class Hamr_Building_Element extends Hamr_Element{
	constructor(id){
		super(id)
		this.save_delimiter = "["
		this.save_signature = "B"
		this.name = "Building"
		
		this.childtypes.push("add_Exterior","add_Portal","add_Room")
		this.childtypetitles.push("Exterior","Portal","Room")
		
		//this.methods.push("add_Control","remove_Control")
		//this.methodtitles.push("Add Border Node","Remove Node")
		
		//this.settings.push()
		//this.settingtitles.push()
		//this.settingtypes.push()
		this.exterior = []
	}
	calculate_FootPrint(){
		var footprint = 0
		var min = 9999
		for(var ii=0;ii<this.children.length;ii++){
			if(this.children[ii].foundation){
				if(this.children[ii].name == "Interior Room"){
					min = Math.min(this.children[ii].elevation-16,min)
				}else{
					min = Math.min(this.children[ii].elevation,min)
				}
				var temp = this.children[ii].control.flatten()
				temp.push(temp[0])
				temp = Inset_Path(temp,-8)
				temp.splice(0,1)
				if(footprint==0){
					footprint = new Hamr_Path(temp)
				}else{
					footprint.add(temp)
				}
			}
		}
		return footprint.gen_Simple_Paths()
	}
	
	gen_Preview_Obj(){
		var product = []
		var valid_exterior = []
		var valid_interior = []
		var valid_paperclip = []
		var valid_doors = []
		for(var ii=0;ii<this.children.length;ii++){
			if(this.children[ii].name=="Exterior Wall"){
				valid_exterior.push(this.children[ii])
				if(this.children[ii].playerclip){
					valid_paperclip.push(this.children[ii])
				}
			}else if(this.children[ii].name=="Interior Room"){
				this.children[ii].elevation -= 16
				this.children[ii].height += 32
				valid_exterior.push(this.children[ii])
				valid_interior.push(this.children[ii])
				if(this.children[ii].playerclip){
					valid_paperclip.push(this.children[ii])
				}
			}else{
				valid_doors.push(this.children[ii])
			}
		}
		
		
		function compareNumbers(a, b) {
			return a - b;
		}
		
		var wall_products = []
		var surface_products = []
		
		//exterior cuts calculation
		//valid_exterior
		var exterior_cuts = {}
		var exterior_heights = []
		var exterior_extensions = {}
		
		for(var ii=0;ii<valid_exterior.length;ii++){
			if(exterior_cuts[valid_exterior[ii].elevation]==undefined){
				exterior_heights.push(valid_exterior[ii].elevation)
				exterior_cuts[valid_exterior[ii].elevation] = new Hamr_Path(valid_exterior[ii].control.flatten())
				exterior_cuts[valid_exterior[ii].elevation].height = valid_exterior[ii].elevation
				for(var jj=0;jj<valid_exterior.length;jj++){
					if(ii==jj){continue}
					if(valid_exterior[jj].elevation <= valid_exterior[ii].elevation
						&& valid_exterior[jj].elevation + valid_exterior[jj].height >= valid_exterior[ii].elevation){
						
						exterior_cuts[valid_exterior[ii].elevation].add(valid_exterior[jj].control.flatten())
					}else if(valid_exterior[jj].elevation>valid_exterior[ii].elevation&&valid_exterior[jj].foundation){
						exterior_cuts[valid_exterior[ii].elevation].add(valid_exterior[jj].control.flatten())
					}
				}
			}
				
			if(exterior_cuts[valid_exterior[ii].elevation + valid_exterior[ii].height]==undefined){
				exterior_heights.push(valid_exterior[ii].elevation + valid_exterior[ii].height)
				exterior_cuts[valid_exterior[ii].elevation + valid_exterior[ii].height] = new Hamr_Path(valid_exterior[ii].control.flatten())
				exterior_cuts[valid_exterior[ii].elevation + valid_exterior[ii].height].ceiling=true
				exterior_cuts[valid_exterior[ii].elevation + valid_exterior[ii].height].height = valid_exterior[ii].elevation + valid_exterior[ii].height
				for(var jj=0;jj<valid_exterior.length;jj++){
					if(ii==jj){continue}
					if(valid_exterior[jj].elevation <= valid_exterior[ii].elevation+valid_exterior[ii].height
						&& valid_exterior[jj].elevation + valid_exterior[jj].height >= valid_exterior[ii].elevation + valid_exterior[ii].height){
						
						exterior_cuts[valid_exterior[ii].elevation + valid_exterior[ii].height].add(valid_exterior[jj].control.flatten())
					}
				}
			}
		}
		
		exterior_heights.sort(compareNumbers)
		for(var ii=0;ii<exterior_heights.length;ii++){
			var paths = exterior_cuts[exterior_heights[ii]].gen_Real_Paths()
			if(exterior_cuts[exterior_heights[ii]].ceiling==undefined){
				for(var jj=0;jj<paths.length;jj++){
					paths[jj].push(paths[jj][0])
					
					var extension = paths[jj].slice(0)
					extension = Inset_Path(extension,8)
					
					for(var kk=0;kk<paths[jj].length-1;kk++){
						var wall = new PRIM_WALL([extension[kk],extension[kk+1]],[paths[jj][kk],paths[jj][kk+1]],exterior_heights[ii],exterior_heights[ii+1])
						wall.exterior = true
						wall_products = wall_products.concat(wall)
					}
					
					var extension = paths[jj].slice(0)
					extension.splice(extension.length-1,1)
					
					var bottom_path = new Hamr_Path(extension)
					for(var kk=0;kk<valid_exterior.length;kk++){
						if(valid_exterior[kk].elevation < exterior_heights[ii]
							&& valid_exterior[kk].elevation + valid_exterior[kk].height >= exterior_heights[ii]){
							
							bottom_path.subtract(valid_exterior[kk].control.flatten())
						}else if(valid_exterior[kk].elevation >= exterior_heights[ii]
							&& valid_exterior[kk].foundation){
								
							bottom_path.subtract(valid_exterior[kk].control.flatten())
						}
					}
					var bottom_surfaces = bottom_path.gen_Real_Paths()
					
					for(var kk=0;kk<bottom_surfaces.length;kk++){
						if(ClipperLib.Clipper.Orientation(bottom_surfaces[kk])){
						//	continue
						}
						var temp_border = new Border_Widget(undefined)
						for(var nn=0;nn<bottom_surfaces[kk].length;nn++){
							temp_border.vertices.push(new Point_Widget(bottom_surfaces[kk][nn],temp_border))
						}
						var floor = new PRIM_SURFACE(temp_border,new THREE.Vector3(0,1,0))
						floor.exterior = true
						
						surface_products.push(floor)
					}
					
				}
			}else{
				
				for(var jj=0;jj<paths.length;jj++){
					paths[jj].push(paths[jj][0])
					
					var extension = paths[jj].slice(0)
					extension = Inset_Path(extension,8)
					
					if(exterior_cuts[exterior_heights[ii-1]].ceiling){
						for(var kk=0;kk<paths[jj].length-1;kk++){
							var wall = new PRIM_WALL([extension[kk],extension[kk+1]],[paths[jj][kk],paths[jj][kk+1]],exterior_heights[ii-1],exterior_heights[ii])
							wall.exterior = true
							wall_products = wall_products.concat(wall)
						}
					}
					
					var extension = paths[jj].slice(0)
					extension.splice(extension.length-1,1)
					var bottom_path = new Hamr_Path(extension)
					for(var kk=0;kk<valid_exterior.length;kk++){
						if(valid_exterior[kk].elevation <= exterior_heights[ii]
							&& valid_exterior[kk].elevation + valid_exterior[kk].height > exterior_heights[ii]){
							
							bottom_path.subtract(valid_exterior[kk].control.flatten())
						}
					}
					
					var bottom_surfaces = bottom_path.gen_Real_Paths()
					
					for(var kk=0;kk<bottom_surfaces.length;kk++){
						if(ClipperLib.Clipper.Orientation(bottom_surfaces[kk])){
						//	continue
						}
						var temp_border = new Border_Widget(undefined)
						for(var nn=bottom_surfaces[kk].length-1;nn>=0;nn--){
							temp_border.vertices.push(new Point_Widget(bottom_surfaces[kk][nn],temp_border))
						}
						var floor = new PRIM_SURFACE(temp_border,new THREE.Vector3(0,-1,0))
						floor.exterior = true
						
						surface_products.push(floor)
					}
				}
			}
		}
		
		var uncut_walls = []
		
		while(wall_products.length>0){
			var compares = wall_products.splice(0,1)
			for(var ii=0;ii<wall_products.length;ii++){
				if(wall_products[ii].inworld[0].x==compares[0].inworld[0].x &&wall_products[ii].inworld[0].z==compares[0].inworld[0].z){
					if(wall_products[ii].inworld[1].x==compares[0].inworld[1].x &&wall_products[ii].inworld[1].z==compares[0].inworld[1].z){
						compares = compares.concat(wall_products.splice(ii,1))
						ii--
					}
				}
			}
			
			for(var ii=0;ii<compares.length-1;ii++){
				for(var jj=ii+1;jj<compares.length;jj++){
					if(compares[ii].bands[0].E==compares[jj].bands[0].H){
						compares[ii].bands[0].E = compares[jj].bands[0].E
						compares[ii].elevation = compares[jj].bands[0].E
						compares.splice(jj,1)
						jj--
					}else if(compares[ii].bands[0].H==compares[jj].bands[0].E){
						compares[ii].bands[0].H = compares[jj].bands[0].H
						compares[ii].height = compares[jj].bands[0].H
						compares.splice(jj,1)
						jj--
					}
				}
			}
			uncut_walls = uncut_walls.concat(compares)
		}
		
		
		
		
		//fix interiors
		for(var ii=0;ii<valid_interior.length;ii++){
			valid_interior[ii].elevation+=16
			valid_interior[ii].height-=32
		}
		
		//interior cuts calculation
		//valid_interior
		var interior_cuts = {}
		var interior_heights = []
		var interior_extensions = {}
		
		for(var ii=0;ii<valid_interior.length;ii++){
			var outer = valid_interior[ii].control.flatten()
			outer.reverse()
			outer.push(outer[0])
			var inner = Inset_Path(outer,-8)
			for(var jj=outer.length-1;jj>=1;jj--){
				var wall = new PRIM_WALL([inner[jj],inner[jj-1]],[outer[jj],outer[jj-1]],valid_interior[ii].elevation,valid_interior[ii].elevation + valid_interior[ii].height)
				wall.interior = true
				wall_products = wall_products.concat(wall)
			}
			var floor_border = new Border_Widget()
			var ceiling_border = new Border_Widget()
			for(var jj=0;jj<inner.length-1;jj++){
				floor_border.vertices.push(new Point_Widget(inner[jj].clone(),floor_border))
				ceiling_border.vertices.push(new Point_Widget(inner[jj].clone(),ceiling_border))
			}
			ceiling_border.move(new THREE.Vector3(0,valid_interior[ii].height,0))
			floor_border.vertices.reverse()
			var floor = new PRIM_SURFACE(floor_border,new THREE.Vector3(0,-1,0))
			var ceiling = new PRIM_SURFACE(ceiling_border,new THREE.Vector3(0,1,0))
			floor.interior = true
			ceiling.interior = true
			surface_products.push(floor)
			surface_products.push(ceiling)
		}
		//pull a wall segment, find all segments with the same insets/outsets xz
		//merge as many as possible
		//push them into products
		
		while(wall_products.length>0){
			var compares = wall_products.splice(0,1)
			for(var ii=0;ii<wall_products.length;ii++){
				if(wall_products[ii].inworld[0].x==compares[0].inworld[0].x &&wall_products[ii].inworld[0].z==compares[0].inworld[0].z){
					if(wall_products[ii].inworld[1].x==compares[0].inworld[1].x &&wall_products[ii].inworld[1].z==compares[0].inworld[1].z){
						compares = compares.concat(wall_products.splice(ii,1))
						ii--
					}
				}
			}
			
			for(var ii=0;ii<compares.length-1;ii++){
				for(var jj=ii+1;jj<compares.length;jj++){
					if(compares[ii].bands[0].E==compares[jj].bands[0].H){
						compares[ii].bands[0].E = compares[jj].bands[0].E
						compares[ii].elevation = compares[jj].bands[0].E
						compares.splice(jj,1)
						jj--
					}else if(compares[ii].bands[0].H==compares[jj].bands[0].E){
						compares[ii].bands[0].H = compares[jj].bands[0].H
						compares[ii].height = compares[jj].bands[0].H
						compares.splice(jj,1)
						jj--
					}
				}
			}
			uncut_walls = uncut_walls.concat(compares)
		}
		
		for(var ii=0;ii<valid_doors.length;ii++){
			valid_doors[ii].normal = 0
			for(var jj=0;jj<uncut_walls.length;jj++){
				uncut_walls[jj].addPortal(valid_doors[ii])
			}
		}
		
		product = product.concat(uncut_walls)
		product = product.concat(surface_products)
		
		//calculate floors
		//for each inset bottom, subtract every room in its height region (strict)
		
		//calculate noclip blocks
		return product
	}
	add_Exterior(){
		var my_child = new Hamr_Exterior_Element(this.safe_ID())
		PROTO = my_child
		CALL = "add_Child"
	}
	add_Portal(){
		var my_child = new Hamr_Portal_Element(this.safe_ID())
		PROTO = my_child
		CALL = "add_Child"
	}
	add_Room(){
		var my_child = new Hamr_Room_Element(this.safe_ID())
		PROTO = my_child
		CALL = "add_Child"
	}
	parse_Load_Text(load_text){
		var tuple = this.parse_Load_Settings(load_text)
		while(tuple[1]<load_text.length){
			tuple = gatherThoughts(load_text,tuple[1],this.save_delimiter)
			if(tuple[0][0]=="E"){
				this.add_Exterior()
				var temp = PROTO
				this.add_Child(new THREE.Vector3(),PROTO)
				temp.parse_Load_Text(tuple[0].slice(1))
			}else if(tuple[0][0]=="P"){
				this.add_Portal()
				var temp = PROTO
				this.add_Child(new THREE.Vector3(),PROTO)
				temp.parse_Load_Text(tuple[0].slice(1))
			}else if(tuple[0][0]=="R"){
				this.add_Room()
				var temp = PROTO
				this.add_Child(new THREE.Vector3(),PROTO)
				temp.parse_Load_Text(tuple[0].slice(1))
			}
		}
	}
	proto_Clone(){
		return new Hamr_Building_Element()
	}
}

class Hamr_Terrain_Element extends Hamr_Element{
	constructor(id){
		super(id)
		this.save_delimiter = "["
		this.save_signature = "T"
		this.name = "Terrain"
		
		this.control = Square_Border(512,0,this)
		
		//this.childtypes.push()
		//this.childtypetitles.push()
		
		this.methods.push("add_Control","remove_Control")
		this.methodtitles.push("Add Border Node","Remove Node")
		
		//this.settings.push()
		//this.settingtitles.push()
		//this.settingtypes.push()
	}
	add_Control(){
		CALL = "add_Node"
	}
	add_Node(position){
		this.control.add_Node(position)
		OBJECTS = this.list_Control_Objs()
		WORLD.update_Display()
		CALL = "h_move"
	}
	remove_Control(){
		CALL = "remove_Node"
	}
	remove_Node(position){
		this.control.remove_Node(position)
		OBJECTS = this.list_Control_Objs()
		WORLD.update_Display()
		CALL = "h_move"
	}
	parse_Load_Text(load_text){
		var tuple = this.parse_Load_Settings(load_text)
		while(tuple[1]<load_text.length){
			tuple = gatherThoughts(load_text,tuple[1],this.save_delimiter)
			if(tuple[0][0]=="E"){
				this.add_Exterior()
				var temp = PROTO
				this.add_Child(new THREE.Vector3(),PROTO)
				temp.parse_Load_Text(tuple[0].slice(1))
			}else if(tuple[0][0]=="P"){
				this.add_Portal()
				var temp = PROTO
				this.add_Child(new THREE.Vector3(),PROTO)
				temp.parse_Load_Text(tuple[0].slice(1))
			}else if(tuple[0][0]=="R"){
				this.add_Room()
				var temp = PROTO
				this.add_Child(new THREE.Vector3(),PROTO)
				temp.parse_Load_Text(tuple[0].slice(1))
			}
		}
	}
	proto_Clone(){
		return new Hamr_Building_Element()
	}
}

class Hamr_Region_Element extends Hamr_Element{
	constructor(id){
		super(id)
		this.save_delimiter = "|"
		this.save_signature = "R"
		this.name = "Region"
		
		this.childtypes.push("add_Building","add_Terrain")
		this.childtypetitles.push("Building","Terrain")
		
		//this.methods.push()
		//this.methodtitles.push()
		
		//this.settings.push()
		//this.settingtitles.push()
		//this.settingtypes.push()
	}
	gen_Preview_Obj(){
		var product = []
		
		var terra = 0
		for(var ii=0;ii<this.children.length;ii++){
			if(this.children[ii].name == "Terrain"){
				if(terra==0){
					terra = new Hamr_Path(this.children[ii].control.flatten())
				}else{
					terra.add(this.children[ii].control.flatten())
				}
			}
		}
		
		if(terra==0){return []}
		
		for(var ii=0;ii<this.children.length;ii++){
			if(this.children[ii].name == "Building"){
				var footprint = this.children[ii].calculate_FootPrint()
				for(var jj=0;jj<footprint.length;jj++){
					terra.subtract(footprint[jj])
				}
			}
		}
		
		var reals = terra.gen_Simple_Paths()
		for(var jj=0;jj<reals.length;jj++){
			reals[jj].reverse()
			var temp_border = new Border_Widget()
			for(var kk=0;kk<reals[jj].length;kk++){
				temp_border.vertices.push(new Point_Widget(reals[jj][kk],temp_border))
			}
			var surface = new PRIM_SURFACE(temp_border,new THREE.Vector3(0,-1,0))
			surface.front_material = Mat_Ground
			surface.edge_material = Mat_Nodraw
			surface.back_material = Mat_Nodraw
			surface.detail = true
			product.push(surface)
		}
		
		return product
	}
		
	add_Building(){
		var my_child = new Hamr_Building_Element(this.safe_ID())
		PROTO = my_child
		CALL = "add_Child"
	}
	add_Terrain(){
		var my_child = new Hamr_Terrain_Element(this.safe_ID())
		PROTO = my_child
		CALL = "add_Child"
	}
	parse_Load_Text(load_text){
		var tuple = this.parse_Load_Settings(load_text)
		while(tuple[1]<load_text.length){
			tuple = gatherThoughts(load_text,tuple[1],this.save_delimiter)
			if(tuple[0][0]=="B"){
				this.add_Building()
				var temp = PROTO
				this.add_Child(new THREE.Vector3(),PROTO)
				temp.parse_Load_Text(tuple[0].slice(1))
			}else if(tuple[0][0]=="T"){
				this.add_Terrain()
				var temp = PROTO
				this.add_Child(new THREE.Vector3(),PROTO)
				temp.parse_Load_Text(tuple[0].slice(1))
			}
		}
		
	}
	proto_Clone(){
		return new Hamr_Region_Element()
	}
}

class Hamr_World_Element extends Hamr_Element{
	constructor(id){
		super(id)
		this.save_delimiter = "="
		this.save_signature = "W"
		this.name = "World"
		
		this.childtypes.push("add_Region")
		this.childtypetitles.push("Region")
		
		//this.methods.push()
		//this.methodtitles.push()
		
		//this.settings.push()
		//this.settingtitles.push()
		//this.settingtypes.push()
	}
	add_Region(){
		var my_child = new Hamr_Region_Element(this.safe_ID())
		PROTO = my_child
		CALL = "add_Child"
	}
	remove(){
		console.log("NO")
	}
	parse_Load_Text(load_text){
		var tuple = this.parse_Load_Settings(load_text)
		while(tuple[1]<load_text.length){
			tuple = gatherThoughts(load_text,tuple[1],this.save_delimiter)
			if(tuple[0][0]=="R"){
				this.add_Region()
				var temp = PROTO
				this.add_Child(new THREE.Vector3(),PROTO)
				temp.parse_Load_Text(tuple[0].slice(1))
			}
		}
	}
	proto_Clone(){
		return new Hamr_World_Element()
	}
}



var FOCUS = {}
var SELECTABLES = []
var HELD = {}
var PROTO = 0
var settings_gui = 0

class Hamr_Hierarchy{
	preview(){
		if(this.loading){return}
		reality = scene.clone()
		reality.add( controls.getObject() );
		this.mode = 1
		OBJECTS = []
		var objects = this.child.list_Preview_Objs()
		SELECTABLES = []
		
		for(var ii=0;ii<objects.length;ii++){
			if(this.hide_interiors&&objects[ii].interior){continue}
			if(this.hide_exteriors&&objects[ii].exterior){continue}
			var meshes = objects[ii].genMesh()
			for(var jj=0;jj<meshes.length;jj++){
				reality.add(meshes[jj])
			}
		}
	}
	save(){
		console.log("Generating save text")
		var save_text = this.child.gen_Save_Text()
		console.log("Pushing save text to blorb (new tab)")
		makeTextFile(save_text);
	}
	load(){
		console.log("Openening loadfile selector")
		$('#file_selector').click();
	}
	parse_Load_File(load_text){
		console.log("Loading from selected loadfile")
		this.loading = true
		this.folder.remove(this.child.folder)
		this.child = new Hamr_World_Element()
		this.child.folder = this.folder.addFolder(this.child.name)
		this.child.folder.add(this.child,"choose").name("Select")
		this.child.folder.open()
		this.child.parent = this
		this.child.parse_Load_Text(load_text.slice(1))
		this.loading = false
		console.log("Loading complete, focusing world")
		this.child.choose()
		
	}
	export(){
		//preview(){
		if(this.loading){return}
		
		var id = 2
		var total = 'world\n\
{\n\
	"id" "1"\n'
		console.log("Generating world objects")
		var objects = this.child.list_Preview_Objs()
		
		console.log("Generating export text")
		for(var ii=0;ii<objects.length;ii++){
			if(this.hide_interiors&&objects[ii].interior){continue}
			if(this.hide_exteriors&&objects[ii].exterior){continue}
			var meshes = objects[ii].exportVMF()
			for(var jj=0;jj<meshes.length;jj++){
				//reality.add(meshes[jj])
				var product = meshes[jj].genText(id)
				total+=product[0]
				id = product[1]
			}
		}
		console.log("Pushing export text to blorb (new tab)")
		
		total+='}'
		makeTextFile(total);
	}
	constructor(){
		this.loading = false
		this.folder = new dat.GUI()
		settings_gui = new dat.GUI()
		this.options = new dat.GUI()
		FOCUS.menu = settings_gui.addFolder("PLACE HOLDER")
		this.child = 0
		this.options.add(this,"save").name("Save World")
		this.options.add(this,"load").name("Load World")
		this.options.add(this,"preview").name("Preview")
		this.hide_exteriors = false
		this.hide_interiors = false
		this.preview_options = this.options.addFolder("Preview Options")
		this.preview_options.add(this,"hide_exteriors").name("Hide Exteriors")
		this.preview_options.add(this,"hide_interiors").name("Hide Interiors")
		this.options.add(this,"export").name("Export to VMF")
		this.mode = 0
	}
	restart(){
		this.child = new Hamr_World_Element()
		this.child.folder = this.folder.addFolder(this.child.name)
		this.child.folder.add(this.child,"choose").name("Select")
		this.child.folder.open()
		this.child.parent = this
		this.child.add_Region()
		this.child.add_Child(new THREE.Vector3(0,0,0),PROTO)
	}
	update_Display(){
		if(this.loading){return}
		this.mode = 0
		var objects = this.child.list_Visible_Objs()
		SELECTABLES = objects
		reality = scene.clone()
		reality.add( controls.getObject() );
		for(var ii=0;ii<objects.length;ii++){
			reality.add(objects[ii])
		}
		VisibleGridCreator(128,1280*6)
	}
}