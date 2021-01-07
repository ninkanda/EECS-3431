var canvas;
var gl;

var fps = 0;
var Time = 0;
var val = 0;

var program;

var near = -100;
var far = 100;

var left = -6.0;
var right = 6.0;
var ytop = 6.0;
var bottom = -6.0;

var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0);
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0);

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(0.4, 0.4, 0.4, 1.0);
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix;
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var TIME = 0.0; // Realtime
var resetTimerFlag = true;
var animFlag = false;
var prevTime = 0.0;
var useTextures = 1;

var texSize = 64;

var image1 = new Array()
for (var i = 0; i < texSize; i++) image1[i] = new Array();
for (var i = 0; i < texSize; i++)
	for (var j = 0; j < texSize; j++)
		image1[i][j] = new Float32Array(4);
for (var i = 0; i < texSize; i++)
	for (var j = 0; j < texSize; j++) {
		var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
		image1[i][j] = [c, c, c, 1];
	}

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++)
	for (var j = 0; j < texSize; j++)
		for (var k = 0; k < 4; k++)
			image2[4 * texSize * i + 4 * j + k] = 255 * image1[i][j][k];


var textureArray = [];


function isLoaded(im) {
	if (im.complete) {
		console.log("loaded");
		return true;
	}
	else {
		console.log("still not loaded!!!!");
		return false;
	}
}

function loadFileTexture(tex, filename) {
	tex.textureWebGL = gl.createTexture();
	tex.image = new Image();
	tex.image.src = filename;
	tex.isTextureReady = false;
	tex.image.onload = function() {
		handleTextureLoaded(tex);
	}
	// The image is going to be loaded asyncronously (lazy) which could be
	// after the program continues to the next functions. OUCH!
}

function loadImageTexture(tex, image) {
	tex.textureWebGL = gl.createTexture();
	tex.image = new Image();
	//tex.image.src = "CheckerBoard-from-Memory" ;

	gl.bindTexture(gl.TEXTURE_2D, tex.textureWebGL);
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
		gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
		gl.NEAREST_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
	gl.bindTexture(gl.TEXTURE_2D, null);

	tex.isTextureReady = true;

}

function initTextures() {

	textureArray.push({});
	loadFileTexture(textureArray[textureArray.length - 1], "floor.png");

	textureArray.push({});
	loadFileTexture(textureArray[textureArray.length - 1], "floor.png");

	textureArray.push({});
	loadImageTexture(textureArray[textureArray.length - 1], image2);

}

function handleTextureLoaded(textureObj) {
	gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
	gl.bindTexture(gl.TEXTURE_2D, null);
	console.log(textureObj.image.src);

	textureObj.isTextureReady = true;
}


function setColor(c) {
	ambientProduct = mult(lightAmbient, c);
	diffuseProduct = mult(lightDiffuse, c);
	specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv(gl.getUniformLocation(program,
		"ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(program,
		"diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(program,
		"specularProduct"), flatten(specularProduct));
	gl.uniform4fv(gl.getUniformLocation(program,
		"lightPosition"), flatten(lightPosition));
	gl.uniform1f(gl.getUniformLocation(program,
		"shininess"), materialShininess);
}

function toggleTextures() {
	useTextures = 1 - useTextures;
	gl.uniform1i(gl.getUniformLocation(program,
		"useTextures"), useTextures);
}

function waitForTextures1(tex) {
	setTimeout(function() {
		console.log("Waiting for: " + tex.image.src);
		wtime = (new Date()).getTime();
		if (!tex.isTextureReady) {
			console.log(wtime + " not ready yet");
			waitForTextures1(tex);
		}
		else {
			console.log("ready to render");
			window.requestAnimFrame(render);
		}
	}, 5);

}

// Takes an array of textures and calls render if the textures are created
function waitForTextures(texs) {
	setTimeout(function() {
		var n = 0;
		for (var i = 0; i < texs.length; i++) {
			console.log("boo" + texs[i].image.src);
			n = n + texs[i].isTextureReady;
		}
		wtime = (new Date()).getTime();
		if (n != texs.length) {
			console.log(wtime + " not ready yet");
			waitForTextures(texs);
		}
		else {
			console.log("ready to render");
			window.requestAnimFrame(render);
		}
	}, 5);

}

