function SnapToGrid(v){
	v.x = Math.round(v.x/32)*32;
	v.y = Math.round(v.y)//*roster.GRID_SIZE;
	v.z = Math.round(v.z/32)*32;
	return v;
}

var POINT_MATERIAL = new THREE.MeshBasicMaterial({color: new THREE.Color(.4,.4,.4)});
var SEL_POINT_MATERIAL = new THREE.MeshBasicMaterial({color: new THREE.Color(.7,.7,.7)});

var BORDER_MATERIAL = new THREE.MeshBasicMaterial({color: new THREE.Color(.1,.4,.1)});
var SEL_BORDER_MATERIAL = new THREE.MeshBasicMaterial({color: new THREE.Color(.1,.4,.4)});

var HEIGHT_MATERIAL = new THREE.MeshBasicMaterial({color: new THREE.Color(.3,.3,.5)});

var BORDER_DELIM = ":"
var POINT_DELIM = ","


var Point_Widget = function(position,dad){
	this.feature = 1
	this.material = POINT_MATERIAL.clone()
	this.dad = dad
	this.widgetType = 0
	this.position = position
	this.object = new THREE.Mesh(new THREE.CubeGeometry(16,16,16),this.material);
	var childgeo = new THREE.Geometry()
	childgeo.vertices.push(new THREE.Vector3(0,-this.position.y,0))
	childgeo.vertices.push(new THREE.Vector3(0,0,0))
	this.object.add(new THREE.Line(childgeo,HEIGHT_MATERIAL))
	this.object.position.copy(position)
	this.object.dad = this
	this.height = function(){
		return this.position.y
	}
	this.move = function(vector){
		this.position.add(vector)
		this.object.position.copy(position)
		this.object.children[0].geometry.vertices[0].y = -this.position.y
		this.object.children[0].geometry.verticesNeedUpdate = true
		if(this.dad){
			if(this.dad.feature){
				if(this.dad.object.geometry){
					this.dad.object.geometry.verticesNeedUpdate = true
				}
			}else{
				this.dad.drag(vector)
			}
		}
	}
	this.snap = function(){
		this.position.copy(SnapToGrid(this.position));
		this.object.position.copy(position)
		this.object.children[0].geometry.vertices[0].y = -this.position.y
		this.object.children[0].geometry.verticesNeedUpdate = true
	}
	this.display = function(){
		return [this.object]
	}
	this.edit = function(){
		return [this.object]
	}
	this.clone = function(){
		return new Point_Widget(this.position.clone(),this.dad)
	}
	this.gen_Save_Text = function(){
		return ""+this.position.x+POINT_DELIM+this.position.y+POINT_DELIM+this.position.z+POINT_DELIM
	}
	this.parse_Load_Text = function(worldText){
		var tuple = gatherThoughts(worldText,0,POINT_DELIM)
		this.position.x = parseInt(tuple[0])
		tuple = gatherThoughts(worldText,tuple[1],POINT_DELIM)
		this.position.y = parseInt(tuple[0])
		tuple = gatherThoughts(worldText,tuple[1],POINT_DELIM)
		this.position.z = parseInt(tuple[0])
		this.object.position.copy(position)
		this.object.children[0].geometry.vertices[0].y = -this.object.position.y
		this.object.children[0].geometry.verticesNeedUpdate = true
	}
}


function Square_Border(size,elevation,dad){
	var product = new Border_Widget(dad)
	product.vertices.push(
		new Point_Widget( new THREE.Vector3(-size,elevation,-size),product),
		new Point_Widget( new THREE.Vector3(-size,elevation,size),product),
		new Point_Widget( new THREE.Vector3(size,elevation,size),product),
		new Point_Widget( new THREE.Vector3(size,elevation,-size),product))
	return product
}


