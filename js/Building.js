/*
IO:


Display: Passes out a flattened array of scene objects


*/

var FOUNDATION_MATERIAL = new THREE.MeshPhongMaterial( { color: 0x333333, specular: 0x111111, shininess: 5 }  )
var OUTERWALL_MATERIAL = new THREE.MeshPhongMaterial({color: 0x445A77})

var materialWallRed = new THREE.MeshPhongMaterial({color: 0xBA3435})
var materialWallBlu = new THREE.MeshPhongMaterial({color: 0x445A77})

var materialFloorRed = new THREE.MeshPhongMaterial({color: 0xFEBA89})
var materialFloorBlu = new THREE.MeshPhongMaterial({color: 0x6B6964})

var materialCeilRed = new THREE.MeshPhongMaterial({color: 0xFEBA89})
var materialCeilBlu = new THREE.MeshPhongMaterial({color: 0x6B6964})

var materialDoorRed = new THREE.MeshPhongMaterial({color: 0xFFD6AA})
var materialDoorBlu = new THREE.MeshPhongMaterial({color: 0x788987})


var Hull_Prim = function(){
	this.surfaces = [];
	this.verticies
}

var Mesh = function(){
	
}

var Surface_Pro = function(border){
	this.thickness = 8
	this.material = OUTERWALL_MATERIAL
	this.normal = border.calculateNormal()
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
	this.path = vector2path(product)
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
	this.triangulate = function(){
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
		var flat = this.triangulate()
		var faces = decompose_Shape(flat[0])
		var geo = new THREE.Geometry()
		for(var ii=0;ii<faces.length;ii++){
			geo.faces.push(new THREE.Face3(faces[ii][0],faces[ii][1],faces[ii][2]))
		}
		geo.vertices = flat[1]
		return [geo]
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
	this.exportVMF = function(){
		console.log("--exportVMF--")
		var worldObjects = []
		var flat = this.triangulate()
		console.log("decomposing")
		var faces = decompose_Shape(flat[0])
		console.log("merging")
		var shapes = merge_Tris(faces,flat[0])
		console.log("solidifying")
		for(var ii=0;ii<shapes.length;ii++){
			var product = new PRIM_SOLID()
			
			var upper = []
			var lower = []
			
			for(var jj=0;jj<shapes[ii].length;jj++){
				product.vertices.push(
					flat[1][shapes[ii][jj]].clone().sub(this.normal.clone().multiplyScalar(-this.thickness)),
					flat[1][shapes[ii][jj]].clone()
				)
				var A = 2*jj + 1
				var B = 2*jj
				var C = (2*jj + 2) % (2 * shapes[ii].length)
				product.sides.push([C,B,A])
				upper.push(A)
				lower.push(B)
			}
			upper.reverse()
			product.sides.push(lower)
			product.sides.push(upper)
			
			worldObjects.push(product)
		}
		console.log("finished")
		return worldObjects
	}
}

var Floor_Prim = function(height,dad){
	this.name = "Floor"
	this.details = ["height","wallWidth","outerThickness","calculateSurfaces"]
	this.dad = dad
	this.wallWidth = 8
	this.border = Square_Border(256,height,this)
	this.border.material = this.dad.material
	this.elevation = height
	this.outerThickness = 8
	this.height = 256
	this.display = function(){
		var product = [this.border.display()]
		return product
	}
	this.edit = function(){
		this.border.edit()
	}
	this.update = function(){
		this.dad.update()
	}
	this.move = function(vector){
		this.border.move(vector)
		this.elevation = this.border.vertices[0].position.y
		var stuff = this.display()
		for(var ii=0;ii<stuff.length;ii++){
			OBJECTS.push(stuff[ii])
		}
	}
	this.remove = function(target){
		this.dad.removeFloor(this)
	}
	this.calculateSurfaces = function(){
		track = 10
		var surfaces = Generate_Walls(this.border.flatten(),this.height,-this.wallWidth)
		for(var ii=0;ii<surfaces.length;ii++){
			if(this.dad.redTeam){
				surfaces[ii].material = materialWallRed
			}else{
				surfaces[ii].material = materialWallBlu
			}
		}
		for(var ii=0;ii<this.dad.portals.length;ii++){
			var index = this.border.after(this.dad.portals[ii].position.position)
			if(index>=0){
				var norm = surfaces[index].normal()
				var ins = this.dad.portals[ii].generateIns(norm,-this.wallWidth)
				var outs = this.dad.portals[ii].generateOuts(norm,-this.wallWidth)
				var cT = this.dad.portals[ii].calTop()
				var cB = this.dad.portals[ii].calBot()
				surfaces[index].addPortal(ins,outs,cB,cT)
			}
		}
		for(var ii=0;ii<this.dad.portals.length;ii++){
			var index = this.border.after(this.dad.portals[ii].position.position)
			if(index>=0){
				var norm = surfaces[index].normal()
				var ins = this.dad.portals[ii].generateIns(norm,-this.wallWidth)
				var outs = this.dad.portals[ii].generateOuts(norm,-this.wallWidth)
				var cT = this.dad.portals[ii].calTop()
				var cB = this.dad.portals[ii].calBot()
				surfaces[index].addPortal(ins,outs,cB,cT)
			}
		}
		return surfaces
	}
	this.save = function(){
		var total = this.border.save()+"]"
		total+=this.wallWidth+"]"+this.elevation+"]"+this.outerThickness+"]"+this.height+"]"
		return total
	}
	this.load = function(worldText){
		
		var tuple = gatherThoughts(worldText,0,"]")
		var thought = tuple[0]
		var textFocus = tuple[1]
		this.border.load(thought)
		tuple = gatherThoughts(worldText,textFocus,"]")
		thought = tuple[0]
		textFocus = tuple[1]
		this.wallWidth = parseInt(tuple[0])
		tuple = gatherThoughts(worldText,textFocus,"]")
		thought = tuple[0]
		textFocus = tuple[1]
		this.elevation = parseInt(tuple[0])
		tuple = gatherThoughts(worldText,textFocus,"]")
		thought = tuple[0]
		textFocus = tuple[1]
		this.outerThickness = parseInt(tuple[0])
		tuple = gatherThoughts(worldText,textFocus,"]")
		thought = tuple[0]
		textFocus = tuple[1]
		this.height = parseInt(tuple[0])
	}
	this.exportVMF = function(){
		var worldObjects = []
		var entityObjects = []
		
		var walls = this.calculateSurfaces()
		for(var ii=0;ii<walls.length;ii++){
			worldObjects = worldObjects.concat(walls[ii].exportVMF())
		}
		
		
		return [worldObjects,entityObjects]
	}
}

var Room_Prim = function(height,dad){
	this.name = "Room"
	this.details = ["height","elevation","wallWidth","addPlatform","addCatwalk"]
	this.dad = dad
	this.wallWidth = 4
	this.elevation = height
	this.border = Square_Border(128,height,this)
	this.border.material = this.dad.material.clone()
	var hsl = this.border.material.color.getHSL()
	this.border.material.color.setHSL(hsl.h,hsl.s+.5,hsl.l)
	this.height = 192
	this.catwalks = []
	this.platforms = []
	this.display = function(){
		var product = [this.border.display()]
		for(var ii=0;ii<this.catwalks.length;ii++){
			var stuff = this.catwalks[ii].display()
			for(var jj=0;jj<stuff.length;jj++){
				product.push(stuff[jj])
			}
		}
		for(var ii=0;ii<this.platforms.length;ii++){
			var stuff = this.platforms[ii].display()
			for(var jj=0;jj<stuff.length;jj++){
				product.push(stuff[jj])
			}
		}
		return product
	}
	this.edit = function(){
		this.border.edit()
	}
	this.update = function(){
		if(this.elevation!=this.border.vertices[0].position.y){
			this.border.move(new THREE.Vector3(0,this.elevation-this.border.vertices[0].position.y,0))
		}
		this.dad.update()
	}
	this.move = function(vector){
		this.border.move(vector)
		this.elevation = this.border.vertices[0].position.y
	}
	this.remove = function(target){
		this.dad.removeRoom(this)
	}
	this.calculateSurfaces = function(){
		track = 10
		
		this.border.invert()
		var surfaces = Generate_Walls(this.border.flatten(),this.height,-this.wallWidth)
		for(var ii=0;ii<surfaces.length;ii++){
			if(this.dad.redTeam){
				surfaces[ii].material = materialWallRed
			}else{
				surfaces[ii].material = materialWallBlu
			}
		}
		for(var ii=0;ii<this.dad.portals.length;ii++){
			var index = this.border.after(this.dad.portals[ii].position.position)
			if(index>=0){
				var norm = surfaces[index].normal()
				var ins = this.dad.portals[ii].generateIns(norm,-this.wallWidth)
				var outs = this.dad.portals[ii].generateOuts(norm,-this.wallWidth)
				
				var cT = this.dad.portals[ii].calTop()
				var cB = this.dad.portals[ii].calBot()
				surfaces[index].addPortal(ins,outs,cB,cT)
			}
		}
		var flat = this.border.flatten()
		flat.push(flat[0])
		var floor = Inset_Path(flat,-this.wallWidth)
		var tempBorder = new Border_Widget(this)
		for(var ii=0;ii<floor.length-1;ii++){
			tempBorder.vertices.push(new Point_Widget(floor[ii],tempBorder))
		}
		surfaces.push(new Surface_Pro(tempBorder.clone()))
		if(this.dad.redTeam){
			surfaces[surfaces.length-1].material = materialFloorRed
		}else{
			surfaces[surfaces.length-1].material = materialFloorBlu
		}
		tempBorder.invert()
		for(var ii=0;ii<floor.length-1;ii++){
			tempBorder.vertices[ii].position.y+=this.height
		}
		surfaces.push(new Surface_Pro(tempBorder.clone()))
		if(this.dad.redTeam){
			surfaces[surfaces.length-1].material = materialCeilRed
		}else{
			surfaces[surfaces.length-1].material = materialCeilBlu
		}
		this.border.invert()
		return surfaces
	}
	this.addPlatform = function(){
		//compute current height
		var height = this.dad.elevation
		this.platforms.push(new Platform_Prim(height,this))
		var stuff = this.display()
		for(var ii=0;ii<stuff.length;ii++){
			OBJECTS.push(stuff[ii])
		}
	}
	this.addCatwalk = function(){
		//compute current height
		var height = this.dad.elevation
		this.catwalks.push(new Catwalk_Prim(height,this))
		var stuff = this.display()
		for(var ii=0;ii<stuff.length;ii++){
			OBJECTS.push(stuff[ii])
		}
	}
	this.removeCatwalk = function(target){
		for(var ii=0;ii<this.catwalks.length;ii++){
			if(this.catwalks[ii]==target){
				this.catwalks.splice(ii,1)
				break
			}
		}
		WORLD.update()
		this.update()
	}
	this.removePlatform = function(target){
		for(var ii=0;ii<this.platforms.length;ii++){
			if(this.platforms[ii]==target){
				this.platforms.splice(ii,1)
				break
			}
		}
		WORLD.update()
		this.update()
	}
	this.save = function(){
		var total = this.border.save()+"["
		total+=this.wallWidth+"["+this.height+"["
		return total
	}
	this.load = function(worldText){
		var tuple = gatherThoughts(worldText,0,"[")
		var thought = tuple[0]
		var textFocus = tuple[1]
		this.border.load(thought)
		tuple = gatherThoughts(worldText,textFocus,"[")
		thought = tuple[0]
		textFocus = tuple[1]
		this.wallWidth = parseInt(tuple[0])
		tuple = gatherThoughts(worldText,textFocus,"[")
		thought = tuple[0]
		textFocus = tuple[1]
		this.height = parseInt(tuple[0])
	}
	this.exportVMF = function(){
		var worldObjects = []
		var entityObjects = []
		var walls = this.calculateSurfaces()
		for(var ii=0;ii<walls.length;ii++){
			worldObjects = worldObjects.concat(walls[ii].exportVMF())
		}
		return [worldObjects,entityObjects]
	}
}

var Portal_Prim = function(position,dad){
	console.log(position)
	this.name = "Portal"
	this.details = ["width","height","elevation","borderWidth"]
	this.dad = dad
	this.position = new Point_Widget(position,this)
	
	var hsl = this.dad.material.color.getHSL()
	this.position.object.material.color.setHSL(hsl.h,hsl.s+.1,hsl.l+.3)
	this.width = 64
	this.borderWidth = 8
	this.borderDepth = 0 //not in use, will be later probs
	this.height = 64	
	this.elevation = 0
	this.calBot = function(){
		return this.position.position.y - this.borderWidth
	}
	this.calTop = function(){
		return this.position.position.y + this.height + this.borderWidth
	}
	this.display = function(){
		return [this.position.display()]
	}
	this.edit = function(){
		WORLD.update()
		OBJECTS.push(this.position.display())
	}
	this.update = function(){
		if(this.elevation!=this.position.position.y){
			this.move(new THREE.Vector3(0,this.elevation-this.position.position.y,0))
		}
		this.position.display()
	}
	this.move = function(vector){
		this.position.move(vector)
		this.elevation = this.position.position.y
	}
	this.removeChild = function(){
		this.dad.removePortal(this)
	}
	this.calculateSurfaces = function(){
		if(this.A==0||this.B==0){
			return []
		}
		var product = []
		var temp = new Border_Widget(this)
		temp.vertices.push(new Point_Widget(this.A[0].clone(),temp))
		temp.vertices.push(new Point_Widget(this.B[1].clone(),temp))
		temp.vertices.push(new Point_Widget(this.B[0].clone(),temp))
		temp.vertices.push(new Point_Widget(this.A[1].clone(),temp))
		product.push(new Surface_Pro(temp))
		var temp = new Border_Widget(this)
		temp.vertices.push(new Point_Widget(this.A[1].clone()
			.add(new THREE.Vector3(0,this.height,0))
			,temp))
		temp.vertices.push(new Point_Widget(this.B[0].clone()
			.add(new THREE.Vector3(0,this.height,0))
			,temp))
		temp.vertices.push(new Point_Widget(this.B[1].clone()
			.add(new THREE.Vector3(0,this.height,0))
			,temp))
		temp.vertices.push(new Point_Widget(this.A[0].clone()
			.add(new THREE.Vector3(0,this.height,0))
			,temp))
		product.push(new Surface_Pro(temp))
		
		var offset = this.A[0].clone().sub(this.A[1]).normalize().multiplyScalar(this.borderWidth)
		this.A[0].sub(offset)
		this.A[1].add(offset)
		this.B[0].add(offset)
		this.B[1].sub(offset)
		
		var temp = new Border_Widget(this)
		temp.vertices.push(new Point_Widget(this.A[0].clone()
			.add(new THREE.Vector3(0,0,0))
			,temp))
		temp.vertices.push(new Point_Widget(this.A[0].clone()
			.add(new THREE.Vector3(0,this.height,0))
			,temp))
		temp.vertices.push(new Point_Widget(this.B[1].clone()
			.add(new THREE.Vector3(0,this.height,0))
			,temp))
		temp.vertices.push(new Point_Widget(this.B[1].clone()
			.add(new THREE.Vector3(0,0,0))
			,temp))
		product.push(new Surface_Pro(temp))
		
		var temp = new Border_Widget(this)
		temp.vertices.push(new Point_Widget(this.B[0].clone()
			.add(new THREE.Vector3(0,0,0))
			,temp))
		temp.vertices.push(new Point_Widget(this.B[0].clone()
			.add(new THREE.Vector3(0,this.height,0))
			,temp))
		temp.vertices.push(new Point_Widget(this.A[1].clone()
			.add(new THREE.Vector3(0,this.height,0))
			,temp))
		temp.vertices.push(new Point_Widget(this.A[1].clone()
			.add(new THREE.Vector3(0,0,0))
			,temp))
		product.push(new Surface_Pro(temp))
		
		
		for(var ii=0;ii<4;ii++){
			product[ii].thickness = this.borderWidth
			if(this.dad.redTeam){
				product[ii].material = materialDoorRed
			}else{
				product[ii].material = materialDoorBlu
			}
		}
		return product
	}
	this.generateIns = function(normal,width){
		var offset = normal.clone()
		var extrusion = normal.clone().normalize().multiplyScalar(width)
		offset = new THREE.Vector3(offset.z,offset.y,-offset.x)
		//offset.x, offset.z = offset.z, -offset.x
		offset.multiplyScalar(this.width/2)
		offset.multiplyScalar(1+this.borderWidth/offset.length())
		var product = []
		product.push(
			this.position.position.clone()
				.add(offset)
				.add(extrusion)
				.add(new THREE.Vector3(0,0,0)))
		product.push(
			this.position.position.clone()
				.sub(offset)
				.add(extrusion)
				.add(new THREE.Vector3(0,0,0)))
		if(this.A==0){
			this.A = [product[0].clone(),product[1].clone()]
		}else{
			this.B = [product[0].clone(),product[1].clone()]
		}
		return product
	}
	this.generateOuts = function(normal,width){
		var offset = normal.clone()
		var extrusion = normal.clone().normalize().multiplyScalar(width)
		offset = new THREE.Vector3(offset.z,offset.y,-offset.x)
		//offset.x, offset.z = offset.z, -offset.x
		offset.multiplyScalar(this.width/2)
		offset.multiplyScalar(1+this.borderWidth/offset.length())
		var product = []
		product.push(
			this.position.position.clone()
				.add(offset)
				.add(new THREE.Vector3(0,0,0)))
		product.push(
			this.position.position.clone()
				.sub(offset)
				.add(new THREE.Vector3(0,0,0)))
		return product
	}
	this.generateCut = function(normal,width){
		var offset = normal.clone()
		var extrusion = normal.clone().normalize().multiplyScalar(width)
		offset = new THREE.Vector3(offset.z,offset.y,-offset.x)
		//offset.x, offset.z = offset.z, -offset.x
		offset.multiplyScalar(this.width/2)
		var product = new Border_Widget(this)
		if(this.elevation>0){
			product.vertices.push(
				new Point_Widget(
					this.position.position.clone()
					.add(offset)
					.add(extrusion)
					.add(new THREE.Vector3(0,this.elevation,0)),product))
			product.vertices.push(
				new Point_Widget(
					this.position.position.clone()
					.add(offset)
					.add(extrusion)
					.add(new THREE.Vector3(0,this.height+this.elevation,0)),product))
			product.vertices.push(
				new Point_Widget(
					this.position.position.clone()
					.sub(offset)
					.add(extrusion)
					.add(new THREE.Vector3(0,this.height+this.elevation,0)),product))
			product.vertices.push(
				new Point_Widget(
					this.position.position.clone()
					.sub(offset)
					.add(extrusion)
					.add(new THREE.Vector3(0,this.elevation,0)),product))
		}else{
			product.vertices.push(
				new Point_Widget(
					this.position.position.clone()
					.add(offset)
					.add(extrusion)
					.add(new THREE.Vector3(0,0,0)),product))
			product.vertices.push(
				new Point_Widget(
					this.position.position.clone()
					.add(offset)
					.add(extrusion)
					.add(new THREE.Vector3(0,this.height,0)),product))
			product.vertices.push(
				new Point_Widget(
					this.position.position.clone()
					.sub(offset)
					.add(extrusion)
					.add(new THREE.Vector3(0,this.height,0)),product))
			product.vertices.push(
				new Point_Widget(
					this.position.position.clone()
					.sub(offset)
					.add(extrusion)
					.add(new THREE.Vector3(0,0,0)),product))	
		}
		return product
	}
	this.save = function(){
		var total = this.position.save()+"["
		total+=this.width+"["+this.height+"["+this.elevation+"["
		return total
	}
	this.load = function(worldText){
		var tuple = gatherThoughts(worldText,0,"[")
		var thought = tuple[0]
		var textFocus = tuple[1]
		this.position.load(thought)
		tuple = gatherThoughts(worldText,textFocus,"[")
		thought = tuple[0]
		textFocus = tuple[1]
		this.width = parseInt(tuple[0])
		tuple = gatherThoughts(worldText,textFocus,"[")
		thought = tuple[0]
		textFocus = tuple[1]
		this.height = parseInt(tuple[0])
		tuple = gatherThoughts(worldText,textFocus,"[")
		thought = tuple[0]
		textFocus = tuple[1]
		this.elevation = parseInt(tuple[0])
		
	}
	this.exportVMF = function(){
		var worldObjects = []
		var entityObjects = []
		var walls = this.calculateSurfaces()
		for(var ii=0;ii<walls.length;ii++){
			worldObjects = worldObjects.concat(walls[ii].exportVMF())
		}
		return [worldObjects,entityObjects]
	}
}

var Platform_Prim = function(height,dad){
	this.name = "Platform"
	this.details = ["underFill","height","thickness"]
	this.underFill = true
	this.dad = dad
	this.border = Square_Border(64,height+32,this)
	this.height = 32
	this.thickness = 16
	this.update = function(){
		this.dad.update()
	}
	this.edit = function(){
		this.border.edit()
	}
	this.display = function(){
		return [this.border.display()]
	}
	this.remove = function(){
		this.dad.removePlatform(this)
	}
}

var Catwalk_Prim = function(height,dad){
	this.name = "Catwalk"
	this.details = ["underFill","width","thickness"]
	this.path = new Path_Widget(this)
	this.dad = dad
	this.underFill = true
	this.height = 32
	this.width = 64
	this.thickness = 16
	this.path.vertices.push(new Point_Widget(new THREE.Vector3(0,height+32,0),this.path))
	this.path.vertices.push(new Point_Widget(new THREE.Vector3(128,height+32,0),this.path))
	this.display = function(){
		track = 0
		var product = [this.path.display()]
		var temp = this.path.flatten()
		
		var Front = temp[1].clone().sub(temp[0]).normalize().multiplyScalar(this.width)
		var ox = Front.x
		Front.x = -Front.z
		Front.z = ox
		//Front.x,Front.z = -Front.z,Front.x
		var LeftBound = [temp[0].clone().add(Front)]
		var RightBound = [temp[0].clone().sub(Front)]
		for(var ii=1;ii<temp.length-1;ii++){
			RightBound.push(Inset_Corner(temp[ii-1],temp[ii],temp[ii+1],this.width))
			LeftBound.push(Inset_Corner(temp[ii-1],temp[ii],temp[ii+1],-this.width))
		}
		
		var Back = temp[temp.length-2].clone().sub(temp[temp.length-1]).normalize().multiplyScalar(this.width)
		//Back.x,Back.z = -Back.z,Back.x
		ox = Back.x
		Back.x = -Back.z
		Back.z = ox
		
		LeftBound.push(temp[temp.length-1].clone().sub(Back))
		RightBound.push(temp[temp.length-1].clone().add(Back))
		
		displayPath(LeftBound)
		displayPath(RightBound)
		
		return product
	}
	this.edit = function(){
		this.path.edit()
	}
	this.remove = function(){
		this.dad.removeCatwalk(this)
	}
}

var Building_Prim = function(dad){
	this.name = "Building"
	this.details = ["baseElevation","addFloor","addRoom","addPortal","calculateSurfaces","redTeam"]
	this.material = new THREE.MeshBasicMaterial();
	this.material.color.setHSL(Math.random(),.3,.5)
	this.baseElevation = 0
	this.dad = dad
	this.redTeam = false
	this.floors = [new Floor_Prim(0,this)]
	this.rooms = []
	this.portals = []
	this.display = function(){
		var product = []
		for(var ii=0;ii<this.floors.length;ii++){
			var stuff = this.floors[ii].display()
			for(var jj=0;jj<stuff.length;jj++){
				product.push(stuff[jj])
			}
		}
		for(var ii=0;ii<this.rooms.length;ii++){
			var stuff = this.rooms[ii].display()
			for(var jj=0;jj<stuff.length;jj++){
				product.push(stuff[jj])
			}
		}
		for(var ii=0;ii<this.portals.length;ii++){
			var stuff = this.portals[ii].display()
			for(var jj=0;jj<stuff.length;jj++){
				product.push(stuff[jj])
			}
		}
		return product
	}
	this.addRoom = function(worldText){
		this.rooms.push(new Room_Prim(this.baseElevation,this))
		if(worldText!=undefined){
			this.rooms[this.rooms.length-1].load(worldText)
		}
		var stuff = this.rooms[this.rooms.length-1].display()
		for(var ii=0;ii<stuff.length;ii++){
			OBJECTS.push(stuff[ii])
		}
	}
	this.addPortal = function(worldText){
		this.portals.push(new Portal_Prim(new THREE.Vector3(0,this.elevation,0),this))
		if(worldText!=undefined){
			this.portals[this.portals.length-1].load(worldText)
		}
		var stuff = this.portals[this.portals.length-1].display()
		for(var ii=0;ii<stuff.length;ii++){
			OBJECTS.push(stuff[ii])
		}
	}
	this.addFloor = function(worldText){
		//compute current height
		
		if(worldText==undefined){
			var height = this.baseElevation+this.floors[this.floors.length-1].elevation+this.floors[this.floors.length-1].height;
			var last_floor = this.floors[this.floors.length-1].border.clone()
			this.floors.push(new Floor_Prim(height,this))
			this.floors[this.floors.length-1].border = last_floor
			this.floors[this.floors.length-1].border.move(new THREE.Vector3(0,this.floors[this.floors.length-1].height,0))
			this.floors[this.floors.length-1].border.dad = this.floors[this.floors.length-1]
		}else{
			this.floors.push(new Floor_Prim(0,this))
			this.floors[this.floors.length-1].load(worldText)
		}
		this.update()
		var stuff = this.display()
		for(var ii=0;ii<stuff.length;ii++){
			OBJECTS.push(stuff[ii])
		}
	}	
	this.update = function(){
		var height = this.baseElevation
		if(this.floors[0].elevation!=this.height){
			this.move(new THREE.Vector3(0,height-this.floors[0].elevation,0))
		}
		for(var ii=0;ii<this.floors.length;ii++){
			var d = height-this.floors[ii].elevation
			this.floors[ii].move(new THREE.Vector3(0,d,0))
			height += this.floors[ii].height
		}
	}
	this.removeFloor = function(target){
		for(var ii=0;ii<this.floors.length;ii++){
			if(this.floors[ii]==target){
				this.floors.splice(ii,1)
				break
			}
		}
		if(this.floors.length==0){
			this.dad.removeBuilding(this)
		}
		WORLD.update()
		this.update()
	}
	this.removeRoom = function(target){
		for(var ii=0;ii<this.rooms.length;ii++){
			if(this.rooms[ii]==target){
				this.rooms.splice(ii,1)
				break
			}
		}
		WORLD.update()
	}
	this.move = function(vector){
		console.log(vector)
		for(var ii=0;ii<this.floors.length;ii++){
			this.floors[ii].move(vector)
		}
		for(var ii=0;ii<this.rooms.length;ii++){
			this.rooms[ii].move(vector)
		}
		for(var ii=0;ii<this.portals.length;ii++){
			this.portals[ii].move(vector)
		}
	}
	this.verifyGeometry = function(){
		
	}
	this.calculateSurfaces = function(){
		track = 200
		var surfaces = []
		for(var ii=0;ii<this.portals.length;ii++){
			this.portals[ii].A = 0
			this.portals[ii].B = 0
		}
		for(var ii=0;ii<this.floors.length;ii++){
			surfaces = surfaces.concat(this.floors[ii].calculateSurfaces())
		}
		for(var ii=0;ii<this.rooms.length;ii++){
			surfaces = surfaces.concat(this.rooms[ii].calculateSurfaces())
		}
		for(var ii=0;ii<this.portals.length;ii++){
			surfaces = surfaces.concat(this.portals[ii].calculateSurfaces())
		}
		return surfaces
	}
	this.save = function(){
		var total = ""
		for(var ii=0;ii<this.floors.length;ii++){
			total += "F"+this.floors[ii].save() + ";"
		}
		for(var ii=0;ii<this.rooms.length;ii++){
			total += "R"+this.rooms[ii].save() + ";"
		}
		for(var ii=0;ii<this.portals.length;ii++){
			total += "P"+this.portals[ii].save() + ";"
		}
		return total
	}
	this.load = function(worldText){
		var tuple
		var thought = ""
		var textFocus = 0
		
		this.floors = []
		while(textFocus<worldText.length){
			tuple = gatherThoughts(worldText,textFocus,";")
			thought = tuple[0]
			textFocus = tuple[1]
			if(thought[0]=="F"){
				this.addFloor(thought.slice(1))
			}
			if(thought[0]=="R"){
				this.addRoom(thought.slice(1))
			}
			if(thought[0]=="P"){
				this.addPortal(thought.slice(1))
			}
		}
	}
	this.exportVMF = function(){
		var worldObjects = []
		var entityObjects = []
		/*for(var ii=0;ii<this.portals.length;ii++){
			this.portals[ii].A = 0
			this.portals[ii].B = 0
		}
		for(var ii=0;ii<this.floors.length;ii++){
			var product = this.floors[ii].exportVMF()
			worldObjects = worldObjects.concat(product[0])
			entityObjects = entityObjects.concat(product[1])
		}
		for(var ii=0;ii<this.rooms.length;ii++){
			var product = this.rooms[ii].exportVMF()
			worldObjects = worldObjects.concat(product[0])
			entityObjects = entityObjects.concat(product[1])
		}
		for(var ii=0;ii<this.portals.length;ii++){
			var product = this.portals[ii].exportVMF()
			worldObjects = worldObjects.concat(product[0])
			entityObjects = entityObjects.concat(product[1])
		}*/
		var temp = this.calculateSurfaces()
		for(var ii=0;ii<temp.length;ii++){
			worldObjects = worldObjects.concat(temp[ii].exportVMF())
		}
		return [worldObjects,entityObjects]
	}
}

var World_Prim = function(){
	this.name = "World"
	this.details = ["addBuilding"]
	this.border = Square_Border(1024,0,this)
	this.pathElevations = []
	this.worldColor = "#ffae23"
	this.buildings = []
	this.catWalks = []
	this.addBuilding = function(worldText){
		this.buildings.push(new Building_Prim(this))
		if(worldText!=undefined){
			this.buildings[this.buildings.length-1].load(worldText)
		}
		this.update()
	}
	this.save = function(){
		var total = this.border.save()+"|"
		for(var ii=0;ii<this.buildings.length;ii++){
			total += "B"+this.buildings[ii].save() + "|"
		}
		makeTextFile(total);
	}
	this.load = function(){
		$('#file_selector').click();
	}
	this.applyText = function(worldText){
		var tuple = gatherThoughts(worldText,0,"|")
		var thought = tuple[0]
		var textFocus = tuple[1]
		
		this.buildings = []
		this.border.load(thought)
		while(textFocus<worldText.length){
			tuple = gatherThoughts(worldText,textFocus,"|")
			thought = tuple[0]
			textFocus = tuple[1]
			if(thought[0]=="B"){
				this.addBuilding(thought.slice(1))
			}
		}
		this.update()
	}
	this.remove = function(){}
	this.display = function(){
		
	}
	this.update = function(){
		reality = scene.clone()
		OBJECTS = [this.border.display()]
		for(var ii=0;ii<this.buildings.length;ii++){
			var stuff = this.buildings[ii].display()
			for(var jj=0;jj<stuff.length;jj++){
				OBJECTS.push(stuff[jj])
			}
		}
	}
	this.edit = function(){
		this.border.edit()
	}
	this.removeBuilding = function(target){
		for(var ii=0;ii<this.buildings.length;ii++){
			if(this.buildings[ii]==target){
				this.buildings.splice(ii,1)
				break
			}
		}
		WORLD.update()
	}
	this.calculateSurfaces = function(){
		track = 0
		var surfaces = []
		for(var ii=0;ii<this.buildings.length;ii++){
			surfaces = surfaces.concat(this.buildings[ii].calculateSurfaces())
		}
		for(var ii=0;ii<surfaces.length;ii++){
			var geos = surfaces[ii].genMesh()
			for(var jj=0;jj<geos.length;jj++){
				geos[jj].computeFaceNormals()
				geos[jj].computeVertexNormals()
				geos[jj].computeMorphNormals()
				reality.add(new THREE.Mesh(geos[jj],surfaces[ii].material))
			}
		}
		
		return surfaces
	}
	this.exportVMF = function(){
		var worldObjects = []
		var entityObjects = []
		for(var ii=0;ii<this.buildings.length;ii++){
			var product = this.buildings[ii].exportVMF()
			worldObjects = worldObjects.concat(product[0])
			entityObjects = entityObjects.concat(product[1])
		}
		//shit
		console.log(worldObjects)
		var id = 2
		var total = 'world\n\
{\n\
	"id" "1"\n'
		for(var ii=0;ii<worldObjects.length;ii++){
			var product = worldObjects[ii].genText(id)
			total+=product[0]
			id = product[1]
		}
		total+='}'
		makeTextFile(total);
	}
}


//The Base floor of a building is widened and formalized into a foundation
//Each floor is then inset by -8 HU
//Rooms can touch floor walls, and other rooms, but may not intersect.
//Rooms are inset by 8 HU