//case functions
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
  }
  else if(hexagon.ReflxiveCount==2){
    return case_2_1(hexagon)
  }
  else{ // ==3
    return case_3_1(hexagon)
  }
}

function case_1_1(hexagon){

  // A is leading the reflexive
  hexagon.A = hexagon.poly.FindEdge(findReflexive)
  hexagon.B = hexagon.A.next_edge
  hexagon.C = hexagon.B.next_edge
  hexagon.D = hexagon.C.next_edge
  hexagon.E = hexagon.D.next_edge
  hexagon.F = hexagon.E.next_edge


  if(InFollowingWedge(hexagon.D,hexagon.A)){
    console.log("case_1_1")
    return [hexagon.poly, hexagon.poly.SplitFaceBetween(hexagon.A,hexagon.D)]
  }
  else{
    return case_1_2(hexagon)
  }
}

function case_1_2(hexagon){

  if(FollowingSees(hexagon.poly,hexagon.C,hexagon.E)){
    console.log("case_1_2")
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
  }
  else{
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

  DEBUG_CURVES.push(SetupClip(face_a))

  var r = case_0(face_a)
  r.push(hexagon.poly)
  return r
}

function case_2_1(hexagon){
  hexagon.A = hexagon.poly.FindEdge(findReflexiveSep)
  if(hexagon.A!=0){
    hexagon.B = hexagon.A.next_edge
    hexagon.C = hexagon.B.next_edge
    hexagon.D = hexagon.C.next_edge
    hexagon.E = hexagon.D.next_edge
    hexagon.F = hexagon.E.next_edge
    if(FollowingSees(hexagon.poly, hexagon.A,hexagon.E) &&
      FollowingSees(hexagon.poly, hexagon.C,hexagon.E)){
      console.log("case_2_1_a")

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

    }
    else{
      console.log("case_2_1_b")
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

      DEBUG_CURVES.push(SetupClip(face_a))

      var r = case_0(face_a)
      r.push(hexagon.poly)
      return r
    }
  }
  else{
    return case_2_2(hexagon)
  }
}

function case_2_2(hexagon){
  hexagon.A = hexagon.poly.FindEdge(findReflexiveConsecutive)
  if(hexagon.A!=0){
    console.log("case_2_2")
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

    var X = hexagon.poly.SplitFaceBetween(hexagon.D,hexagon.B)
    var Y = hexagon.poly.SplitFaceBetween(hexagon.A,hexagon.E)

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

    DEBUG_CURVES.push(SetupClip(face_a))

    var r = case_0(face_a)
    r.push(hexagon.poly)
    return r
  }
  else{
    return case_2_3(hexagon)
  }
}

function case_2_3(hexagon){
  hexagon.A = hexagon.poly.FindEdge(findReflexive)
  hexagon.B = hexagon.A.next_edge
  hexagon.C = hexagon.B.next_edge
  hexagon.D = hexagon.C.next_edge
  hexagon.E = hexagon.D.next_edge
  hexagon.F = hexagon.E.next_edge

  var other = hexagon.poly.SplitFaceBetween(hexagon.A,hexagon.D)

  if(other.IsConvex()&&hexagon.poly.IsConvex()){
    console.log("case_2_3_a")
    return [other,hexagon.poly]
  }
  else{
    //cut b to d
    //cut e to a
    //get kernal
    //merge back


    hexagon.poly.MergeAcrossEdge(hexagon.D.next_edge)

    var clip = SetupClip(hexagon.poly)

    if(FollowingSees(hexagon.poly,hexagon.A,hexagon.C)){
      console.log("case_2_3_b_l")

      var X = hexagon.poly.SplitFaceBetween(hexagon.C,hexagon.A)
      var Y = hexagon.poly.SplitFaceBetween(hexagon.F,hexagon.D)

      clip = GenKernel(clip, hexagon.poly)

      hexagon.poly.MergeAcrossEdge(hexagon.A.next_edge)
      hexagon.poly.MergeAcrossEdge(hexagon.D.next_edge)

      clip = GenLeftPlane(clip,hexagon.B,hexagon.D)
      clip = GenFollowingWedge(clip,hexagon.A)

      var w = PointFromClip(clip)

      var steiner_stuff = Steiner_Setup(w, 2)
      hexagon.A.InsertAfter(steiner_stuff.tails[0].pair_edge)
      hexagon.C.InsertAfter(steiner_stuff.tails[1].pair_edge)


    }
    else{
      console.log("case_2_3_b_r")
      var X = hexagon.poly.SplitFaceBetween(hexagon.D,hexagon.B)
      var Y = hexagon.poly.SplitFaceBetween(hexagon.A,hexagon.E)

      clip = GenKernel(clip, hexagon.poly)

      hexagon.poly.MergeAcrossEdge(hexagon.B.next_edge)
      hexagon.poly.MergeAcrossEdge(hexagon.E.next_edge)

      clip = GenLeftPlane(clip,hexagon.F,hexagon.B)
      clip = GenFollowingWedge(clip,hexagon.A)

      var w = PointFromClip(clip)

      var steiner_stuff = Steiner_Setup(w, 2)
      hexagon.E.InsertAfter(steiner_stuff.tails[0].pair_edge)
      hexagon.A.InsertAfter(steiner_stuff.tails[1].pair_edge)


    }
    hexagon.poly.edge = steiner_stuff.tails[0]
    var face_a = new HALF_Face(steiner_stuff.tails[1])

    DEBUG_CURVES.push(SetupClip(face_a))

    var r =case_0(face_a)
    r.push(hexagon.poly)
    return r
  }
}

function case_3_1(hexagon){
  //if alternating
  hexagon.A = hexagon.poly.edge
  hexagon.B = hexagon.A.next_edge
  hexagon.C = hexagon.B.next_edge
  hexagon.D = hexagon.C.next_edge
  hexagon.E = hexagon.D.next_edge
  hexagon.F = hexagon.E.next_edge

  if((!hexagon.A.convex && !hexagon.C.convex && !hexagon.E.convex) ||
    (!hexagon.B.convex && !hexagon.D.convex && !hexagon.F.convex)){

    if(hexagon.B.convex){
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

      console.log("case_3_1_a")
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
    }
    else{
      //find which is convex
      if(FollowingSees(hexagon.poly, hexagon.A, hexagon.E)){
        console.log("case_3_1_b_nc")
        //then either a or e is higly reflexive (interupts C-E or C-A)
        //wedge of e
        //wedge of f
        //wedge of a
        var clip = SetupClip(hexagon.poly)
        clip = GenFollowingWedge(clip,hexagon.E)
        clip = GenFollowingWedge(clip,hexagon.D)
        clip = GenFollowingWedge(clip,hexagon.A)

        var w = PointFromClip(clip)

        var steiner_stuff = Steiner_Setup(w, 2)
        hexagon.E.InsertAfter(steiner_stuff.tails[0].pair_edge)
        hexagon.A.InsertAfter(steiner_stuff.tails[1].pair_edge)

        hexagon.poly.edge = steiner_stuff.tails[0]
        var face_a = new HALF_Face(steiner_stuff.tails[1])

        DEBUG_CURVES.push(SetupClip(face_a))

        var r = case_0(face_a)
        r.push(hexagon.poly)
        return r

      }
      else{
        //then c is highly reflexive (interupts A-E)
        //a
        console.log("case_3_1_b_c")

        var clip = SetupClip(hexagon.poly)
        clip = GenFollowingWedge(clip,hexagon.A)
        clip = GenFollowingWedge(clip,hexagon.B)
        clip = GenFollowingWedge(clip,hexagon.C)

        var w = PointFromClip(clip)

        var steiner_stuff = Steiner_Setup(w, 2)
        hexagon.A.InsertAfter(steiner_stuff.tails[0].pair_edge)
        hexagon.C.InsertAfter(steiner_stuff.tails[1].pair_edge)

        hexagon.poly.edge = steiner_stuff.tails[0]
        var face_a = new HALF_Face(steiner_stuff.tails[1])

        DEBUG_CURVES.push(SetupClip(face_a))

        var r = case_0(face_a)
        r.push(hexagon.poly)
        return r
      }
    }
  }
  else{
    return case_3_2(hexagon)
  }
}

function case_3_2(hexagon){
  hexagon.A = hexagon.poly.FindEdge(findReflexiveTriple)
  if(hexagon.A==0){
    hexagon.A = hexagon.poly.FindEdge(findReflexiveConsecutive)
    hexagon.B = hexagon.A.next_edge
    hexagon.C = hexagon.B.next_edge
    hexagon.D = hexagon.C.next_edge
    hexagon.E = hexagon.D.next_edge
    hexagon.F = hexagon.E.next_edge

    if(!hexagon.E.convex){
      if(FollowingSees(hexagon.poly,hexagon.A,hexagon.E)){
        console.log("case_3_2_a_r")
        var clip = SetupClip(hexagon.poly)
        clip = GenLeftPlane(clip,hexagon.F,hexagon.B)
        clip = GenLeftPlane(clip,hexagon.C,hexagon.E)
        clip = GenKernel(clip,hexagon.poly)

        var w = PointFromClip(clip)

        var steiner_stuff = Steiner_Setup(w, 2)
        hexagon.E.InsertAfter(steiner_stuff.tails[0].pair_edge)
        hexagon.A.InsertAfter(steiner_stuff.tails[1].pair_edge)

        hexagon.poly.edge = steiner_stuff.tails[0]
        var face_a = new HALF_Face(steiner_stuff.tails[1])

        DEBUG_CURVES.push(SetupClip(face_a))

        var r = case_0(face_a)
        r.push(hexagon.poly)
        return r
      }
      else{
        console.log("case_3_2_b_r")
        var clip = SetupClip(hexagon.poly)
        clip = GenLeftPlane(clip,hexagon.E,hexagon.A)
        clip = GenFollowingWedge(clip,hexagon.D)

        var w = PointFromClip(clip)

        var steiner_stuff = Steiner_Setup(w, 2)
        hexagon.D.InsertAfter(steiner_stuff.tails[0].pair_edge)
        hexagon.F.InsertAfter(steiner_stuff.tails[1].pair_edge)

        hexagon.poly.edge = steiner_stuff.tails[0]
        var face_a = new HALF_Face(steiner_stuff.tails[1])

        DEBUG_CURVES.push(SetupClip(face_a))

        var r = case_0(face_a)
        r.push(hexagon.poly)
        return r
      }
    }
    else{
      if(FollowingSees(hexagon.poly,hexagon.B,hexagon.D)){
        console.log("case_3_2_a_l")
        var clip = SetupClip(hexagon.poly)
        clip = GenLeftPlane(clip,hexagon.F,hexagon.B)
        clip = GenLeftPlane(clip,hexagon.C,hexagon.E)
        clip = GenKernel(clip,hexagon.poly)

        var w = PointFromClip(clip)

        var steiner_stuff = Steiner_Setup(w, 2)
        hexagon.B.InsertAfter(steiner_stuff.tails[0].pair_edge)
        hexagon.D.InsertAfter(steiner_stuff.tails[1].pair_edge)

        hexagon.poly.edge = steiner_stuff.tails[0]
        var face_a = new HALF_Face(steiner_stuff.tails[1])

        DEBUG_CURVES.push(SetupClip(face_a))

        var r = case_0(face_a)
        r.push(hexagon.poly)
        return r
      }
      else{
        console.log("case_3_2_b_l")
        var clip = SetupClip(hexagon.poly)
        clip = GenLeftPlane(clip,hexagon.D,hexagon.F)
        clip = GenFollowingWedge(clip,hexagon.E)

        var w = PointFromClip(clip)

        var steiner_stuff = Steiner_Setup(w, 2)
        hexagon.C.InsertAfter(steiner_stuff.tails[0].pair_edge)
        hexagon.E.InsertAfter(steiner_stuff.tails[1].pair_edge)

        hexagon.poly.edge = steiner_stuff.tails[0]
        var face_a = new HALF_Face(steiner_stuff.tails[1])

        DEBUG_CURVES.push(SetupClip(face_a))

        var r = case_0(face_a)
        r.push(hexagon.poly)
        return r
      }
    }
  }
  else{
    return case_3_3(hexagon)
  }

}

function case_3_3(hexagon){
  console.log("case_3_3")
  hexagon.B = hexagon.A.next_edge
  hexagon.C = hexagon.B.next_edge
  hexagon.D = hexagon.C.next_edge
  hexagon.E = hexagon.D.next_edge
  hexagon.F = hexagon.E.next_edge

  var clip = SetupClip(hexagon.poly)
  clip = GenLeftPlane(clip,hexagon.C,hexagon.E)
  clip = GenFollowingWedge(clip,hexagon.A)
  clip = GenLeftPlane(clip,hexagon.C,hexagon.A)
  clip = GenKernel(clip,hexagon.poly)

  var w = PointFromClip(clip)

  var steiner_stuff = Steiner_Setup(w, 2)
  hexagon.E.InsertAfter(steiner_stuff.tails[0].pair_edge)
  hexagon.A.InsertAfter(steiner_stuff.tails[1].pair_edge)

  hexagon.poly.edge = steiner_stuff.tails[0]
  var face_a = new HALF_Face(steiner_stuff.tails[1])

  //DEBUG_CURVES.push(SetupClip(face_a))

  var r = case_0(face_a)
  r.push(hexagon.poly)
  return r
}
