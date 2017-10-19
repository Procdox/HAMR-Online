/**
 * @author mrdoob / http://mrdoob.com/
 */
 //Edited for Hamr use by Infernal Tryhard

THREE.HamrControls = function ( camera ) {

	var scope = this;

	this.input_lock = false

	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add( pitchObject );

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var rotUp = false;
	var rotDown = false;
	var rotLeft = false;
	var rotRight = false;
	var time = 0
	var prevTime = performance.now();
	var velocity = new THREE.Vector3()

	var PI_2 = Math.PI / 2;

	var onKeyDown = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
				rotUp = true;
				break
			case 87: // w
				moveForward = true;
				break;
			case 37: // left
				rotLeft = true;
				break
			case 65: // a
				moveLeft = true;
				break;
			case 40: // down
				rotDown = true;
				break
			case 83: // s
				moveBackward = true;
				break;
			case 39: // right
				rotRight = true;
				break
			case 68: // d
				moveRight = true;
				break;
		}

	};

	var onKeyUp = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
				rotUp = false;
				break
			case 87: // w
				moveForward = false;
				break;
			case 37: // left
				rotLeft = false;
				break
			case 65: // a
				moveLeft = false;
				break;
			case 40: // down
				rotDown = false;
				break
			case 83: // s
				moveBackward = false;
				break;
			case 39: // right
				rotRight = false;
				break
			case 68: // d
				moveRight = false;
				break;
		}

	};

	this.update = function( event ) {
		var time = performance.now();
		var delta = ( time - prevTime ) / 1000;

		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

		if ( moveForward ) velocity.z -= 7000.0 * delta;
		if ( moveBackward ) velocity.z += 7000.0 * delta;

		if ( moveLeft ) velocity.x -= 7000.0 * delta;
		if ( moveRight ) velocity.x += 7000.0 * delta;

		if ( rotUp ) pitchObject.rotation.x += 2.2 * delta;
		if ( rotDown ) pitchObject.rotation.x -= 2.2 * delta;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

		if ( rotLeft ) yawObject.rotation.y += 2.2 * delta;
		if ( rotRight ) yawObject.rotation.y -= 2.2 * delta;


		var relative_velocity = velocity.clone().applyEuler( pitchObject.rotation )

		yawObject.translateX( relative_velocity.x * delta );
		yawObject.translateY( relative_velocity.y * delta );
		yawObject.translateZ( relative_velocity.z * delta );

		prevTime = time;
	}

	var setGridHeight = function(y){
		var offset = new THREE.Vector3(0,y - Grid.position.y, 0)
		Grid.position.add(offset)
		Grid.updateMatrix();
		console.log(Grid.position)
	}

	var makeGrid = function(y){
		Grid_geo = new THREE.Geometry()
		Grid_geo.vertices.push(
			new THREE.Vector3(-10000,y,-10000),
			new THREE.Vector3(10000,y,-10000),
			new THREE.Vector3(10000,y,10000),
			new THREE.Vector3(-10000,y,10000)
		)
		Grid_geo.faces.push(
			new THREE.Face3(0,1,3),
			new THREE.Face3(3,1,2)
		)

		Grid = new THREE.Mesh(Grid_geo,new THREE.MeshBasicMaterial({color: 0xffff00,side: THREE.DoubleSide}));
	}

	var onMouseDown = function( event ){
<<<<<<< HEAD
		mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
		mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;

		raycaster.setFromCamera( mouse, camera );
		if(event.button==0){
			//drag/place event
			if(CALL=="h_move"){
				var intersects = raycaster.intersectObjects( OBJECTS )

				if(intersects.length>0){
					selectedPoint = intersects[ 0 ].point;

					HELD = intersects[0].object.dad
					if(HELD){
=======
		if(!this.input_lock){
			this.input_lock = true;

			mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
			mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;

			raycaster.setFromCamera( mouse, camera );
			if(event.button==0){
				//drag/place event
				if(CALL=="h_move"){
					var intersects = raycaster.intersectObjects( OBJECTS )

					if(intersects.length>0){
						selectedPoint = intersects[ 0 ].point;

						HELD = intersects[0].object.dad
>>>>>>> refs/remotes/origin/master
						makeGrid(HELD.height())

						intersects = raycaster.intersectObject( Grid )
						selectedPoint = intersects[ 0 ].point;

						document.addEventListener( 'mousemove', onMouseMoveDrag, false );
						document.addEventListener( 'mouseup', onMouseUpDrag, false );
<<<<<<< HEAD
					}
				}
			}else if(CALL=="v_move"){
				var intersects = raycaster.intersectObjects( OBJECTS )

				if(intersects.length>0){
					selectedPoint = intersects[ 0 ].point;

					HELD = intersects[0].object.dad
					if(HELD){
=======
					}else{
						this.input_lock = false
					}
				}else if(CALL=="v_move"){
					var intersects = raycaster.intersectObjects( OBJECTS )

					if(intersects.length>0){
						selectedPoint = intersects[ 0 ].point;

						HELD = intersects[0].object.dad
>>>>>>> refs/remotes/origin/master
						Pole.position.set(HELD.position.x,0,HELD.position.z);

						intersects = raycaster.intersectObject( Pole )
						selectedPoint = intersects[ 0 ].point;

						document.addEventListener( 'mousemove', onMouseMoveDrag, false );
						document.addEventListener( 'mouseup', onMouseUpDrag, false );
<<<<<<< HEAD
					}
=======
					}else{
						this.input_lock = false
					}
				}else{
					makeGrid(FOCUS.elevation)
					var intersects = raycaster.intersectObjects( [Grid] )

					if(intersects.length>0){
						selectedPoint = intersects[ 0 ].point;
						console.log(selectedPoint)
						FOCUS[CALL](selectedPoint,PROTO)

					}
					this.input_lock = false
					makeGrid(0)
>>>>>>> refs/remotes/origin/master
				}
			}else{
				this.input_lock = false;
				if(event.button==1){
					//select event
					var intersects = raycaster.intersectObjects( SELECTABLES )
					if(intersects.length>0){
						intersects[0].object.dad.dad.choose()
					}
				}
			}
		}
	}

	function onMouseMoveDrag( event ) {
		mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
		mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;

		raycaster.setFromCamera( mouse, camera );
		if(CALL=="h_move"){
			var intersects = raycaster.intersectObject( Grid );

			if(intersects.length>0){
				HELD.move(new THREE.Vector3(intersects[0].point.x-selectedPoint.x, 0, intersects[0].point.z-selectedPoint.z));

				selectedPoint = intersects[0].point;
			}
		}else{
			var intersects = raycaster.intersectObject( Pole );

			if(intersects.length>0){
				HELD.move(new THREE.Vector3(0, intersects[0].point.y-selectedPoint.y, 0));

				selectedPoint = intersects[0].point;
			}
		}
	}

	function onMouseUpDrag(  event  ) {
		if(this.input_lock){
			this.input_lock = false

			document.removeEventListener( 'mousemove', onMouseMoveDrag, false );
			document.removeEventListener( 'mouseup', onMouseUpDrag, false );

			mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
			mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;

			raycaster.setFromCamera( mouse, camera );
			if(CALL=="h_move"){
				var intersects = raycaster.intersectObject( Grid );
				if(intersects.length>0){

					while(HELD.feature){
						HELD = HELD.dad
					}

					HELD.snap()
					HELD.choose()

					WORLD.update_Display()
				}

				makeGrid(0)
			}else{
				var intersects = raycaster.intersectObject( Pole );
				if(intersects.length>0){

					while(HELD.feature){
						HELD = HELD.dad
					}

					HELD.snap()
					HELD.choose()

					WORLD.update_Display()
				}

				Pole.position.set(0,0,0);
			}
		}
	}

	function onMouseWheel( event ) {
		var delta = 0;

		if ( event.wheelDelta !== undefined ) {

			// WebKit / Opera / Explorer 9

			delta = event.wheelDelta;

		} else if ( event.detail !== undefined ) {

			// Firefox

			delta = - event.detail;

		}
		var relative_velocity = new THREE.Vector3(0,0,delta*-50)
		relative_velocity.applyEuler( pitchObject.rotation )

		yawObject.translateX( relative_velocity.x);
		yawObject.translateY( relative_velocity.y);
		yawObject.translateZ( relative_velocity.z);
	}

	this.dispose = function() {

		document.removeEventListener( 'mousemove', onMouseMove, false );

	};

	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );
	document.addEventListener( 'mousedown', onMouseDown, false );
	document.addEventListener( 'mousewheel', onMouseWheel, false );
	document.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

	this.enabled = false;

	this.getObject = function () {

		return yawObject;

	};

	this.getDirection = function() {

		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, - 1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {

			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;

		};

	}();

};
