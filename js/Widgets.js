function SnapToGrid(v){
	v.x = Math.round(v.x/64)*64;
	//v.y = Math.round(v.y/128)*roster.GRID_SIZE;
	v.z = Math.round(v.z/64)*64;
	return v;
}

var POINT_MATERIAL = new THREE.MeshBasicMaterial({color: new THREE.Color(.4,.4,.4)});
var BORDER_MATERIAL = new THREE.MeshBasicMaterial({color: new THREE.Color(.1,.4,.1)});



var Point_Widget = function(position,dad){
	this.feature = 1
	this.material = BORDER_MATERIAL.clone()
	this.dad = dad
	this.widgetType = 0
	this.position = position
	this.object = new THREE.Mesh(new THREE.CubeGeometry(16,16,16),this.material);
	this.object.position.copy(position)
	this.object.dad = this
	this.add = function(position){
		this.dad.addFrom(this)
	}
	this.remove = function(position){
		reality.remove(this.object);
		this.dad.removeChild(this)
	}
	this.move = function(vector){
		this.position.add(vector)
		this.object.position.copy(position)
		this.dad.display()
	}
	this.snap = function(){
		this.position.copy(SnapToGrid(this.position));
		this.object.position.copy(position)
	}
	this.display = function(){
		reality.remove(this.object);
		reality.add(this.object);
		return this.object
	}
	this.interact = function(){
		return [this.object]
	}
	this.clone = function(){
		return new Point_Widget(this.position.clone(),this.dad)
	}
	this.save = function(){
		return ""+this.position.x+","+this.position.y+","+this.position.z
	}
	this.load = function(worldText){
		var tuple = gatherThoughts(worldText,0,",")
		this.position.x = parseInt(tuple[0])
		tuple = gatherThoughts(worldText,tuple[1],",")
		this.position.y = parseInt(tuple[0])
		tuple = gatherThoughts(worldText,tuple[1],",")
		this.position.z = parseInt(tuple[0])
		this.object.position.copy(position)
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

var Path_Widget = function(dad){
	this.feature = 1
	this.material = BORDER_MATERIAL
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
		return -1
	}
	this.add = function(position){
		//determine part from position
		var index = this.after(position)
		if(index>=0){
			var temp = SnapToGrid(position.clone());
			this.vertices.splice(index+1,0,new Point_Widget(temp, this));
		}
		this.update()
	}
	this.addFrom = function(child){
		//determine part from position
		for(var ii=0;ii<this.vertices.length;ii++){
			if(child == this.vertices[ii]){
				var temp = SnapToGrid(this.vertices[ii].position.clone());
				this.vertices.splice(ii+1,0,new Point_Widget(temp, this));
				this.update()
				return
			}
		}
	}
	this.remove = function(position){
		this.dad.remove(this)
	}
	this.removeChild = function(child){
		for(var ii=0;ii<this.vertices.length;ii++){
			if(this.vertices[ii]==child){
				this.vertices.splice(ii,1)
				break
			}
		}
		this.update()
	}
	this.move = function(vector){
		for(var ii=0;ii<this.vertices.length;ii++){
			this.vertices[ii].move(vector);
		}
	}
	this.snap = function(){
		for(var i=0;i<this.vertices.length;i++){
			this.vertices[i].snap();
		}
		this.update()
	}
	this.update = function(){
		var geometry = new THREE.Geometry()
		for(var ii=0;ii<this.vertices.length;ii++){
			geometry.vertices.push(this.vertices[ii].position)
		}
		this.object = new THREE.Line(geometry,this.material)
		this.object.dad = this
	}
	this.display = function(){
		reality.remove(this.object)
		this.update()
		reality.add(this.object)
		return this.object
	}
	this.edit = function(){
		WORLD.update()
		for(var ii=0;ii<this.vertices.length;ii++){
			OBJECTS.push(this.vertices[ii].display())
		}
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
}

var Border_Widget = function(dad){
	this.feature = 1
	this.material = BORDER_MATERIAL
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
	this.add = function(position){
		//determine part from position
		var index = this.after(position)
		if(index>=0){
			var temp = SnapToGrid(position.clone());
			this.vertices.splice(index+1,0,new Point_Widget(temp, this));
		}
		this.update()
	}
	this.addFrom = function(child){
		//determine part from position
		for(var ii=0;ii<this.vertices.length;ii++){
			if(child == this.vertices[ii]){
				var temp = SnapToGrid(this.vertices[ii].position.clone());
				this.vertices.splice(ii+1,0,new Point_Widget(temp, this));
				this.update()
				return
			}
		}
	}
	this.remove = function(position){
		this.dad.remove(this)
	}
	this.removeChild = function(child){
		for(var ii=0;ii<this.vertices.length;ii++){
			if(this.vertices[ii]==child){
				this.vertices.splice(ii,1)
				break
			}
		}
		this.update()
	}
	this.move = function(vector){
		for(var ii=0;ii<this.vertices.length;ii++){
			this.vertices[ii].move(vector);
		}
	}
	this.snap = function(){
		for(var i=0;i<this.vertices.length;i++){
			this.vertices[i].snap();
		}
		this.update()
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
		reality.remove(this.object)
		this.update()
		reality.add(this.object)
		return this.object
	}
	this.edit = function(){
		WORLD.update()
		for(var ii=0;ii<this.vertices.length;ii++){
			OBJECTS.push(this.vertices[ii].display())
		}
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
	this.load = function(worldText){
		var thought = ""
		var textFocus = 0
		this.vertices = []
		while(textFocus<worldText.length){
			var tuple = gatherThoughts(worldText,textFocus,":")
			thought = tuple[0]
			textFocus = tuple[1]
			this.vertices.push(new Point_Widget(new THREE.Vector3(),this))
			this.vertices[this.vertices.length-1].load(thought)
		}
	}
	this.save = function(){
		var total = ""
		for(var ii=0;ii<this.vertices.length;ii++){
			total+=this.vertices[ii].save()+":"
		}
		return total
	}
}