//ASSUME CCW winding

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

class HALF_Face {
  constructor(link){
    this.edge = link
  }
  VerifyEdges(){
    var focus = this.edge

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

    var compLocal = function(focus){
      return (focus.next_edge == a)
    }
    var compOp = function(focus){
      return (focus.next_edge == a.pair_edge)
    }

    var local_last = this.FindEdge(compLocal)
    var op_last = op.FindEdge(compOp)

    a.point.edge = a.pair_edge.next_edge
    local_last.next_edge = a.pair_edge.next_edge

    a.pair_edge.point.edge = a.next_edge
    op_last.next_edge = a.next_edge

    VerifyEdges()
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
    return validate_Shape(this.ListPoints())
  }
  ValidateSubTri(a,b,c){
  }
}

class HALF_Edge {
  constrctor(){
    this.next_edge = 0
    this.pair_edge = 0
    this.point = 0
    this.left_face = 0
  }
  InsertAfter(edge){
    //given an edge matched with a pair_edge
    edge.point = this.point

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
  inner.VerifyEdges()

  return inner
}

function CutQuadEar(focus){
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
}

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
    var current_border = focus_face.ListPointsRaw()
    current_border.reverse()

    var found = false;
    for(var ii = 0; ii < current_border.length; ii++){
      var x0 = ii
      var x1 = (ii+1) % current_border.length
      var x2 = (ii+2) % current_border.length
      var x3 = (ii+3) % current_border.length
      //if 0-1-3 and 1-2-3  =or=  0-1-2 and 0-2-3
      if((validate([x0,x1,x2],current_border)&&validate([x0,x2,x3],current_border)) ||
        (validate([x0,x1,x3],current_border)&&validate([x1,x2,x3],current_border))){

        var a = focus_face.EdgeAt(x0)
        var b = a.next_edge.next_edge.next_edge

        var next = focus_face.SplitFaceBetween(a,b)

        quads.push(focus_face)
        focus_face = next

        found = true
        break
      }
    }
    if(found){continue}

    //if no such ear exists, default to...
    // [op2] :
    // find an ear and insert a steiner point w
    // st an adjacent ear could be removed by op1
    for(var ii = 0; ii < current_border.length; ii++){
      var x0 = ii
      var x1 = (ii+1) % current_border.length
      var x2 = (ii+2) % current_border.length
      var x3 = (ii+3) % current_border.length
      var x4 = (ii+4) % current_border.length

      //either x-1 or x+1 is reflexive
      //stick w in
      //wedge(x+1) U wedge(x+3)
      if(validate([x0,x1,x2], current_border) && validate([x2,x3,x4], current_border)){
        var A = current_border[x2].clone()
        var B = current_border[x2].clone()
        A.sub(current_border[x1])
        B.sub(current_border[x3])

        var w = new THREE.Vector3(0,0,0)
        w.add(A.normalize()).add(B.normalize())
        w.normalize()
        w.multiplyScalar(32)

        w.add(current_border[x2])

        var W = new HALF_Point(W)

        var left_for = focus_face.EdgeAt(x1)
        var right_in = focus_face.EdgeAt(x3)

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

        var next = new HALF_Face(rop)

        quads.push(focus_face)
        focus_face = next

        found = true
        break
      }
    }

  }
  quads.push(focus_face)

  //

  //we are left with a convex insensitive quadrangulation
  //merge nonconvex quads with convex quads resulting in convex quads
  //merge nonconvex quads with convex quads resulting in nonconvex quads
  //merge nonconvex quads with convex quads resulting in hexagons
  //merge nonconvex quads with nonconvex quads resulting in hexagons
  var borders = []
  for(var ii=0;ii<quads.length;ii++){
    borders.push(quads[ii].ListPointsRaw())
  }


  return borders
}
