//ASSUME CCW winding

var DEBUG_EDGE_ID = 0
var DEBUG_FACE_ID = 0

class HALF_Point {
  constructor(location){
    this.edge = 0
    this.point = location
  }
  ListAdjacentPoints(){
    var focus = this.edge
    var Points = []

    do{
      Points.push(focus.next_edge.point)
      focus = focus.pair_edge.next_edge
    }while(focus != this.edge)

    return Points
  }
  ListLeavingEdges(){
    var focus = this.edge
    var Edges = []

    do{
      Edges.push(focus)
      focus = focus.pair_edge.next_edge
    }while(focus != this.edge)

    return Edges
  }
  ListFaces(){
    var focus = this.edge
    var Faces = []

    do{
      Faces.push(focus.left_face)
      focus = focus.pair_edge.next_edge
    }while(focus != this.edge)

    return Faces
  }
  FindAdjacentPoints(consider){
    var focus = this.edge

    do{
      if(consider(focus.next_edge.point)){
        return focus.next_edge.point
      }
      focus = focus.pair_edge.next_edge
    }while(focus != this.edge)

    return 0
  }
  FindLeavingEdge(consider){
    var focus = this.edge

    do{
      if(consider(focus))
      {
        return focus
      }
      focus = focus.pair_edge.next_edge
    }while(focus != this.edge)

    return 0
  }
  FindFace(consider){
    var focus = this.edge

    do{
      if(consider(focus.left_face))
      {
        return focus.left_face
      }

      focus = focus.pair_edge.next_edge
    }while(focus != this.edge)

    return 0
  }
}


function IsFollowingConvex(ref){
  var Right = ref.point.point
  var Root = ref.next_edge.point.point
  var Left = ref.next_edge.next_edge.point.point

  var A = Right.clone().sub(Root)
  var B = Left.clone().sub(Root)

  var dot00 = A.dot(A)
  var dot01 = A.dot(B)
  var dot11 = B.dot(B)


  var ox = A.x
  A.x = -A.z
  A.z = ox

  return A.dot(B) >= 0
}
function IsFollowingReflexive(ref){
  return !IsFollowingConvex(ref)
}

