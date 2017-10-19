//Tests

var DEBUG_WEDGE = false

function FollowingSees(polygon, pred_a, pred_b){
  //is difference vector within eachs internal angle (within theta of the normal)

  if(!InFollowingAngle(pred_a, pred_b)||!InFollowingAngle(pred_b, pred_a)){
    return false
  }

  //create stunted sgment
  var offset = pred_a.next_edge.point.point.clone()
    .sub(pred_b.next_edge.point.point).normalize()

  var A = pred_a.next_edge.point.point.clone()
    .sub(offset)
  var B = pred_b.next_edge.point.point.clone()
    .add(offset)

  function test_Interset(target){
    return find_Line_Intersection(target.point.point,
      target.next_edge.point.point, A, B)
  }

  return (polygon.FindEdge(test_Interset) == 0)

}

function InFollowingAngle(w,p){
  var origin = p.next_edge.point.point

  var offset = w.next_edge.point.point.clone()
    .sub(origin).normalize()

  var left = p.point.point.clone()
    .sub(origin).normalize()
  var right = p.next_edge.next_edge.point.point.clone()
    .sub(origin).normalize()

  var n = left.clone().add(right).normalize()

  if(IsFollowingReflexive(p)){
    n.multiplyScalar(-1)
  }

  var theta = Math.acos(n.dot(left))
  var test = Math.acos(n.dot(offset))

  return test < theta
}

function InFollowingWedge(w,p){
  var origin = p.next_edge.point.point

  var offset = w.next_edge.point.point.clone()
    .sub(origin).normalize()

  var left = p.point.point.clone()
    .sub(origin).normalize()
  var right = p.next_edge.next_edge.point.point.clone()
    .sub(origin).normalize()

  var n = left.clone().add(right).normalize()

  if(IsFollowingReflexive(p)){
    n.multiplyScalar(-1)
    left.multiplyScalar(-1)
  }

  var theta = Math.acos(n.dot(left))
  var test = Math.acos(n.dot(offset))

  return test < theta
}

//Polygon Boolean Filters

function IterateClip(old_clip, intersect){
  var next_clip = new ClipperLib.Paths();
  var clip = new ClipperLib.Clipper();

  clip.AddPaths(old_clip, ClipperLib.PolyType.ptSubject, true);
  clip.AddPaths(intersect, ClipperLib.PolyType.ptClip, true);

  clip.StrictlySimple = true

  clip.Execute(ClipperLib.ClipType.ctIntersection, next_clip,
    ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

  ClipperLib.Clipper.CleanPolygons(next_clip)

  return next_clip
}

function SetupClip(poly){
  return vector_Array_To_Path(poly.ListPointsRaw())
}

function GenFollowingWedge(clip, p, debug=false){

  var origin = p.next_edge.point.point

  var left = p.point.point.clone()
    .sub(origin).normalize()
  var right = p.next_edge.next_edge.point.point.clone()
    .sub(origin).normalize()

  if(left.dot(right)<-.997){
    return GenLeftPlane(clip,p,p.next_edge,debug)
  }

  var n = left.clone().add(right).normalize()

  if(IsFollowingReflexive(p)){
    left.multiplyScalar(-1)
    n.multiplyScalar(-1)
    right.multiplyScalar(-1)
  }


  left.multiplyScalar(10000)
  n.multiplyScalar(10000)
  right.multiplyScalar(10000)

  var path =[[{X:origin.x, Y:origin.z},
    {X:origin.x + left.x, Y:origin.z + left.z},
    {X:origin.x + n.x, Y:origin.z + n.z},
    {X:origin.x + right.x, Y:origin.z + right.z}]]

  if(!ClipperLib.Clipper.Orientation(path[0])){
  	ClipperLib.Clipper.ReversePaths(path)
  }

  if(debug){
    DEBUG_CURVES.push(path)
  }

  //DEBUG_CURVES.push(path)
  return IterateClip(clip, path)
}

function GenLeftPlane(clip,a,b, debug=false){
  var offset = b.point.point.clone().sub(a.point.point)
  offset.normalize()
  offset.multiplyScalar(10000)

  var Near_A = {X:a.point.point.x + offset.x, Y:a.point.point.z + offset.z}
  var Near_B = {X:b.point.point.x - offset.x, Y:b.point.point.z - offset.z}

  var Far_A = {X:Near_A.X + offset.z, Y:Near_A.Y - offset.x}
  var Far_B = {X:Near_B.X + offset.z, Y:Near_B.Y - offset.x}

  var path = [[Near_A,Near_B,Far_B,Far_A]]

  if(!ClipperLib.Clipper.Orientation(path[0])){
  	ClipperLib.Clipper.ReversePaths(path)
  }

  if(debug){
    DEBUG_CURVES.push(path)
  }

  return IterateClip(clip, path)
}

function GenTriangle(clip,a,b,c, debug = false){
  var A = {X:a.point.point.x,Y:a.point.point.z}
  var B = {X:b.point.point.x,Y:b.point.point.z}
  var C = {X:c.point.point.x,Y:c.point.point.z}

  var path = [[A,B,C]]

  if(!ClipperLib.Clipper.Orientation(path[0])){
  	ClipperLib.Clipper.ReversePaths(path)
  }

  if(debug){
    DEBUG_CURVES.push(path)
  }

  return IterateClip(clip, path)
}

function GenKernel(clip, poly, debug=false){
  var kernel = SetupClip(poly)
  var edges = poly.ListEdges()
  for(var ii=0;ii<edges.length;ii++){
    kernel = GenFollowingWedge(kernel, edges[ii], DEBUG_WEDGE)
  }

  if(debug){
    DEBUG_CURVES.push(kernel)
  }

  return IterateClip(clip, kernel)
}

function PointFromClip(clip){
  var midpoint = new THREE.Vector3(0,0,0)

  for(var ii=0;ii<clip[0].length;ii++){
    midpoint.x += clip[0][ii].X
    midpoint.z += clip[0][ii].Y
  }

  midpoint.divideScalar(clip[0].length)

  return midpoint
}

//iterator tests

function findReflexive(target){
  return !target.next_edge.convex
}

function findReflexiveConsecutive(target){
  return (!target.next_edge.convex &&
    !target.next_edge.next_edge.convex)
}

function findReflexiveSep(target){
  return (!target.next_edge.convex &&
    !target.next_edge.next_edge.next_edge.convex)
}

function findReflexiveTriple(target){
  return (!target.next_edge.convex &&
    !target.next_edge.next_edge.convex &&
    !target.next_edge.next_edge.next_edge.convex)
}