var Border_Widget = function(dad){
	this.feature = 1
	this.material = BORDER_MATERIAL.clone()
	this.dad = dad
	this.widgetType = 1
	this.vertices = [];
	this.object = {}
	this.object.dad = this
	this.after = function(position){
		var n, test_vector_A, test_vector_B, test_angle_A, test_angle_B;
		for( n=0;n<this.vertices.length-1;n++){
			test_vector_A = this.vertices[n+1].position.clone().sub(this.vertices[n].position)
			test_vector_B = position.clone().sub(this.vertices[n].position)
			test_vector_A.y = 0
			test_vector_B.y = 0
			test_angle_A = test_vector_A.clone().normalize()
			test_angle_B = test_vector_B.clone().normalize()
			if(test_angle_A.dot(test_angle_B)>.99&&test_vector_B.length()<test_vector_A.length()&&test_vector_B.length()>0){//perfect
				return n
			}
		}
		test_vector_A = this.vertices[0].position.clone().sub(this.vertices[this.vertices.length-1].position)
		test_vector_B = position.clone().sub(this.vertices[this.vertices.length-1].position)
		test_vector_A.y = 0
		test_vector_B.y = 0
		test_angle_A = test_vector_A.clone().normalize()
		test_angle_B = test_vector_B.clone().normalize()
		if(test_angle_A.dot(test_angle_B)>.99&&test_vector_B.length()<test_vector_A.length()&&test_vector_B.length()>0){//perfect
			return this.vertices.length-1
		}
		return -1
	}
	this.add_Node = function(position){
		//determine part from position
		var index = this.after(position)
		if(index>=0){
			var temp = SnapToGrid(position.clone());
			this.vertices.splice(index+1,0,new Point_Widget(temp, this));
		}
		this.update()
	}
	this.remove_Node = function(position){
		var min_score = 99999
		var min_index = -1
		for(var ii=0;ii<this.vertices.length;ii++){
			if(this.vertices[ii].position.distanceTo(position)<min_score){
				min_score = this.vertices[ii].position.distanceTo(position)
				min_index = ii
			}
		}
		if(min_score<10){
			this.vertices.splice(min_index,1)
		}
		this.update()
	}
	this.move = function(vector){

		for(var ii=0;ii<this.vertices.length;ii++){
			this.vertices[ii].move(vector);
		}
		if(this.object.geometry){
			this.object.geometry.verticesNeedUpdate = true
		}
		if(this.dad){
			this.dad.drag(vector)
		}
	}
	this.snap = function(){
		for(var i=0;i<this.vertices.length;i++){
			this.vertices[i].snap();
		}
		if(this.dad){
			if(this.dad.name){
				if(this.dad.name=="Floor"){
					if(this.dad.dad.floors[0]==this.dad){
						this.dad.dad.snap()
					}
				}else if(this.dad.name == "Room"){
					this.dad.snapChildren()
				}
			}
		}
		this.update()
	}
	this.height = function(){
		return this.vertices[0].position.y
	}
	this.update = function(){
		var geometry = new THREE.Geometry()
		var vMat =  this.material.clone()
		var hsl = vMat.color.getHSL()
		//vMat.color.setHSL(hsl.h,hsl.s,hsl.l-.3)
		for(var ii=0;ii<this.vertices.length;ii++){
			this.vertices[ii].object.material.color.setHSL(hsl.h,hsl.s,hsl.l-.3)
			geometry.vertices.push(this.vertices[ii].position)
		}
		geometry.vertices.push(this.vertices[0].position)
		this.object = new THREE.Line(geometry,this.material)
		this.object.dad = this
	}
	this.display = function(){
		this.update()
		return [this.object]
	}
	this.edit = function(){
		var objects = []
		for(var ii=0;ii<this.vertices.length;ii++){
			objects = objects.concat(this.vertices[ii].display())
		}
		return objects
	}
	this.flatten = function(){
		var product = []
		for(var ii=0;ii<this.vertices.length;ii++){
			product.push(this.vertices[ii].position.clone())
		}
		return product
	}
	this.clone = function(){
		var product = new Border_Widget(this.dad)
		for(var ii=0;ii<this.vertices.length;ii++){
			product.vertices.push(this.vertices[ii].clone())
			product.vertices[ii].dad = product
		}
		return product
	}
	this.invert = function(){
		var temp = this.flatten()
		for(var ii=0;ii<temp.length;ii++){
			this.vertices[ii].position.copy(temp[temp.length-ii-1])
		}
	}
	this.shift = function(){
		this.vertices.push(this.vertices.splice(0,1)[0])
	}
	this.calculateNormal = function(){
		var vectorA = this.vertices[1].position.clone().sub(this.vertices[0].position).normalize()
		var vectorB = this.vertices[2].position.clone().sub(this.vertices[0].position).normalize()
		var normal = vectorA.cross(vectorB).normalize()

		return normal
	}
	this.parse_Load_Text = function(worldText){
		var thought = ""
		var textFocus = 0
		this.vertices = []
		while(textFocus<worldText.length){
			var tuple = gatherThoughts(worldText,textFocus,BORDER_DELIM)
			thought = tuple[0]
			textFocus = tuple[1]
			this.vertices.push(new Point_Widget(new THREE.Vector3(),this))
			this.vertices[this.vertices.length-1].parse_Load_Text(thought)
		}
	}
	this.gen_Save_Text = function(){
		var total = ""
		for(var ii=0;ii<this.vertices.length;ii++){
			total+=this.vertices[ii].gen_Save_Text()+BORDER_DELIM
		}
		return total
	}
}