window.onload = function init() {

	canvas = document.getElementById("gl-canvas");

	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}

	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0, 0, 0, 1.0);

	gl.enable(gl.DEPTH_TEST);

	//
	//  Load shaders and initialize attribute buffers
	//
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);


	// Load canonical objects and their attributes
	Cube.init(program);
	Cylinder.init(9, program);
	Cone.init(9, program);
	Sphere.init(36, program);

	gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);

	// record the locations of the matrices that are used in the shaders
	modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
	projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

	// set a default material
	setColor(materialDiffuse);



	// set the callbacks for the UI elements
	document.getElementById("sliderXi").onchange = function() {
		RX = this.value;
		window.requestAnimFrame(render);
	};
	document.getElementById("sliderYi").onchange = function() {
		RY = this.value;
		window.requestAnimFrame(render);
	};
	document.getElementById("sliderZi").onchange = function() {
		RZ = this.value;
		window.requestAnimFrame(render);
	};

	document.getElementById("animToggleButton").onclick = function() {
		if (animFlag) {
			animFlag = false;
		}
		else {
			animFlag = true;
			resetTimerFlag = true;
			window.requestAnimFrame(render);
		}
	};

	document.getElementById("textureToggleButton").onclick = function() {
		toggleTextures();
		window.requestAnimFrame(render);
	};

	var controller = new CameraController(canvas);
	controller.onchange = function(xRot, yRot) {
		RX = xRot;
		RY = yRot;
		window.requestAnimFrame(render);
	};

	// load and initialize the textures
	initTextures();

	// Recursive wait for the textures to load
	waitForTextures(textureArray);
	//setTimeout (render, 100) ;

}