class HALF_Face {
  constructor(link){
    this.edge = link
    this.debug_id = DEBUG_FACE_ID++
  }
  DebugCheck(){
    var focus = this.edge

    do{
      console.assert(typeof(focus) !== 'undefined', 'unedefined edge!')
      console.assert(typeof(focus.pair_edge) !== 'undefined', 'unedefined pair edge!')
      console.assert(typeof(focus.point) !== 'undefined', 'unedefined point!')
      console.assert(focus.left_face == this, 'incorrectly assigned face!')

      focus = focus.next_edge
    }while(focus && focus != this.edge)
  }
  EdgeBefore(a){
    var focus = this.edge

    do{
      if(focus.next_edge == a)
      {
        return focus
      }
      focus = focus.next_edge
    }while(focus != this.edge)

    return 0
  }
  VerifyEdges(){
    var focus = this.edge

    //remove any internal edges (possibly created by merges)
    do{
      if(focus.next_edge == focus.pair_edge){

        var last = this.EdgeBefore(focus)
        focus.pair_edge.point.edge = 0
        focus.pair_edge.point = 0
        focus.point.edge = focus.pair_edge.next_edge
        last.next_edge = focus.pair_edge.next_edge

        focus.pair_edge.pair_edge = 0
        focus.pair_edge = 0

        focus = last
        this.edge = last
      }

      focus = focus.next_edge
    }while(focus != this.edge)

    //set all faces to point at meeee
    do{
      focus.left_face = this

      focus = focus.next_edge
    }while(focus != this.edge)
  }
  ListPointsRaw(){
    var focus = this.edge
    var Points = []

    do{
      Points.push(focus.point.point)
      focus = focus.next_edge
    }while(focus!=this.edge)

    return Points
  }
  ListPoints(){
    var focus = this.edge
    var Points = []

    do{
      Points.push(focus.point)
      focus = focus.next_edge
    }while(focus!=this.edge)

    return Points
  }
  ListEdges(){
    var focus = this.edge
    var Edges = []

    do{
      Edges.push(focus)
      focus = focus.next_edge
    }while(focus != this.edge)

    return Edges
  }
  ListAdjacentFaces(){
    var focus = this.edge
    var Faces = []

    do{
      Faces.push(focus.pair_edge.left_face)
      focus = focus.next_edge
    }while(focus != this.edge)

    return Faces
  }
  Size(){
    var focus = this.edge
    var count = 0

    do{
      count++
      focus = focus.next_edge
    }while(focus!=this.edge)

    return count
  }
  FindPoint(consider){
    var focus = this.edge
    do{
      if(consider(focus.point))
      {
        return focus.point
      }
      focus = focus.next_edge
    }while(focus != this.edge)

    return 0
  }
  FindEdge(consider){
    var focus = this.edge

    do{
      if(consider(focus)){ return focus }
      focus = focus.next_edge
    }while(focus != this.edge)

    return 0
  }
  FindAdjacentFace(consider){
    var focus = this.edge

    do{
      if(consider(focus.pair_edge.left_face))
      {
        return focus.pair_edge.left_face
      }
      focus = focus.next_edge
    }while(focus != this.edge)

    return 0
  }
  SplitFaceBetween(a,b){
    //a and b are leading edges
    var local_half_edge = new HALF_Edge()
    var partner_half_edge = new HALF_Edge()

    partner_half_edge.pair_edge = local_half_edge
    local_half_edge.pair_edge = partner_half_edge

    b.InsertAfter(partner_half_edge)
    a.InsertAfter(local_half_edge)

    var partner_face = new HALF_Face(a)
    this.edge = b

    partner_face.VerifyEdges()
    this.VerifyEdges()

    return partner_face
  }
  MergeAcrossEdge(a){
    //delete edge and its pair after sewing
    var op = a.pair_edge.left_face

    var local_last = this.EdgeBefore(a)
    var op_last = op.EdgeBefore(a.pair_edge)

    local_last.next_edge = a.pair_edge.next_edge
    op_last.next_edge = a.next_edge

    //remove all possible references to the deleted edges
    a.point.edge = a.pair_edge.next_edge
    a.pair_edge.point.edge = a.next_edge
    a.pair_edge.pair_edge = 0
    a.pair_edge = 0

    this.VerifyEdges()

    this.edge = a.next_edge

    return op
  }
  FromEdge(a){
    if(this.edge==a){return 0}
    var focus = this.edge
    var count = 0
    do{
      count++
      focus = focus.next_edge
      if(focus==a){
        return count
      }
    }while(focus != this.edge)
    return -1
  }
  EdgeAt(count){
    var focus = this.edge
    for(var ii=0;ii<count;ii++){
      focus = focus.next_edge
    }
    return focus
  }
  IsConvex(){
    return (this.FindEdge(IsFollowingReflexive)==0)
  }
  ValidateSubTri(a,b,c){
    //takes in a position array and an index triple
  	//outputs if position triple the index triple points to is a valid TRI
    var Right = this.EdgeAt(a).point.point
    var Root = this.EdgeAt(b).point.point
    var Left = this.EdgeAt(c).point.point

  	var A = Right.clone().sub(Root)
  	var B = Left.clone().sub(Root)
  	var C = new THREE.Vector3()

  	var dot00 = A.dot(A)
  	var dot01 = A.dot(B)
  	var dot11 = B.dot(B)


  	var ox = A.x
  	A.x = -A.z
  	A.z = ox

  	if(A.dot(B)<0)
    {
      return false
    } //triangle has invalid wrapping

  	A.z = -A.x
  	A.x = ox

    function is_internal(test){
      if(test.point.distanceTo(Right) == 0){return false}
  		if(test.point.distanceTo(Root) == 0){return false}
  		if(test.point.distanceTo(Left) == 0){return false}
  		var C = test.point.clone().sub(Root)

  		var dot02 = A.dot(C)
  		var dot12 = B.dot(C)

  		// Compute barycentric coordinates
  		var invDenom = 1 / (dot00 * dot11 - dot01 * dot01)
  		var u = (dot11 * dot02 - dot01 * dot12) * invDenom
  		var v = (dot00 * dot12 - dot01 * dot02) * invDenom
  		// Check if point is in triangle
  		if(((u >= 0) && (v >= 0) && (u + v < 1))){
  			return true
  		}
      return false
    }

    if(this.FindPoint(is_internal))
    {
      return false
    }
  	return true
  }
  IsFollowingIndexConvex(a){
    var ref = this.EdgeAt(a)
    return IsFollowingConvex(ref)
  }
  UpdateConvexity(){
    var focus = this.edge

    do{
      focus.next_edge.convex = IsFollowingConvex(focus)
      focus = focus.next_edge
    }while(focus != this.edge)
  }
}