var Plane_Widget = function(dad){
	this.feature = 1
	this.material = BORDER_MATERIAL.clone()
	this.dad = dad
	this.widgetType = 1
	this.vertices = [];
	this.object = {}
	this.object.dad = this
	this.after = function(position){
		var n, test_vector_A, test_vector_B, test_angle_A, test_angle_B;
		for( n=0;n<this.vertices.length-1;n++){
			test_vector_A = this.vertices[n+1].position.clone().sub(this.vertices[n].position)
			test_vector_B = position.clone().sub(this.vertices[n].position)
			test_vector_A.y = 0
			test_vector_B.y = 0
			test_angle_A = test_vector_A.clone().normalize()
			test_angle_B = test_vector_B.clone().normalize()
			if(test_angle_A.dot(test_angle_B)>.99&&test_vector_B.length()<test_vector_A.length()&&test_vector_B.length()>0){//perfect
				return n
			}
		}
		test_vector_A = this.vertices[0].position.clone().sub(this.vertices[this.vertices.length-1].position)
		test_vector_B = position.clone().sub(this.vertices[this.vertices.length-1].position)
		test_vector_A.y = 0
		test_vector_B.y = 0
		test_angle_A = test_vector_A.clone().normalize()
		test_angle_B = test_vector_B.clone().normalize()
		if(test_angle_A.dot(test_angle_B)>.99&&test_vector_B.length()<test_vector_A.length()&&test_vector_B.length()>0){//perfect
			return this.vertices.length-1
		}
		return -1
	}
	this.add_Node = function(position){
		//determine part from position
		var index = this.after(position)
		if(index>=0){
			var temp = SnapToGrid(position.clone());
			this.vertices.splice(index+1,0,new Point_Widget(temp, this));
		}
		this.update()
	}
	this.remove_Node = function(position){
		var min_score = 99999
		var min_index = -1
		for(var ii=0;ii<this.vertices.length;ii++){
			if(this.vertices[ii].position.distanceTo(position)<min_score){
				min_score = this.vertices[ii].position.distanceTo(position)
				min_index = ii
			}
		}
		if(min_score<10){
			this.vertices.splice(min_index,1)
		}
		this.update()
	}
	this.move = function(vector){

		for(var ii=0;ii<this.vertices.length;ii++){
			this.vertices[ii].move(vector);
		}
		if(this.object.geometry){
			this.object.geometry.verticesNeedUpdate = true
		}
		if(this.dad){
			this.dad.drag(vector)
		}
	}
	this.snap = function(){
		for(var i=0;i<this.vertices.length;i++){
			this.vertices[i].snap();
		}
		if(this.dad){
			if(this.dad.name){
				if(this.dad.name=="Floor"){
					if(this.dad.dad.floors[0]==this.dad){
						this.dad.dad.snap()
					}
				}else if(this.dad.name == "Room"){
					this.dad.snapChildren()
				}
			}
		}
		this.update()
	}
	this.height = function(){
		return this.vertices[0].position.y
	}
	this.update = function(){
		var geometry = new THREE.Geometry()
		var vMat =  this.material.clone()
		var hsl = vMat.color.getHSL()
		//vMat.color.setHSL(hsl.h,hsl.s,hsl.l-.3)
		for(var ii=0;ii<this.vertices.length;ii++){
			this.vertices[ii].object.material.color.setHSL(hsl.h,hsl.s,hsl.l-.3)
			geometry.vertices.push(this.vertices[ii].position)
		}
		geometry.vertices.push(this.vertices[0].position)
		this.object = new THREE.Line(geometry,this.material)
		this.object.dad = this
	}
	this.display = function(){
		this.update()
		return [this.object]
	}
	this.edit = function(){
		var objects = []
		for(var ii=0;ii<this.vertices.length;ii++){
			objects = objects.concat(this.vertices[ii].display())
		}
		return objects
	}
	this.flatten = function(){
		var product = []
		for(var ii=0;ii<this.vertices.length;ii++){
			product.push(this.vertices[ii].position.clone())
		}
		return product
	}
	this.clone = function(){
		var product = new Border_Widget(this.dad)
		for(var ii=0;ii<this.vertices.length;ii++){
			product.vertices.push(this.vertices[ii].clone())
			product.vertices[ii].dad = product
		}
		return product
	}
	this.invert = function(){
		var temp = this.flatten()
		for(var ii=0;ii<temp.length;ii++){
			this.vertices[ii].position.copy(temp[temp.length-ii-1])
		}
	}
	this.shift = function(){
		this.vertices.push(this.vertices.splice(0,1)[0])
	}
	this.calculateNormal = function(){
		var vectorA = this.vertices[1].position.clone().sub(this.vertices[0].position).normalize()
		var vectorB = this.vertices[2].position.clone().sub(this.vertices[0].position).normalize()
		var normal = vectorA.cross(vectorB).normalize()

		return normal
	}
	this.parse_Load_Text = function(worldText){
		var thought = ""
		var textFocus = 0
		this.vertices = []
		while(textFocus<worldText.length){
			var tuple = gatherThoughts(worldText,textFocus,BORDER_DELIM)
			thought = tuple[0]
			textFocus = tuple[1]
			this.vertices.push(new Point_Widget(new THREE.Vector3(),this))
			this.vertices[this.vertices.length-1].parse_Load_Text(thought)
		}
	}
	this.gen_Save_Text = function(){
		var total = ""
		for(var ii=0;ii<this.vertices.length;ii++){
			total+=this.vertices[ii].gen_Save_Text()+BORDER_DELIM
		}
		return total
	}
}
