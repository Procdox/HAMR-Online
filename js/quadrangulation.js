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

var DEBUG_CURVES = []

function DISPLAY_CURVES(){
  var h = 32
  for(var ii=0;ii<DEBUG_CURVES.length;ii++){
    displayPath(DEBUG_CURVES[ii], h)
    h+=4
  }
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
    console.log("Start Fix")
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
