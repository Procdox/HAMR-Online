function Inset_Corner(A,B,C,width){
	var splitLeft = B.clone().sub(A).normalize()
	var splitRight = C.clone().sub(B).normalize()
	
	var raw_attractor = splitLeft.clone().sub(splitRight);
	raw_attractor.normalize();
	
	var test_angle = new THREE.Vector3();
	test_angle.x = -splitLeft.z;
	test_angle.z = splitLeft.x;
	
	if(raw_attractor.length()==0){
		test_angle.multiplyScalar(width);
		return B.clone().sub(test_angle)
	}

	var back_angle = Math.acos(raw_attractor.dot(splitLeft));//angle between
	raw_attractor.divideScalar(Math.sin(back_angle));
	raw_attractor.multiplyScalar(width);
	
	if(test_angle.dot(splitRight)<0){//convex
		return B.clone().sub(raw_attractor)
	}else{ //concave
		return B.clone().add(raw_attractor)
	}
}

function Inset_Path(Target,width){
	
	var splits = []
	splits.push(Target[0].clone().sub(Target[Target.length-2]).normalize())
	for(var i=1;i<Target.length;i++){
		splits.push(Target[i].clone().sub(Target[i-1]).normalize())
	}
	
	//now to create the decension angles
	var raw_attractor
	var offset

	var geometry = []
	for(var i=0;i<Target.length-1;i++){
		//going toward the center is not the bisector
		raw_attractor = splits[i].clone().sub(splits[i+1]);
		raw_attractor.normalize();
		
		var back_angle = Math.acos(raw_attractor.dot(splits[i]));//angle between
		raw_attractor.divideScalar(Math.sin(back_angle));
		raw_attractor.multiplyScalar(width);
		var test_angle = new THREE.Vector3();
		test_angle.x = -splits[i].z;
		test_angle.z = splits[i].x;
		if(test_angle.dot(splits[i+1])<0){//convex
			geometry.push(Target[i].clone().sub(raw_attractor))
		}else{ //concave
			geometry.push(Target[i].clone().add(raw_attractor))
		}
	}
	geometry.push(geometry[0].clone());
	
	return geometry

}

function displayPath(target,height){
	var geometry = new THREE.Geometry()
	var v
	var t = 0
	for(var ii=0;ii<target.length;ii++){
		v = target[ii].clone()
		v.y = height + t*2
		t++
		geometry.vertices.push(v.clone())
	}
	v.add(new THREE.Vector3(0,5,0))
	geometry.vertices.push(v)
	var line = new THREE.Line(geometry)
	reality.add(line)
}

function orientation(target){
	var vectorA = target[1].clone().sub(target[0]).normalize()
	var vectorB = target[2].clone().sub(target[0]).normalize()
	var normal = vectorA.cross(vectorB)
	return (normal.y<0)
}

function findLineIntersection(A_S,A_E,B_S,B_E){
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

function findPathIntersections(A,B){
	A.push(A[0])
	B.push(B[0])
	var product = []
	for(var ii=0;ii<A.length-1;ii++){
		for(var jj=0;jj<B.length-1;jj++){
			var result = findLineIntersection(A[ii],A[ii+1],B[jj],B[jj+1])
			if(result){
				product.push([ii,jj,result])
			}
		}
	}
	return product
}

function testFunc(){
	var A = WORLD.buildings[0].floors[0].border.flatten()
	var B = WORLD.buildings[1].floors[0].border.flatten()
	var C = findPathIntersections(A,B)
	console.log(C)
	for(var ii=0;ii<C.length;ii++){
		var pos = new Point_Widget(C[ii][2],this)
		reality.add(pos.object)
	}
}

function invert(target){
	var product = []
	for(var ii=target.length-1;ii>=0;ii--){
		product.push(target[ii])
	}
	return product
}

function clockwiseOrient(target){
	if(orientation(target)){
		return target
	}else{
		return invert(target)
	}
}

function vector2path(border){
	var product = [];
	for(var ii=0;ii<border.length;ii++){
		if(border[ii].x==0){border[ii].x=0}
		if(border[ii].z==0){border[ii].z=0}
		product.push({X: Math.round(border[ii].x),Y: Math.round(border[ii].z)})
	}
	return [product];
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

function Generate_Walls(pTarget,height,inset){
	var elevation = pTarget[0].y
	for(var ii=0;ii<pTarget.length;ii++){
		pTarget[ii].y = 0
	}
	pTarget.push(pTarget[0])
	var Target = Inset_Path(pTarget,inset)
	var product = [];
	for(var ii=0;ii<Target.length-1;ii++){
		var insets = [Target[ii],Target[ii+1]]
		var outsets = [pTarget[ii],pTarget[ii+1]]
		product.push(new PRIM_WALL(insets,outsets,elevation,elevation+height))
		
		/*var border = new Border_Widget()
		border.vertices.push(
			new Point_Widget( Target[ii].clone(),border),
			new Point_Widget( Target[ii].clone().add(new THREE.Vector3(0,height)),border),
			new Point_Widget( Target[ii+1].clone().add(new THREE.Vector3(0,height)),border),
			new Point_Widget( Target[ii+1].clone(),border)
		)
		var surface = new Surface_Pro(border)
		product.push(surface)*/
	}
	return product
}