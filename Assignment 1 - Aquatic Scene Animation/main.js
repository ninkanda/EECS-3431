
var canvas;
var gl;

var program ;

var near = -100;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0 ;
var RY = 0 ;
var RZ = 0 ;

var MS = [] ; // The modeling matrix stack
var TIME = 0.0 ; // Realtime
var prevTime = 0.0 ;
var resetTimerFlag = true ;
var animFlag = false ;
var controller ;

function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );
     //   gl.clearColor( 0, 0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse) ;

    Cube.init(program);
    Cylinder.init(9,program);
    Cone.init(9,program) ;
    Sphere.init(36,program) ;

    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );

	
	document.getElementById("sliderXi").oninput = function() {
		RX = this.value ;
		window.requestAnimFrame(render);
	}
		
    
    document.getElementById("sliderYi").oninput = function() {
        RY = this.value;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderZi").oninput = function() {
        RZ =  this.value;
        window.requestAnimFrame(render);
    };

    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true  ;
            resetTimerFlag = true ;
            window.requestAnimFrame(render);
        }
        console.log(animFlag) ;
		
		controller = new CameraController(canvas);
		controller.onchange = function(xRot,yRot) {
			RX = xRot ;
			RY = yRot ;
			window.requestAnimFrame(render); };
    };

    render();
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix) ;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix) ;
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV() ;
    
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV() ;
    Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV() ;
    Sphere.draw() ;
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV() ;
    Cylinder.draw() ;
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV() ;
    Cone.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z])) ;
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z])) ;
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz)) ;
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop() ;
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix) ;
}



    // bubble drawing function

	function drawBubble(i) {
    if ((TIME - timeDrawn[i] > 12)) {
        isVisible[i] = false;

    } gPush(); {
        bubbleY[i] += 0.002;
        gTranslate(bubbleX[i], bubbleY[i], 1.5);


       gScale(0.0025 * Math.abs(Math.cos(TIME + bubbleOffset[i])) + 0.1, 0.025 * Math.abs(Math.cos(TIME + 30 + bubbleOffset[i])) + 0.1, 0.025 * Math.abs(Math.cos(TIME + 15 + bubbleOffset[i])) + 0.1);
        setColor(vec4(1, 1, 1, 1));
        drawSphere();
    	} gPop();


    if (!isVisible[i]) {
        isVisible.splice(i, 1);
        timeDrawn.splice(i, 1);
        bubbleX.splice(i, 1);
        bubbleY.splice(i, 1);
        bubbleOffset.splice(i, 1);
    }
}