//assumes faces are all point linked quads, meaning:
//quads share 1 edge, merging will form a hexagon (solve-able)
//quads share 2 edges, and at least 1 quad is convex
//  merging will form a quad, either convex or not
function quad_merge(target){
  var neighbors = target.ListEdges()

  var last = neighbors[0]
  var count = 1

  var neighbors_set = []
  var neighbors_count = []

  for(var ii=1;ii<neighbors.length;ii++){
    if(neighbors[ii].pair_edge.left_face == last.pair_edge.left_face){
      count++
    }else{
      neighbors_set.push(last)
      neighbors_count.push(count)

      last = neighbors[ii]
      count = 1
    }
  }
  neighbors_set.push(last)
  neighbors_count.push(count)

  for(var ii=0;ii<neighbors_set.length;ii++){
    if(neighbors_count[ii]>1 && !neighbors[ii].pair_edge.left_face.BOUNDARY){
      return target.MergeAcrossEdge(neighbors_set[ii])
    }
  }
}

function Edge_Setup(){
  var lead = new HALF_Edge()
  var lead_pair = new HALF_Edge()

  lead.pair_edge = lead_pair
  lead_pair.pair_edge = lead

  lead.next_edge = lead_pair
  lead_pair.next_edge = lead

  return lead
}

function Steiner_Setup(point,tail_count){
  //returns a list of the in-going edges towards the steiner point
  var result = {}
  result.steiner = new HALF_Point(point)
  result.tails = []

  var lead = Edge_Setup()
  lead.point = result.steiner

  result.tails.push(lead)

  for(var ii=1;ii<tail_count;ii++){
    var next = Edge_Setup()
    result.tails[result.tails.length-1].pair_edge.InsertAfter(next)
    result.tails.push(next)
  }

  return result
}

//assumes faces are all point linked quads with max merging, meaning
//no 2 quads share more than a single edge

//needed tools

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
  var offset = w.next_edge.point.point.clone()
    .sub(p.next_edge.point.point).normalize()

  var left = p.next_edge.point.point.clone()
    .sub(p.point.point).normalize()
  var right = p.next_edge.point.point.clone()
    .sub(p.next_edge.next_edge.point.point).normalize()

  var n = left.clone().add(right).normalize()

  if(IsFollowingConvex(p)){
    n.multiplyScalar(-1)
  }

  var theta = Math.acos(n.dot(left))
  var test = Math.acos(n.dot(offset))

  return test < theta
}

function InFollowingWedge(w,p){
  var offset = w.next_edge.point.point.clone()
    .sub(p.next_edge.point.point).normalize()

  var left = p.next_edge.point.point.clone()
    .sub(p.point.point).normalize()
  var right = p.next_edge.point.point.clone()
    .sub(p.next_edge.next_edge.point.point).normalize()

  var n = left.clone().add(right).normalize()

  if(IsFollowingConvex(p)){
    n.multiplyScalar(-1)
    left.multiplyScalar(-1)
  }

  var theta = Math.acos(n.dot(left))
  var test = Math.acos(n.dot(offset))

  return test < theta
}

/*

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

*/

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

function GenFollowingWedge(clip,p){

  var center = p.next_edge.point.point

  var left = center.clone()
    .sub(p.point.point).normalize()
  var right = center.clone()
    .sub(p.next_edge.next_edge.point.point).normalize()

  if(IsFollowingConvex(p)){
    left.multiplyScalar(-1)
    right.multiplyScalar(-1)
  }


  left.multiplyScalar(10000)
  right.multiplyScalar(10000)

  var path =[[{X:center.x,Y:center.z},
    {X:center.x + left.x,Y:center.z + left.z},
    {X:center.x + right.x,Y:center.z + right.z}]]

  if(!ClipperLib.Clipper.Orientation(path[0])){
  	ClipperLib.Clipper.ReversePaths(path)
  }

  //DEBUG_CURVES.push(path)
  return IterateClip(clip, path)
}

function GenLeftPlane(clip,a,b){
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

  DEBUG_CURVES.push(path)

  return IterateClip(clip, path)
}

function GenTriangle(clip,a,b,c){
  var A = {X:a.point.point.x,Y:a.point.point.z}
  var B = {X:b.point.point.x,Y:b.point.point.z}
  var C = {X:c.point.point.x,Y:c.point.point.z}

  var path = [[A,B,C]]

  if(!ClipperLib.Clipper.Orientation(path[0])){
  	ClipperLib.Clipper.ReversePaths(path)
  }

  //DEBUG_CURVES.push(path)

  return IterateClip(clip, path)
}