// Sets the modelview and normal matrix in the shaders
function setMV() {
	modelViewMatrix = mult(viewMatrix, modelMatrix);
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	normalMatrix = inverseTranspose(modelViewMatrix);
	gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
	setMV();

}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
	setMV();
	Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
	setMV();
	Sphere.draw();
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
	setMV();
	Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
	setMV();
	Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x, y, z) {
	modelMatrix = mult(modelMatrix, translate([x, y, z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta, x, y, z) {
	modelMatrix = mult(modelMatrix, rotate(theta, [x, y, z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx, sy, sz) {
	modelMatrix = mult(modelMatrix, scale(sx, sy, sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
	modelMatrix = MS.pop();
}

// pushes the current modelMatrix in the stack MS
function gPush() {
	MS.push(modelMatrix);
}

//VIEWING MOTION (camera angles)

function render() {

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	var x;

	if (TIME >= 0 && TIME <= 10) {
		eye = vec3(-1, 1, TIME / 2.5);
	}
	else if (TIME >= 10 && TIME <= 35) {
		eye = vec3(TIME, 35 - TIME, -TIME);
		ytop = 15 - TIME / 5;
		bottom = -2 - TIME / 7;
		left = -10;
		right = 5;

	}

	else {

		if (TIME >= 35 && TIME <= 48) {
			eye = vec3(-1, TIME / 20, TIME / 5);

			ytop = 4 + TIME / 15;
			bottom = -4 - TIME / 15;
			left = -4 - TIME / 15;
			right = 4 + TIME / 15;
		}
	}

	eye[1] = eye[1] + 0;

	// set the projection matrix
	projectionMatrix = ortho(left, right, bottom, ytop, near, far);

	// set the camera matrix
	viewMatrix = lookAt(eye, at, up);


	// initialize the modeling matrix stack
	MS = [];
	modelMatrix = mat4();

	// apply the slider rotations
	gRotate(RZ, 0, 0, 1);
	gRotate(RY, 0, 1, 0);
	gRotate(RX, 1, 0, 0);

	// send all the matrices to the shaders
	setAllMatrices();

	// get real time
	var curTime;
	if (animFlag) {
		curTime = (new Date()).getTime() / 1000;
		if (resetTimerFlag) {
			prevTime = curTime;
			resetTimerFlag = false;
		}
		TIME = TIME + curTime - prevTime;
		prevTime = curTime;
	}


	var currentTime = (new Date()).getTime() / 1000;
	++fps;
	if (currentTime - Time > 1.0) {
		if (Math.floor(TIME) == val) {
			console.log("Frames Per Second in " + TIME + " seconds is " + fps);
			val = val + 10;
		}
		Time = currentTime;
		fps = 0;
	}

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
	gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);

	/* gl.activeTexture(gl.TEXTURE1);
	 gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
	 gl.uniform1i(gl.getUniformLocation(program, "texture2"), 1);
	 
	 gl.activeTexture(gl.TEXTURE2);
	 gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
	 gl.uniform1i(gl.getUniformLocation(program, "texture3"), 2);*/


	//TEXTURED FLOOR PLATFORM

	gPush(); {
		gTranslate(0, -4, 0);
		gScale(-5, 0.03, -6.5);
		setColor(vec4(0.68, 0.68, 0.68, 1.0));
		drawSphere();
	}
	gPop();

	useTextures = 1 - useTextures;
	gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);

	AudienceStand();
	Barrier();
	Fire();
	Audience();
	Motion();
	Rose();
	useTextures = 1 + useTextures;
	gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);

	if (animFlag)
		window.requestAnimFrame(render);
}

function Motion() {

	if (TIME < 10 || (TIME >= 35 && TIME <= 60)) {

		gRotate(30, 0, 20, 0);
		gTranslate(2, -0.5, 1);
		Fire();
		gRotate(30, 0, 60, 0);
		gTranslate(3, -0.5, 0.5);
		Fire();
		gRotate(30, 0, 80, 0);
		gTranslate(3, 0, 1);
		Fire();

	}
	if (TIME <= 10 && TIME >= 0) {

		gTranslate(-3 + 3 * -Math.sin(0.5 * TIME), 0.5 * Math.cos(TIME), 3 * Math.cos(0.5 * TIME));
		gRotate(-TIME, 90, 90, 1);
		gRotate(60, 0, 30, 0);
		gTranslate(2, 0, 4);
		gTranslate(0.5, 1, -7);
		Trapeze();
		gRotate(180, 0, 0, 1);
		gTranslate(0, 2, -1);
		Person();
	}

	if (TIME >= 10 && TIME <= 25) {

		gRotate(10 * Math.sin(5 * TIME + 10), 0, 0, 1);
		gRotate(0, 90, 90, 1);
		gTranslate(-1, 20, -5);

		gTranslate(0, -TIME, 0);
		gTranslate(0.5, 4.5, -2);
		Trapeze();
		gTranslate(0, 1, -0.5);
		Person();
	}

	if (TIME >= 25 && TIME <= 35) {
		gTranslate(0, 0, -6);
		Person();
	}

	if (TIME >= 35 && TIME <= 60) {
		gRotate(80, 0, 90, 1);
		gTranslate(4, 3, -11);
		gScale(1.5, 1.6, 1.5);
		Person();
	}
}

function Trapeze() {
	gPush(); {
		gTranslate(-1.2, 11.5, 4);
		gScale(0.07, 5, 0.07, 1);
		setColor(vec4(0.8, 0.6, 0.1, 1));
		gTranslate(2.3, -1, 5);
		drawCube();
	}
	gPop();
	gPush(); {
		gTranslate(0.8, 11.5, 4);
		gScale(0.07, 5, 0.07, 1);
		setColor(vec4(0.8, 0.6, 0.1, 1));
		gTranslate(2.3, -1, 5);
		drawCube();
	}
	gPop();

	gPush(); {
		gTranslate(0, 0, 3);
		gTranslate(-0.4, 0.3, 1);
		gRotate(90, 0, -40000, 0);
		gScale(0.4, 0.4, 3, 1);
		setColor(vec4(0.5, 0.4, 0.5, 1));
		gTranslate(1.25, 2.8, -0.1);
		drawCylinder();
	}
	gPop();
}



function Fire() {
	if (TIME < 10 || (TIME >= 35 && TIME <= 60)) {
		//FIRE STAND 

		gPush(); {
			gTranslate(6, -3.5, -8);
			gRotate(90, 90, 0, 1);
			setColor(vec4(0.8, 0.8, 1, 1.0));
			gPush(); {
				gScale(1.2, 1.2, 1);
				drawCylinder();
			}
			gPop();

			gPush(); {
				gTranslate(0, 0, -0.5);
				gScale(1.2, 1.2, 1.8);
				drawCone();
			}
			gPop();
		}
		gPop();

		//RED FLAMES 
		gPush(); {

			gScale(0.8, 0.8, 1);
			gTranslate(7.5, -0.8, -8);

			gPush(); {
				gRotate(5 * Math.cos(3 * TIME), 20 * Math.cos(3 * TIME), 0, 1);
				gRotate(270, 90, 0, 1);
				setColor(vec4(0.9, 0, 0, 0));

				gPush(); {
					gScale(0.9, 0.9, 3);
					drawCone();

					gPush(); {
						gScale(0.7, 0.7, 0.7);

						gPush(); {
							gScale(1.1, 1.1, 1);
							gTranslate(-0.8, 1.25, -0.2);
							gRotate(-25, 25, 0, 1);
							drawCone();
						}
						gPop();

						gPush(); {
							gScale(1.1, 1.1, 1);
							gTranslate(0.8, -1.25, -0.1);
							gRotate(25, 25, 0, 1);
							drawCone();
						}
						gPop();
					}
					gPop();
				}
				gPop();
			}
			gPop();

			//BOTTOM  
			gPush(); {
				gTranslate(0, -2, 0.1);
				gRotate(45, 0, 80, 1);
				gTranslate(0.1, 0.3, -0.05);
				gScale(1, 1, 1.55);
				drawSphere();
			}
			gPop();


			//ORANGE FLAMES  
			gPush(); {
				gRotate(5 * Math.cos(3 * TIME), 5 * Math.cos(3 * TIME), 0, 1);
				gRotate(270, 50, -21, 1);
				setColor(vec4(0.8, 0.55, 0, 0.0));

				gPush(); {
					gTranslate(0.1, -1.5, 0);
					gTranslate(-0.55, 1.4, -0.3);
					gScale(0.1, 0.5, 1.3);
					drawCone();
				}
				gPop();

				gPush(); {
					gRotate(25, 25, 0, 1);
					gTranslate(0.1, -1.5, 0);
					gTranslate(-0.55, 0.5, 0);
					gScale(0.1, 0.5, 1.3);
					drawCone();
				}
				gPop();

				gPush(); {
					gRotate(-30, 30, 0, 1);
					gTranslate(0.1, -1.5, 0);
					gTranslate(-0.55, 2.5, -0.3);
					gScale(0.1, 0.5, 1.3);
					drawCone();
				}
				gPop();

				gPush(); {
					gRotate(80, 30, 0, 1);
					gTranslate(-0.5, -1.3, -0.1);
					gScale(0.1, 0.6, 0.9);
					drawSphere();
				}
				gPop();
			}
			gPop();
		}
		gPop();
	}
}

function Person() {
	gTranslate(0, -0.40, 0);

	{
		// PERSON HEAD
		gPush(); {
			if (TIME >= 35 && TIME <= 60) {
				gPush(); {
					gRotate(70 * Math.sin(TIME), -500 * Math.sin(TIME), 0, 1);
					gTranslate(-0.2, 1.1, 0);
					gScale(0.4, 0.4, 0.4, 1);
					setColor(vec4(0.8, 0.7, 0.7, 0.0));
					drawSphere();
				}
				gPop();
			}
			else {
				gTranslate(0, 0, 5);
				gScale(0.4, 0.4, 0.4, 1);
				setColor(vec4(0.8, 0.7, 0.7, 0.0));
				drawSphere();
			}
			gPop();
		}
		// PERSON BODY 
		gPush(); {

			if (TIME >= 35 && TIME <= 60) {
				gPush(); {
					gRotate(70 * Math.sin(TIME), -500 * Math.sin(TIME), 0, 1);
					gTranslate(-0.2, 0, 0);
					gScale(0.5, 0.8, 0.25, 1);
					setColor(vec4(0.6, 0, 0, 1.0));
					drawCube();
				}
				gPop();
			}
			else {
				gTranslate(0, -1.25, 5);
				gScale(0.5, 0.8, 0.25, 1);
				setColor(vec4(0.6, 0, 0, 1.0));
				drawCube();
			}
			gPop();
		}
		// HOOPS
		gPush(); {
			setColor(vec4(0.5, 0.4, 0.5, 1));
			gPush(); {
				if (TIME <= 5.2 || (TIME >= 25 && TIME <= 35)) {
					gTranslate(-3.5, -0.5, 5);

					gRotate(50 * Math.sin(5 * TIME), 30 * Math.cos(5 * TIME), 15 * Math.sin(5 * TIME), 1);
					gTranslate(0, -0.5, 1);
					gScale(3, 3, 0.3);
					drawCylinder();
				}
				gPop();
			}
			gPush(); {
				if (TIME >= 5.2 && TIME <= 10 || (TIME >= 25 && TIME <= 35)) {
					gTranslate(2.8, -0.5, 5);

					gRotate(50 * Math.sin(5 * TIME), 30 * Math.cos(5 * TIME), 15 * Math.sin(5 * TIME), 1);
					gTranslate(0, -0.5, 0);
					gScale(3, 3, 0.3);
					drawCylinder();
				}
				gPop();
			}
			gPop();
		}

		// RIGHT ARM
		gPush(); {
			gTranslate(-0.95, -0.7, 4.5);
			setColor(vec4(0.6, 0, 0, 1.0));
			if (TIME <= 5.2 || (TIME >= 25 && TIME <= 35)) {
				gPush(); {
					gRotate(20 * Math.sin(5 * TIME), 30 * Math.cos(5 * TIME), 15 * Math.sin(5 * TIME), 1);
					gTranslate(-0.2, -0.45, 0.4);
					gRotate(90, 0, 0, 1);
					gScale(0.1, 0.7, 0.1, 1);
					//gScale(0.1,0.5,0.1,1);
					drawCube();
				}
				gPop();
			}

			else if (TIME >= 12 && TIME <= 15 || (TIME >= 16 && TIME <= 19) || (TIME >= 20 && TIME <= 23)) {
				gRotate(2 * Math.sin(200 * TIME), 0, 0, 1);
				gTranslate(0.1, 1, 0.4);
				gScale(0.1, 0.7, 0.1, 1);
				drawCube();
			}
			else if (TIME >= 35 && TIME <= 60) {
				gPush(); {
					gRotate(70 * Math.sin(TIME), -500 * Math.sin(TIME), 0, 1);
					gTranslate(0.35, -0.5, 0);
					gScale(0.1, 0.7, 0.1, 1);
					drawCube();
				}
				gPop();
			}
			else {
				gTranslate(0.1, -0.65, 0.4);
				gScale(0.1, 0.7, 0.1, 1);
				drawCube();
			}
		}
		gPop();

		// RIGHT LEG
		gPush(); {
			gTranslate(0.3, -1.9, 4.3);
			gScale(0.1, 0.66, 0.15, 1);
			setColor(vec4(0.6, 0, 0, 1.0));
			gTranslate(0, -1.0, 5);
			drawCube();

		}
		gPop();

		//RIGHT FOOT
		gPush(); {
			gRotate(90, 0, 10, 1);
			gTranslate(4, -3, -1.5);
			gScale(0.5, 0.1, 0.1, 1);
			setColor(vec4(0.6, 0, 0, 1.0));
			gTranslate(-19.5, 3, 15);
			if (TIME <= 10 && TIME >= 0) {

				drawCube();

			}
			gPop();
		}

		gPush(); {
			gRotate(270, 0, 10, 1);
			gTranslate(3.8, -2.2, -1);
			gScale(0.5, 0.1, 0.1, 1);
			setColor(vec4(0.6, 0, 0, 1.0));
			gTranslate(2, -5, 10);
			if (TIME <= 23 && TIME >= 10) {

				drawCube();

			}
			gPop();
		}




		// LEFT ARM
		gPush(); {
			gTranslate(0.7, -0.7, 4.5);
			setColor(vec4(0.6, 0, 0, 1.0));
			if (TIME >= 5.2 && TIME <= 10 || (TIME >= 25 && TIME <= 35)) {
				gPush(); {
					gRotate(20 * Math.sin(5 * TIME), 30 * Math.cos(5 * TIME), 15 * Math.sin(5 * TIME), 1);
					gTranslate(0.2, -0.45, 0.4);
					gRotate(90, 0, 0, 1);
					gScale(0.1, 0.7, 0.1, 1);
					drawCube();
				}
				gPop();
			}


			else if (TIME >= 10 && TIME <= 13 || (TIME > 14 && TIME <= 17) || (TIME > 18 && TIME <= 21) || (TIME > 22 && TIME <= 25)) {

				gTranslate(0.1, 1, 0.4);
				gScale(0.1, 0.7, 0.1, 1);
				drawCube();
			}
			else if (TIME >= 35 && TIME <= 60) {
				gPush(); {
					gRotate(70 * Math.sin(TIME), -500 * Math.sin(TIME), 0, 1);
					gTranslate(0.1, -0.5, 0);
					gScale(0.1, 0.7, 0.1, 1);
					drawCube();
				}
				gPop();
			}

			else {
				gTranslate(0.1, -0.65, 0.4);
				gScale(0.1, 0.7, 0.1, 1);
				drawCube();
			}
		}
		gPop();


		// LEFT LEG
		gPush(); {

			gTranslate(-0.3, -1.9, 4.3);
			gScale(0.1, 0.66, 0.15, 1);
			setColor(vec4(0.6, 0, 0, 1.0));
			gTranslate(0, -1.0, 5);
			drawCube();
		}

		gPop();


		// LEFT FOOT

		gPush(); {

			gRotate(90, 0, 10, 1);
			gTranslate(4, -3, -1.5);
			gScale(0.5, 0.1, 0.1, 1);
			setColor(vec4(0.6, 0, 0, 1.0));
			gTranslate(-19.5, 3, 9.5);
			if (TIME <= 10 && TIME >= 0) {
				drawCube();
			}
			gPop();
		}
		gPush(); {

			gRotate(270, 0, 10, 1);
			gTranslate(3.8, -2.2, -1.5);
			gScale(0.5, 0.1, 0.1, 1);
			setColor(vec4(0.6, 0, 0, 1.0));
			gTranslate(2, -3, 9.5);
			if (TIME <= 23 && TIME >= 10) {
				drawCube();
			}
			gPop();
		}


	}

}



function Barrier() {
	if (TIME >= 10.2 && TIME <= 35) {
		gPush(); {
			gTranslate(-4, -1, 16);

			//SIDE BARRIER
			gPush(); {
				gTranslate(4.5, -1, -4.5);
				gScale(0.92, -0.7, -4);
				setColor(vec4(0.2, 0.3, 0.35, 1.0));
				drawCylinder();
			}
			gPop();

			//FRONT BARRIER
			gPush(); {
				gTranslate(0, -1.3, -7);
				gRotate(90, 90, -4000, 1);
				gScale(0.2, -4, -10);
				setColor(vec4(0.2, 0.3, 0.35, 1.0));
				drawCylinder();
			}
			gPop();

			// SECOND SIDE BARRIER 
			gPush(); {
				gTranslate(-4.5, -1, -4.5);
				gScale(0.85, -0.7, -4);
				setColor(vec4(0.2, 0.3, 0.35, 1.0));
				drawCylinder();
			}
			gPop();
		}
		gPop();

	}
}


function Rose() {

	gPush(); {
		if (TIME >= 36 && TIME <= 60) {
			gTranslate(0, -3, -3);
			gRotate(20, 0, 10, 1);
			setColor(vec4(0.9, 0, 0, 0));
			gScale(0.3, 0.3, 0.6);

			//FIRST ROSE 

			gPush(); {
				gTranslate(0, 0, 5);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(-25, 0, 5, 1);
				gTranslate(1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(25, 0, 5, 1);
				gTranslate(-1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(180, 0, -20, 1);
				gTranslate(0, 0, -3.8);
				gScale(1.6, 1.2, 1.2);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(90, 0, -15, 1);
				gTranslate(1, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(-90, 0, -15, 1);
				gTranslate(-1.5, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gTranslate(0, 0, 1);
				setColor(vec4(0, 0.9, 0, 0));
				gScale(0.35, 0.35, 8);
				drawCylinder();
			}
			gPop();
		}
		gPop();
	}

	// 2 ROSE

	gPush(); {
		if (TIME >= 40 && TIME <= 60) {
			gTranslate(-2, -3, 0);
			gRotate(-70, 0, 10, 1);
			setColor(vec4(0.9, 0, 0, 0));
			gScale(0.2, 0.2, 0.4);

			gPush(); {
				gTranslate(0, 0, 5);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(-25, 0, 5, 1);
				gTranslate(1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(25, 0, 5, 1);
				gTranslate(-1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(180, 0, -20, 1);
				gTranslate(0, 0, -3.8);
				gScale(1.6, 1.2, 1.2);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(90, 0, -15, 1);
				gTranslate(1, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(-90, 0, -15, 1);
				gTranslate(-1.5, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gTranslate(0, 0, 1);
				setColor(vec4(0, 0.9, 0, 0));
				gScale(0.35, 0.35, 8);
				drawCylinder();
			}
			gPop();
		}
		gPop();
	}

	// 2.2 ROSE

	gPush(); {
		if (TIME >= 40 && TIME <= 60) {
			gTranslate(-1, -2, 0);
			gRotate(-70, 0, 30, 1);
			setColor(vec4(0.9, 0, 0, 0));
			gScale(0.1, 0.1, 0.4);

			gPush(); {
				gTranslate(0, 0, 5);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(-25, 0, 5, 1);
				gTranslate(1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(25, 0, 5, 1);
				gTranslate(-1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(180, 0, -20, 1);
				gTranslate(0, 0, -3.8);
				gScale(1.6, 1.2, 1.2);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(90, 0, -15, 1);
				gTranslate(1, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(-90, 0, -15, 1);
				gTranslate(-1.5, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gTranslate(0, 0, 1);
				setColor(vec4(0, 0.9, 0, 0));
				gScale(0.35, 0.35, 8);
				drawCylinder();
			}
			gPop();
		}
		gPop();
	}
	// 3 ROSE

	gPush(); {
		if (TIME >= 45 && TIME <= 60) {
			gTranslate(0, -3, 0);
			gRotate(-120, 0, 10, 1);
			setColor(vec4(0.9, 0, 0, 0));
			gScale(0.2, 0.2, 0.4);

			gPush(); {
				gTranslate(0, 0, 5);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(-25, 0, 5, 1);
				gTranslate(1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(25, 0, 5, 1);
				gTranslate(-1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(180, 0, -20, 1);
				gTranslate(0, 0, -3.8);
				gScale(1.6, 1.2, 1.2);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(90, 0, -15, 1);
				gTranslate(1, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(-90, 0, -15, 1);
				gTranslate(-1.5, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gTranslate(0, 0, 1);
				setColor(vec4(0, 0.9, 0, 0));
				gScale(0.35, 0.35, 8);
				drawCylinder();
			}
			gPop();
		}
		gPop();
	}
	// 3.2 ROSE 

	gPush(); {
		if (TIME >= 45 && TIME <= 60) {
			gTranslate(1, -3, 0);
			gRotate(40, 0, 10, 1);
			setColor(vec4(0.9, 0, 0, 0));
			gScale(0.2, 0.2, 0.4);

			gPush(); {
				gTranslate(0, 0, 5);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(-25, 0, 5, 1);
				gTranslate(1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(25, 0, 5, 1);
				gTranslate(-1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(180, 0, -20, 1);
				gTranslate(0, 0, -3.8);
				gScale(1.6, 1.2, 1.2);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(90, 0, -15, 1);
				gTranslate(1, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(-90, 0, -15, 1);
				gTranslate(-1.5, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gTranslate(0, 0, 1);
				setColor(vec4(0, 0.9, 0, 0));
				gScale(0.35, 0.35, 8);
				drawCylinder();
			}
			gPop();
		}
		gPop();
	}
	// 4 ROSE

	gPush(); {
		if (TIME >= 50 && TIME <= 60) {
			gTranslate(3, -2, 0);
			gRotate(-10, 0, 10, 1);
			setColor(vec4(0.9, 0, 0, 0));
			gScale(0.2, 0.2, 0.4);

			gPush(); {
				gTranslate(0, 0, 5);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(-25, 0, 5, 1);
				gTranslate(1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(25, 0, 5, 1);
				gTranslate(-1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(180, 0, -20, 1);
				gTranslate(0, 0, -3.8);
				gScale(1.6, 1.2, 1.2);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(90, 0, -15, 1);
				gTranslate(1, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(-90, 0, -15, 1);
				gTranslate(-1.5, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gTranslate(0, 0, 1);
				setColor(vec4(0, 0.9, 0, 0));
				gScale(0.35, 0.35, 8);
				drawCylinder();
			}
			gPop();
		}
		gPop();
	}
	// 4.2 ROSE 

	gPush(); {
		if (TIME >= 50 && TIME <= 60) {
			gTranslate(2.5, -2, 0);
			gRotate(-90, 0, 10, 1);
			setColor(vec4(0.9, 0, 0, 0));
			gScale(0.2, 0.2, 0.4);

			gPush(); {
				gTranslate(0, 0, 5);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(-25, 0, 5, 1);
				gTranslate(1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(25, 0, 5, 1);
				gTranslate(-1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(180, 0, -20, 1);
				gTranslate(0, 0, -3.8);
				gScale(1.6, 1.2, 1.2);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(90, 0, -15, 1);
				gTranslate(1, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(-90, 0, -15, 1);
				gTranslate(-1.5, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gTranslate(0, 0, 1);
				setColor(vec4(0, 0.9, 0, 0));
				gScale(0.35, 0.35, 8);
				drawCylinder();
			}
			gPop();
		}
		gPop();
	}
	// 5 ROSE

	gPush(); {
		if (TIME >= 55 && TIME <= 60) {
			gTranslate(0, -2, 0);
			gRotate(-20, 0, 10, 1);
			setColor(vec4(0.9, 0, 0, 0));
			gScale(0.2, 0.2, 0.4);

			gPush(); {
				gTranslate(0, 0, 7);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(-25, 0, 5, 1);
				gTranslate(1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(25, 0, 5, 1);
				gTranslate(-1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(180, 0, -20, 1);
				gTranslate(0, 0, -3.8);
				gScale(1.6, 1.2, 1.2);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(90, 0, -15, 1);
				gTranslate(1, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(-90, 0, -15, 1);
				gTranslate(-1.5, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gTranslate(0, 0, 1);
				setColor(vec4(0, 0.9, 0, 0));
				gScale(0.35, 0.35, 8);
				drawCylinder();
			}
			gPop();
		}
		gPop();
	}
	// 5.2 ROSE 

	gPush(); {
		if (TIME >= 55 && TIME <= 60) {
			gTranslate(0, -2, 0);
			gRotate(50, 0, 10, 1);
			setColor(vec4(0.9, 0, 0, 0));
			gScale(0.2, 0.2, 0.4);

			gPush(); {
				gTranslate(0, 0, 5);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(-25, 0, 5, 1);
				gTranslate(1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(25, 0, 5, 1);
				gTranslate(-1, 0, 4.8);
				gScale(0.8, 0.8, 0.8);
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(180, 0, -20, 1);
				gTranslate(0, 0, -3.8);
				gScale(1.6, 1.2, 1.2);
				drawCone();
			}
			gPop();


			gPush(); {
				gRotate(90, 0, -15, 1);
				gTranslate(1, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gRotate(-90, 0, -15, 1);
				gTranslate(-1.5, 0, 0.5);
				gScale(0.5, 0.5, 1);
				setColor(vec4(0, 0.9, 0, 0));
				drawCone();
			}
			gPop();

			gPush(); {
				gTranslate(0, 0, 1);
				setColor(vec4(0, 0.9, 0, 0));
				gScale(0.35, 0.35, 8);
				drawCylinder();
			}
			gPop();
		}
		gPop();
	}
}




function AudienceStand() {
	if (TIME >= 10.2 && TIME <= 35) {
		gPush(); {

			gTranslate(-4, 0, 20);
			gPush(); {
				gTranslate(-4, -0.4, -6.8);
				gScale(1, 4.0, 0.15);
				setColor(vec4(0.7, 0, 0, 1.0));
				drawCube();
			}
			gPop();
			gPush(); {
				gTranslate(-2, 0.6, -6.8);
				gScale(1, 5.0, 0.15);
				setColor(vec4(0.65, 0.65, 0, 1.0));
				drawCube();
			}
			gPop();

			gPush(); {
				gTranslate(0, 1, -6.8);
				gScale(1, 5.5, 0.15);
				setColor(vec4(0.7, 0, 0, 1.0));
				drawCube();
			}
			gPop();

			gPush(); {
				gTranslate(2, 0.6, -6.8);
				gScale(1, 5.0, 0.15);
				setColor(vec4(0.65, 0.65, 0, 1.0));
				drawCube();
			}
			gPop();

			gPush(); {
				gTranslate(4, -0.4, -6.8);
				gScale(1, 4.0, 0.15);
				setColor(vec4(0.7, 0, 0, 1.0));
				drawCube();
			}
			gPop();
		}
		gPop();
	}
	// RED BORDERED FLOOR
	gPush(); {
		gTranslate(0, -4.5, 0);
		gScale(-6.5, 0.3, -8);
		setColor(vec4(0.9, 0.28, 0.10, 1.0));
		drawSphere();
	}
	gPop();




	function Barrier() {
		if (TIME >= 10.2 && TIME <= 35) {
			gPush(); {
				gTranslate(-4, -1, 16);

				//SIDE BARRIER
				gPush(); {
					gTranslate(4.5, -1, -4.5);
					gScale(0.92, -0.7, -4);
					setColor(vec4(0.2, 0.3, 0.35, 1.0));
					drawCylinder();
				}
				gPop();

				//FRONT BARRIER
				gPush(); {
					gTranslate(0, -1.3, -7);
					gRotate(90, 90, -4000, 1);
					gScale(0.2, -4, -10);
					setColor(vec4(0.2, 0.3, 0.35, 1.0));
					drawCylinder();
				}
				gPop();

				// SECOND SIDE BARRIER 
				gPush(); {
					gTranslate(-4.5, -1, -4.5);
					gScale(0.85, -0.7, -4);
					setColor(vec4(0.2, 0.3, 0.35, 1.0));
					drawCylinder();
				}
				gPop();
			}
			gPop();

		}
	}

}

function Audience() {
	gPush(); {
		if (TIME >= 10 && TIME <= 35) {
			gRotate(Math.sin(20 * TIME), 0, 0, 1);
			gTranslate(0, 1, 10);
			setColor(vec4(0.8, 0.7, 0.7, 0.0));

			//person2x1 
			gPush(); {
				gTranslate(-0.3, 0.1, 0);
				gScale(0.46, 0.46, 0.46);
				drawSphere();
			}
			gPop();
			gPush(); {
				gTranslate(-0.3, -1.8, 0);
				gScale(0.4, 1.5, 0.4);
				drawCube();
			}
			gPop();

			//person 1x1
			gPush(); {
				gTranslate(-0.2, 0.1, 1.5);
				gScale(0.46, 0.46, 0.46);
				setColor(vec4(0.8, 0.7, 0.6, 0.0));
				drawSphere();
			}
			gPop();
			gPush(); {
				gTranslate(-0.2, -1.8, 1.5);
				gScale(0.4, 1.5, 0.4);
				setColor(vec4(0.8, 0.7, 0.6, 0.0));
				drawCube();
			}
			gPop();


			gPush(); {
				gTranslate(-2.7, 0, 0);

				//person 2x2
				gPush(); {
					gTranslate(0, 0.1, 1.5);
					gScale(0.46, 0.46, 0.46);
					setColor(vec4(0.55, 0.5, 0.5, 0.0));
					drawSphere();
				}
				gPop();
				gPush(); {
					gTranslate(0, -1.8, 1.5);
					gScale(0.4, 1.5, 0.4);
					setColor(vec4(0.55, 0.5, 0.5, 0.0));
					drawCube();
				}
				gPop();

			}
			gPop();

			//person 1x2
			gPush(); {
				gTranslate(-2.2, 0, 0);
				gPush(); {
					gTranslate(0, 0.1, 0);
					gScale(0.46, 0.46, 0.46);
					setColor(vec4(0.8, 0.6, 0.7, 0.0));
					drawSphere();
				}
				gPop();
				gPush(); {
					gTranslate(0, -1.8, 0);
					gScale(0.4, 1.5, 0.4);
					setColor(vec4(0.8, 0.6, 0.7, 0.0));
					drawCube();
				}
				gPop();
			}
			gPop();

			//person 2x3
			gPush(); {
				gTranslate(-3.9, 0, -0.1);
				gPush(); {
					gTranslate(0, 0.1, 0);
					gScale(0.46, 0.46, 0.46);
					setColor(vec4(0.8, 0.7, 0.8, 0.0));
					drawSphere();
				}
				gPop();
				gPush(); {
					gTranslate(0, -1.8, 0);
					gScale(0.4, 1.5, 0.4);
					setColor(vec4(0.8, 0.7, 0.8, 0.0));
					drawCube();
				}
				gPop();
			}
			gPop();

			//person 1x3
			gPush(); {
				gTranslate(-4.8, 0, 1.4);
				gPush(); {
					gTranslate(0, 0.1, 0);
					gScale(0.46, 0.46, 0.46);
					setColor(vec4(0.92, 0.9, 0.9, 0.0));
					drawSphere();
				}
				gPop();
				gPush(); {
					gTranslate(0, -1.8, 0);
					gScale(0.4, 1.5, 0.4);
					setColor(vec4(0.92, 0.9, 0.9, 0.0));
					drawCube();
				}
				gPop();
			}
			gPop();

			//person 2x4
			gPush(); {
				gTranslate(-5.6, 0, 0);
				gPush(); {
					gTranslate(0, 0.1, 0);
					gScale(0.46, 0.46, 0.46);
					setColor(vec4(0.8, 0.8, 0.5, 0.0));
					drawSphere();
				}
				gPop();
				gPush(); {
					gTranslate(0, -1.8, -0.1);
					gScale(0.4, 1.5, 0.4);
					setColor(vec4(0.8, 0.8, 0.5, 0.0));
					drawCube();
				}
				gPop();
			}
			gPop();

			//person 1x4
			gPush(); {
				gTranslate(-6.8, 0, 1.4);
				gPush(); {
					gTranslate(0, 0.1, 0);
					gScale(0.46, 0.46, 0.46);
					setColor(vec4(0.8, 0.7, 0.68, 0.0));
					drawSphere();
				}
				gPop();
				gPush(); {
					gTranslate(0, -1.8, 0);
					gScale(0.4, 1.5, 0.4);
					setColor(vec4(0.8, 0.7, 0.68, 0.0));
					drawCube();
				}
				gPop();
			}
			gPop();
		}
	}
	gPop();
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
			}
			else if (controller.xRot > 90) {
				controller.xRot = 90;
			}
			// Send the onchange event to any listener.
			if (controller.onchange != null) {
				controller.onchange(controller.xRot, controller.yRot);
			}
		}
	};
}