var x; var y; var timeDrawn = []; var isVisible = []; var bubbleX = [];
var bubbleY = []; var bubbleOffset = []; var numBubbles = 0;
var bubbleTimer = 0; var randBubbleNum;
if (Math.random() > 0.5) { randBubbleNum = 4; }
else { randBubbleNum = 5; }
var bubbleBlowTimer = 0;


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    eye = vec3(0,0,10);
    MS = [] ; // Initialize modeling matrix stack
	
	// initialize the modeling matrix to identity
    modelMatrix = mat4() ;
    
    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);
   
    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    // Rotations from the sliders
    gRotate(RZ,0,0,1) ;
    gRotate(RY,0,1,0) ;
    gRotate(RX,1,0,0) ;
    
    
    // set all the matrices
    setAllMatrices() ;
    
    var curTime ;
    if( animFlag )
    {
        curTime = (new Date()).getTime() /1000 ;
        if( resetTimerFlag ) {
            prevTime = curTime ;
            resetTimerFlag = false ;
        }
        TIME = TIME + curTime - prevTime ;
        prevTime = curTime ;
    }

     //bubbles 

     gPush(); {
        gTranslate(-4, 0, 0);
	x= 8.2 + Math.sin(TIME / 2);
	y=2.7 + Math.sin(TIME / 2);

        if ((TIME - bubbleBlowTimer) > 4 && numBubbles == randBubbleNum) {
        if (Math.random() > 0.5) { randBubbleNum = 4; }
        else { randBubbleNum = 5; }

        bubbleBlowTimer = TIME;
        numBubbles = 0;
        }

        if (TIME - bubbleTimer > 0.5 && numBubbles < randBubbleNum) {
        isVisible.push(true);
        timeDrawn.push(TIME);
        bubbleX.push(x);
        bubbleY.push(y);
        bubbleOffset.push(Math.random() * 45);

        bubbleTimer = TIME;
        numBubbles++;
        }

        for (var i = 0; i < isVisible.length; i++) {
        drawBubble(i);
        }
      } gPop();

     // bubbles end


    //floor rocks 
	
    gPush(); {
     setColor(vec4(0.3, 0.3, 0.3, 0));
	 
	//larger rock 

	gPush(); { 
	 gTranslate(0.04, -3.5, 0);
	 gScale(0.5, 0.5, 0.5); 
	 drawSphere();
	} gPop(); 
	
	//smaller rock 

	gPush(); {
	 gTranslate(-0.8, -3.75, 0);
	 gScale(0.25, 0.25, 0.25); 
	 drawSphere();
	} gPop(); 
	}gPop();

	// floor rocks end


	//drawing fish 

	gPush(); {
	 gTranslate(-0.5+ 3 * - Math.sin(0.5 * TIME), 0.5 * Math.cos(TIME) - 0.2, 3 * Math.cos(0.5 * TIME));
         gRotate(-0.5 * TIME * 180 / 3.14159, 0, 1, 0);
	

    //fish eyes 
	//pupils

     gPush(); {
	gTranslate(-1.75, -1.7, -0.4);
	gRotate(90, 0, -30, 1);
	gScale(0.06, 0.06, 0.06);
	setColor(vec4(0, 0, 0, 0));
	drawSphere();
     } gPop();

     gPush(); {
	gTranslate(-1.75, -1.7, 0.4);
	gRotate(90, 0, -30, 1);
	gScale(0.06, 0.06, 0.06);
	setColor(vec4(0, 0, 0, 0));
	drawSphere();
     } gPop();

	//whites of eyes

     gPush(); {
	gTranslate(-1.65, -1.75, -0.38);
	gRotate(90, 0, -30, 1);
	gScale(0.13, 0.13, 0.13);
	setColor(vec4(0.9, 0.9, 0.9, 1.0));
	drawSphere();
     } gPop();

     gPush(); {
	gTranslate(-1.65, -1.75, 0.38);
	gRotate(90, 0, -30, 1);
	gScale(0.13, 0.13, 0.13);
	setColor(vec4(0.9, 0.9, 0.9, 1.0));
	drawSphere();
     } gPop();


	//fish body

     gPush(); {
	gTranslate(-0.1, -2,0);
	gRotate(90, 0, 30, 1);
	gScale(0.55, 0.55, 2.5);
	setColor(vec4(0.6, 0, 0, 1.0));
	drawCone();
     } gPop();


	//fish face 

     gPush(); {
	gTranslate(-1.7, -2.06, 0);
	gRotate(90, 0, -30, 1);
	gScale(0.55, 0.55, 0.7);
	setColor(vec4(0.5, 0.5, 0.5, 1.0));
	drawCone();
     } gPop();


	//fish tail 

      gPush(); {
	 gTranslate(1.3, -1.5, 0);
	 gRotate(20 * Math.cos(5 * TIME), 0, 1, 0);
      
      gPush(); {
	 setColor(vec4(0.6, 0, 0, 1.0));


	//top part of tail 

      gPush(); {
         gRotate(90, 1, 0, 0);
         gRotate(140, 0, 1, 0);
         gScale(0.2, 0.2, 1.2);
         drawCone();
      }gPop();

	 //bottom part of tail

        gPush(); {
	   gTranslate(-0.01, -0.7, 0);
           gRotate(90, 1, 0, 0);
           gRotate(60, 0, 1, 0);
           gScale(0.2, 0.2, 0.7);
          drawCone();
       } gPop();

     } gPop();
   } gPop();
 } gPop();

	//fish end


   // ground block
     gPush(); {
	gTranslate(0, -5, 0);
	setColor(vec4(0.1, 0.3, 0.1, 1.0));
	gScale(100, 1, 50);
	drawCube();
     } gPop();

    //ground block end


     //seaweed function

     function seaW(x, y, z){

     gPush(); {
	gTranslate(x, y, 0);

     gPush(); {
        for (var i = 0; i < 10; i++) {
	gTranslate(0, 0.6, 0);
        if (i > 0 && i < 9) {
        gRotate(z * Math.sin(TIME + i), 0, 0, 1);

     } gPush(); {
	gScale(0.1, 0.3, 0.1);
	setColor(vec4(0.2, 0.5, 0, 0.0)) ;
	drawSphere();
     } gPop();
    }
   } gPop();
  } gPop();
 }


    //seaweed output

     gPush(); {
        seaW(-1, -4.28, 10);
        seaW(-0.3, -4.28, 10);
        seaW(0.5, -4.28, 10);
     } gPop();

    //seaweed end
	
	// diver

	gTranslate(4 + Math.sin(TIME / 2), 3 + Math.sin(TIME / 2), 0);
        gRotate(20, 0, -1, 0);

        // head

        gPush(); {
	    gTranslate(0, -0.6, 0) ;
            gScale(0.35, 0.35, 0.35);
            setColor(vec4(0.5, 0.3, 0.6, 0.0)) ;
            drawSphere();
        } gPop();
	

	// body 

	gPush(); {
            gTranslate(0, -1.85, 0) ;
            setColor(vec4(0.5, 0.3, 0.6, 0.0)) ;
	    gScale(0.6, 0.9, 0.5);
        drawCube();
    	} gPop() ;


	gPush(); {
            gTranslate(0, -3.2, 0);
            setColor(vec4(0.5, 0.0, 0.5, 1.0));

        // right leg
   
         gPush(); {
            gTranslate(-0.5, 0, -0.5);
            gRotate(-(Math.sin(TIME) * 25) + 25, 1, 0, 0);


         // right thigh

         gPush(); {
            gScale(0.13, 0.5, 0.15);
            drawCube();
         } gPop();


         // right shin

            gTranslate(0, -1.0, -0.5);
            gRotate(40, 1, 0, 0);

          gPush(); {
             gScale(0.13, 0.7, 0.15);
             drawCube();
          } gPop();


          // right foot 

             gTranslate(0, -0.8, 0.2);

           gPush(); {
              gScale(0.1, 0.13, 0.45);
              drawCube();
           } gPop();
           } gPop();


           // left leg

           gPush(); {
              gTranslate(0.5, 0, -0.1);
              gRotate((Math.sin(TIME) * 25) + 25, 1, 0, 0);

           // left thigh

            gPush(); {
               gScale(0.13, 0.5, 0.15);
               drawCube();
            } gPop();


            // left shin

               gTranslate(0.0, -1.0, -0.5);
               gRotate(40, 1, 0, 0);

            gPush(); {
               gScale(0.13, 0.7, 0.15);
               drawCube();
            } gPop();


              // left foot
                 gTranslate(0, -0.8, 0.2);

              gPush(); {
                 gScale(0.1, 0.13, 0.45);
                 drawCube();
                }
                gPop();
            }
            gPop();
        }
        gPop();


    if( animFlag )
        window.requestAnimFrame(render);
}


// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
	var controller = this;
	this.onchange = null;
	this.xRot = 0;
	this.yRot = 0;
	this.scaleFactor = 3.0;
	this.dragging = false;
	this.curX = 0;
	this.curY = 0;
	
	// Assign a mouse down handler to the HTML element.
	element.onmousedown = function(ev) {
		controller.dragging = true;
		controller.curX = ev.clientX;
		controller.curY = ev.clientY;
	};
	
	// Assign a mouse up handler to the HTML element.
	element.onmouseup = function(ev) {
		controller.dragging = false;
	};
	
	// Assign a mouse move handler to the HTML element.
	element.onmousemove = function(ev) {
		if (controller.dragging) {
			// Determine how far we have moved since the last mouse move
			// event.
			var curX = ev.clientX;
			var curY = ev.clientY;
			var deltaX = (controller.curX - curX) / controller.scaleFactor;
			var deltaY = (controller.curY - curY) / controller.scaleFactor;
			controller.curX = curX;
			controller.curY = curY;
			// Update the X and Y rotation angles based on the mouse motion.
			controller.yRot = (controller.yRot + deltaX) % 360;
			controller.xRot = (controller.xRot + deltaY);
			// Clamp the X rotation to prevent the camera from going upside
			// down.
			if (controller.xRot < -90) {
				controller.xRot = -90;
			} else if (controller.xRot > 90) {
				controller.xRot = 90;
			}
			// Send the onchange event to any listener.
			if (controller.onchange != null) {
				controller.onchange(controller.xRot, controller.yRot);
			}
		}
	};
}