function GenKernel(clip, poly){
  var kernel = SetupClip(poly)
  var edges = poly.ListEdges()
  for(var ii=0;ii<edges.length;ii++){
    kernel = GenFollowingWedge(kernel, edges[ii])
  }

  DEBUG_CURVES.push(kernel)

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

function case_0(poly){
  console.log("case_0")
  var hexagon = {}
  hexagon.poly = poly
  hexagon.ReflxiveCount = 0
  hexagon.kernel = 0

  function convexIterate(target){
    if(!target.convex){
      hexagon.ReflxiveCount++
    }
    return false
  }

  hexagon.poly.UpdateConvexity()

  hexagon.poly.FindEdge(convexIterate)

  if(hexagon.ReflxiveCount==1){
    return case_1_1(hexagon)
  }else if(hexagon.ReflxiveCount==2){
    return case_2_1(hexagon)
  }else{ // ==3
    return case_3_1(hexagon)
  }
}

var DEBUG_CURVES = []

function DISPLAY_CURVES(){
  var h = 32
  for(var ii=0;ii<DEBUG_CURVES.length;ii++){
    displayPath(DEBUG_CURVES[ii], h)
    h+=4
  }
}

//case functions
function case_1_1(hexagon){
  console.log("case_1_1")
  //find a
  function findReflexive(target){
    return !target.next_edge.convex
  }

  // A is leading the reflexive
  hexagon.A = hexagon.poly.FindEdge(findReflexive)
  hexagon.B = hexagon.A.next_edge
  hexagon.C = hexagon.B.next_edge
  hexagon.D = hexagon.C.next_edge
  hexagon.E = hexagon.D.next_edge
  hexagon.F = hexagon.E.next_edge


  if(InFollowingWedge(hexagon.D,hexagon.A)){
    return [hexagon.poly, hexagon.poly.SplitFaceBetween(hexagon.A,hexagon.D)]
  }else{
    return case_1_2(hexagon)
  }
}

function case_1_2(hexagon){
  console.log("case_1_2")

  if(FollowingSees(hexagon.poly,hexagon.C,hexagon.E)){
    var clip = SetupClip(hexagon.poly)
    clip = GenTriangle(clip,hexagon.B,hexagon.D,hexagon.F)
    clip = GenKernel(clip, hexagon.poly)
    var w = PointFromClip(clip)


    var steiner_stuff = Steiner_Setup(w, 3)

    hexagon.A.InsertAfter(steiner_stuff.tails[0].pair_edge)
    hexagon.C.InsertAfter(steiner_stuff.tails[1].pair_edge)
    hexagon.E.InsertAfter(steiner_stuff.tails[2].pair_edge)

    hexagon.poly.edge = steiner_stuff.tails[0]
    var face_a = new HALF_Face(steiner_stuff.tails[1])
    var face_b = new HALF_Face(steiner_stuff.tails[2])

    hexagon.poly.VerifyEdges()
    face_a.VerifyEdges()
    face_b.VerifyEdges()

    return [hexagon.poly, face_a, face_b]
  }else{
    return case_1_3(hexagon)
  }
}

function case_1_3(hexagon){
  console.log("case_1_3")
  //find half point between A and ( N(A) intersect CD )

  var clip = SetupClip(hexagon.poly)
  clip = GenFollowingWedge(clip,hexagon.A)
  clip = GenFollowingWedge(clip,hexagon.C)
  clip = GenLeftPlane(clip,hexagon.B,hexagon.D)

  var w = PointFromClip(clip)

  var steiner_stuff = Steiner_Setup(w, 2)
  hexagon.A.InsertAfter(steiner_stuff.tails[0].pair_edge)
  hexagon.C.InsertAfter(steiner_stuff.tails[1].pair_edge)

  hexagon.poly.edge = steiner_stuff.tails[0]
  var face_a = new HALF_Face(steiner_stuff.tails[1])

  var r = case_0(face_a)
  r.push(hexagon.poly)
  return r
}

function case_2_1(hexagon){
  function findReflexiveSep(target){
    return (!target.next_edge.convex &&
      !target.next_edge.next_edge.next_edge.convex)
  }

  hexagon.A = hexagon.poly.FindEdge(findReflexiveSep)
  if(hexagon.A!=0){
    hexagon.B = hexagon.A.next_edge
    hexagon.C = hexagon.B.next_edge
    hexagon.D = hexagon.C.next_edge
    hexagon.E = hexagon.D.next_edge
    hexagon.F = hexagon.E.next_edge
    if(FollowingSees(hexagon.poly, hexagon.A,hexagon.E) &&
      FollowingSees(hexagon.poly, hexagon.C,hexagon.E)){

      var clip = SetupClip(hexagon.poly)
      clip = GenTriangle(clip,hexagon.B,hexagon.D,hexagon.F)
      clip = GenKernel(clip, hexagon.poly)
      var w = PointFromClip(clip)


      var steiner_stuff = Steiner_Setup(w, 3)

      hexagon.A.InsertAfter(steiner_stuff.tails[0].pair_edge)
      hexagon.C.InsertAfter(steiner_stuff.tails[1].pair_edge)
      hexagon.E.InsertAfter(steiner_stuff.tails[2].pair_edge)

      hexagon.poly.edge = steiner_stuff.tails[0]
      var face_a = new HALF_Face(steiner_stuff.tails[1])
      var face_b = new HALF_Face(steiner_stuff.tails[2])

      hexagon.poly.VerifyEdges()
      face_a.VerifyEdges()
      face_b.VerifyEdges()

      return [hexagon.poly, face_a, face_b]

    }else{
      var clip = SetupClip(hexagon.poly)
      clip = GenFollowingWedge(clip,hexagon.A)
      clip = GenFollowingWedge(clip,hexagon.C)
      clip = GenLeftPlane(clip,hexagon.B,hexagon.D)

      var w = PointFromClip(clip)

      var steiner_stuff = Steiner_Setup(w, 2)
      hexagon.A.InsertAfter(steiner_stuff.tails[0].pair_edge)
      hexagon.C.InsertAfter(steiner_stuff.tails[1].pair_edge)

      hexagon.poly.edge = steiner_stuff.tails[0]
      var face_a = new HALF_Face(steiner_stuff.tails[1])

      var r = case_0(face)
      r.push(hexagon.poly)
      return r
    }
  }else{
    return case_2_2(hexagon)
  }
}

function case_2_2(hexagon){
  function findReflexiveConsecutive(target){
    return (!target.next_edge.convex &&
      !target.next_edge.next_edge.convex)
  }


  hexagon.A = hexagon.poly.FindEdge(findReflexiveConsecutive)
  if(hexagon.A!=0){
    hexagon.B = hexagon.A.next_edge
    hexagon.C = hexagon.B.next_edge
    hexagon.D = hexagon.C.next_edge
    hexagon.E = hexagon.D.next_edge
    hexagon.F = hexagon.E.next_edge

    //cut b to d
    //cut e to a
    //get kernal
    //merge back
    var clip = SetupClip(hexagon.poly)

    hexagon.poly.SplitFaceBetween(hexagon.D,hexagon.B)
    hexagon.poly.SplitFaceBetween(hexagon.A,hexagon.E)

    clip = GenKernel(clip, hexagon.poly)

    hexagon.poly.MergeAcrossEdge(hexagon.B.next_edge)
    hexagon.poly.MergeAcrossEdge(hexagon.E.next_edge)

    clip = GenLeftPlane(clip,hexagon.B,hexagon.C)

    var w = PointFromClip(clip)

    var steiner_stuff = Steiner_Setup(w, 2)
    hexagon.B.InsertAfter(steiner_stuff.tails[0].pair_edge)
    hexagon.D.InsertAfter(steiner_stuff.tails[1].pair_edge)

    hexagon.poly.edge = steiner_stuff.tails[0]
    var face_a = new HALF_Face(steiner_stuff.tails[1])

    var r = case_0(face_a)
    r.push(hexagon.poly)
    return r
  }else{
    return case_2_3(hexagon)
  }
}

function case_2_3(hexagon){
  function findReflexive(target){
    return !target.next_edge.convex
  }

  hexagon.A = hexagon.poly.FindEdge(findReflexive)
  hexagon.B = hexagon.A.next_edge
  hexagon.C = hexagon.B.next_edge
  hexagon.D = hexagon.C.next_edge
  hexagon.E = hexagon.D.next_edge
  hexagon.F = hexagon.E.next_edge

  var other = hexagon.poly.SplitFaceBetween(hexagon.A,hexagon.D)

  if(other.IsConvex()&&hexagon.poly.IsConvex()){
    return [other,hexagon.poly]
  }else{
    //cut b to d
    //cut e to a
    //get kernal
    //merge back
    var clip = SetupClip(hexagon.poly)

    hexagon.poly.SplitFaceBetween(hexagon.D,hexagon.B)
    hexagon.poly.SplitFaceBetween(hexagon.A,hexagon.E)

    clip = GenKernel(clip, hexagon.poly)

    hexagon.poly.MergeAcrossEdge(hexagon.B.next_edge)
    hexagon.poly.MergeAcrossEdge(hexagon.E.next_edge)

    clip = GenLeftPlane(clip,hexagon.B,hexagon.C)

    var w = PointFromClip(clip)

    var steiner_stuff = Steiner_Setup(w, 2)
    hexagon.B.InsertAfter(steiner_stuff.tails[0].pair_edge)
    hexagon.D.InsertAfter(steiner_stuff.tails[1].pair_edge)

    hexagon.poly.edge = steiner_stuff.tails[0]
    var face_a = new HALF_Face(steiner_stuff.tails[1])

    var r = case_0(face)
    r.push(hexagon.poly)

  }
}

function case_3_1(hexagon){
  //if alternating
  var hexagon.A = hexagon.poly.edge
  hexagon.B = hexagon.A.next_edge
  hexagon.C = hexagon.B.next_edge
  hexagon.D = hexagon.C.next_edge
  hexagon.E = hexagon.D.next_edge
  hexagon.F = hexagon.E.next_edge

  if((!hexagon.A.convex && !hexagon.C.convex !hexagon.E.convex) ||
    (!hexagon.B.convex && !hexagon.D.convex !hexagon.F.convex)){

    if(hexagon.A.convex){
      hexagon.A = hexagon.B
      hexagon.B = hexagon.C
      hexagon.C = hexagon.D
      hexagon.D = hexagon.E
      hexagon.E = hexagon.F
      hexagon.F = hexagon.F.next_edge
    }

    if(FollowingSees(hexagon.poly, hexagon.A, hexagon.C) &&
      FollowingSees(hexagon.poly, hexagon.A, hexagon.E) &&
      FollowingSees(hexagon.poly, hexagon.C, hexagon.E)){

      var clip = SetupClip(hexagon.poly)
      clip = GenTriangle(clip,hexagon.B,hexagon.D,hexagon.F)
      clip = GenKernel(clip, hexagon.poly)
      var w = PointFromClip(clip)


      var steiner_stuff = Steiner_Setup(w, 3)

      hexagon.A.InsertAfter(steiner_stuff.tails[0].pair_edge)
      hexagon.C.InsertAfter(steiner_stuff.tails[1].pair_edge)
      hexagon.E.InsertAfter(steiner_stuff.tails[2].pair_edge)

      hexagon.poly.edge = steiner_stuff.tails[0]
      var face_a = new HALF_Face(steiner_stuff.tails[1])
      var face_b = new HALF_Face(steiner_stuff.tails[2])

      hexagon.poly.VerifyEdges()
      face_a.VerifyEdges()
      face_b.VerifyEdges()

      return [hexagon.poly, face_a, face_b]
    }else{
      //find which is convec

    }
  }else{
    return case_3_2(hexagon)
  }
}

function case_3_2(hexagon){


}

function case_3_3(hexagon){


}


var quad_2_pattern = [1,0,0,1,0,0]
var quad_3_pattern = [1,0,1,0,1,0]
var quad_4_pattern = [1,1,0,1,1,0]
var quad_5_pattern = [1,1,1,0,0,0]

function Apply_3_Pattern(A, target){
  var B = A.next_edge.next_edge
  var C = B.next_edge.next_edge


  var w = new THREE.Vector3()
  w.add(A.point.point)
  w.add(B.point.point)
  w.add(C.point.point)
  w.divideScalar(3)

  var steiner_stuff = Steiner_Setup(w, 3)


  A.InsertAfter(steiner_stuff.tails[0].pair_edge)
  B.InsertAfter(steiner_stuff.tails[1].pair_edge)
  C.InsertAfter(steiner_stuff.tails[2].pair_edge)

  target.edge = steiner_stuff.tails[0]
  var face_a = new HALF_Face(steiner_stuff.tails[1])
  var face_b = new HALF_Face(steiner_stuff.tails[2])

  target.VerifyEdges()
  face_a.VerifyEdges()
  face_b.VerifyEdges()

  return [target, face_a, face_b]
}
function Apply_4_Pattern(A, target){
  var B = A.next_edge
  var C = B.next_edge
  var D = C.next_edge

  var w_top = new THREE.Vector3()
  var w_bottom = new THREE.Vector3()

  var steiner_stuff_top = Steiner_Setup(w_top, 3)
  var steiner_stuff_bottom = Steiner_Setup(w_bottom, 2)

  //external
  A.InsertAfter(steiner_stuff_bottom.tails[0].pair_edge)
  D.InsertAfter(steiner_stuff_bottom.tails[1].pair_edge)
  B.InsertAfter(steiner_stuff_top.tails[0].pair_edge)
  C.InsertAfter(steiner_stuff_top.tails[2].pair_edge)

  //internal
  steiner_stuff_bottom.tails[1].pair_edge.InsertAfter(
    steiner_stuff_top.tails[1].pair_edge)

  target.edge = steiner_stuff_bottom.tails[0]
  var face_a = new HALF_Face(steiner_stuff_bottom.tails[1])
  var face_b = new HALF_Face(steiner_stuff_top.tails[0])
  var face_c = new HALF_Face(steiner_stuff_top.tails[2])

  target.VerifyEdges()
  face_a.VerifyEdges()
  face_b.VerifyEdges()
  face_c.VerifyEdges()

  return [target, face_a, face_b, face_c]
}
function Apply_5_Pattern(A, target){
  var B = A.next_edge
  var C = B.next_edge
  var D = C.next_edge
  var E = D.next_edge
  var F = E.next_edge

  var w_mid = new THREE.Vector3()
  w_mid.add(B.point.point)
  w_mid.add(C.point.point)
  w_mid.add(D.point.point)
  w_mid.divideScalar(3)

  var w_left = new THREE.Vector3()
  w_left.add(w_mid)
  w_left.add(D.point.point)
  w_left.add(F.point.point)
  w_left.divideScalar(3)

  var w_right = new THREE.Vector3()
  w_right.add(w_mid)
  w_right.add(B.point.point)
  w_right.add(F.point.point)
  w_right.divideScalar(3)

  var steiner_stuff_left = Steiner_Setup(w_left, 2)
  var steiner_stuff_mid = Steiner_Setup(w_mid, 3)
  var steiner_stuff_right = Steiner_Setup(w_right, 2)

  //top
  A.InsertAfter(steiner_stuff_right.tails[0].pair_edge)
  B.InsertAfter(steiner_stuff_mid.tails[0].pair_edge)
  C.InsertAfter(steiner_stuff_left.tails[0].pair_edge)

  //internal
  steiner_stuff_right.tails[1].pair_edge.InsertAfter(
    steiner_stuff_mid.tails[1].pair_edge)
  steiner_stuff_left.tails[0].pair_edge.InsertAfter(
    steiner_stuff_mid.tails[2].pair_edge)

  //bottom
  E.InsertAfter(steiner_stuff_left.tails[1].pair_edge)
  steiner_stuff_left.tails[1].InsertAfter(
    steiner_stuff_right.tails[1].pair_edge)

  target.edge = steiner_stuff_mid.tails[0]
  var face_a = new HALF_Face(steiner_stuff_mid.tails[1])
  var face_b = new HALF_Face(steiner_stuff_mid.tails[2])
  var face_c = new HALF_Face(steiner_stuff_left.tails[0])
  var face_d = new HALF_Face(steiner_stuff_right.tails[1])

  target.VerifyEdges()
  face_a.VerifyEdges()
  face_b.VerifyEdges()
  face_c.VerifyEdges()
  face_d.VerifyEdges()

  return [target, face_a, face_b, face_c, face_d]
}

function hex_fix(set){
  var result = []
  DEBUG_CURVES = []

  function convex_on(test, set){
    if(test.pair_edge.left_face.BOUNDARY){return false}
    return !test.pair_edge.left_face.IsConvex()
  }

  function non_boundary(test){
    return !(test.pair_edge.left_face.BOUNDARY)
  }

  while(set.length>0){
    var target = set.pop()

    if(target.IsConvex()||target.BOUNDARY){
      result.push(target)
      continue
    }
    //find a nonconvex neighbor
    var pick = target.FindEdge(convex_on)

    //if none pick a convex neighbor
    if(pick==0){
      pick = target.FindEdge(non_boundary)
    }

    console.assert(pick!=0, "non-Convex shape had no non-boundary neighbors!")
    if(pick==0){
      result.push(target) //UH OH
      continue
    }

    var index = set.indexOf(pick.pair_edge.left_face)
    if(index > -1){
      set.splice(index,1)
    }else{
      index = result.indexOf(pick.pair_edge.left_face)
      if(index > -1){
        result.splice(index,1)
      }else{
        console.assert(1==0, "Neighbor does not exist")
      }
    }


    target.MergeAcrossEdge(pick)

    result = result.concat(case_0(target))

  }
  return result
}

class HALF_Edge {
  constructor(){
    this.next_edge = 0
    this.pair_edge = 0
    this.point = 0
    this.left_face = 0
    this.debug_id = DEBUG_EDGE_ID++
  }
  InsertAfter(edge){
    //given an edge matched with a pair_edge
    edge.point = this.next_edge.point

    edge.pair_edge.next_edge = this.next_edge
    this.next_edge = edge
  }
}

function HALFify(polygon){
  //returns a pointer to the internal face of a HALF-Edge structure
  var points = []
  var edges = []
  for(var ii=0;ii<polygon.length;ii++){
    var next = new HALF_Point(polygon[ii].clone())
    points.push(next)

    var a = new HALF_Edge()
    var b = new HALF_Edge()
    a.point = next
    b.point = next
    edges.push(a)
    edges.push(b)
  }

  for(var ii=0;ii<polygon.length;ii++){
    var b = (ii+1)%polygon.length
    edges[2*ii].pair_edge = edges[2*b+1]
    edges[2*b+1].pair_edge = edges[2*ii]

    edges[2*ii].next_edge = edges[2*b]
    edges[2*b+1].next_edge = edges[2*ii+1]
  }

  var outer = new HALF_Face(edges[0])
  var inner = new HALF_Face(edges[1])

  outer.VerifyEdges()
  outer.BOUNDARY = true
  inner.VerifyEdges()

  return inner
}

/*function CutQuadEar(focus){
  if((validate([x0,x1,x2],border)&&validate([x0,x2,x3],border)) ||
    (validate([x0,x1,x3],border)&&validate([x1,x2,x3],border))){

    quads.push([border[x0],border[x1],border[x2],border[x3]])
    if(x1>x2){
      border.splice(x1,1)
      border.splice(x2,1)
    }else{
      border.splice(x2,1)
      border.splice(x1,1)
    }
    found = true
    break
  }
}*/

function quadra(border){
  //given a vertex list as a border
  var quads = [];

  var focus_face = HALFify(border)

  if((border.length%2)==1)return []

  var safety = 2*border.length;

  while(focus_face.Size()>4&&safety-- > 0){
    //find an ear at x, x+1, x+2
    //  cut x - x+3, or x-1 - x+1
    //  insert a point w and cut x - w - x+2

    // [op1] :
    // find an ear st x-1 to x+2 can be cut along
    //remove such quad
    var found = false;
    for(var ii = 0; ii < focus_face.Size(); ii++){
      //if 0-1-3 and 1-2-3  =or=  0-1-2 and 0-2-3
      if((focus_face.ValidateSubTri(ii+1,ii+2,ii+3) && focus_face.ValidateSubTri(ii+1,ii+3,ii+4)) ||
        (focus_face.ValidateSubTri(ii+1,ii+2,ii+4) && focus_face.ValidateSubTri(ii+2,ii+3,ii+4))){

        console.log("Splitting Face")

        var a = focus_face.EdgeAt(ii)
        var b = a.next_edge.next_edge.next_edge

        var next = focus_face.SplitFaceBetween(a,b)
        focus_face.DebugCheck()

        console.log("Switching Focus")
        quads.push(focus_face)
        focus_face = next
        focus_face.DebugCheck()

        found = true
        break
      }
    }
    if(found){continue}

    //if no such ear exists, default to...
    // [op2] :
    // find an ear and insert a steiner point w
    // st an adjacent ear could be removed by op1
    for(var ii = 0; ii < focus_face.Size(); ii++){
      if(focus_face.ValidateSubTri(ii+1,ii+2,ii+3)
        && focus_face.ValidateSubTri(ii+3,ii+4,ii+5)){

        console.log("Splitting face with w")

        var A = focus_face.EdgeAt(ii+3).point.point.clone()
        var B = focus_face.EdgeAt(ii+3).point.point.clone()
        A.sub(focus_face.EdgeAt(ii+2).point.point)
        B.sub(focus_face.EdgeAt(ii+4).point.point)

        var w = new THREE.Vector3(0,0,0)
        w.add(A.normalize()).add(B.normalize())
        w.normalize()
        w.multiplyScalar(32)

        w.add(focus_face.EdgeAt(ii+3).point.point)

        var W = new HALF_Point(w)

        var left_for = focus_face.EdgeAt(ii)
        var right_in = focus_face.EdgeAt(ii+2)

        var lop = new HALF_Edge()
        var rop = new HALF_Edge()
        var llo = new HALF_Edge()
        var rlo = new HALF_Edge()

        llo.point = W
        rop.point = W

        lop.pair_edge = llo
        llo.pair_edge = lop

        rop.pair_edge = rlo
        rlo.pair_edge = rop

        rlo.next_edge = llo
        lop.next_edge = rop

        left_for.InsertAfter(lop)
        right_in.InsertAfter(rlo)

        focus_face.edge = rlo
        var next = new HALF_Face(rop)

        focus_face.VerifyEdges()
        next.VerifyEdges()

        focus_face.DebugCheck()

        console.log("Switching Focus")
        quads.push(focus_face)
        focus_face = next
        focus_face.DebugCheck()

        found = true
        break
      }
    }

  }
  quads.push(focus_face)

  for(var ii=0;ii<quads.length;ii++){
    var op = quad_merge(quads[ii])
    var index = quads.indexOf(op)
    if(index>-1){
      quads.splice(index,1)
      if(index<ii){
        ii--
      }
    }
  }

  var final = hex_fix(quads)

  //we are left with a convex insensitive quadrangulation
  //merge nonconvex quads with convex quads resulting in convex quads
  //merge nonconvex quads with convex quads resulting in nonconvex quads
  //merge nonconvex quads with convex quads resulting in hexagons
  //merge nonconvex quads with nonconvex quads resulting in hexagons
  var borders = []
  for(var ii=0;ii<final.length;ii++){
    borders.push(final[ii].ListPointsRaw())
  }


  return borders
}
