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

function displayPath(target,height){
	var geometry = new THREE.Geometry()
	var v

	if(!target.length>0){return}

	for(var ii=0;ii<target[0].length;ii++){
		v = new THREE.Vector3(target[0][ii].X,height,target[0][ii].Y)
		geometry.vertices.push(v)
	}
	v = new THREE.Vector3(target[0][0].X,height,target[0][0].Y)
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
