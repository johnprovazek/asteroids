// Vertex shader program.
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'varying vec2 v_TexCoord;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

// Fragment shader program.
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n';

var a_Position; // Shader vertices.
var a_TexCoord; // Shader texture vertices.
var u_ModelMatrix; // Shader 4x4 matrix.
var u_Sampler = null; // Shader texture reference.

var numAsteroids = 5; // Number of asteroids.
var laserBuffer; // WebGLBuffer for the laser vertices.
var shipBuffer; // WebGLBuffer for the ship vertices.
var backgroundBuffer; // WebGLBuffer for the background vertices.
var asteroidBuffer = new Array(numAsteroids); // WebGLBuffer for the asteroid vertices.
var backgroundVertices; // Array of vertices for the background.
var laserVertices; // Array of vertices for the laser.
var asteroidVertices = new Array(numAsteroids); // 2D Array of vertices for the asteroids.
var asteroidAngle = new Array(numAsteroids); // Array of the angle the asteroids are traveling.
var xAsteroid = new Array(numAsteroids); // X coordinates of asteroids.
var yAsteroid = new Array(numAsteroids); // Y coordinates of asteroids.
var fSize = 4; // Bytes per element of vertices arrays.
var numTexturesAndImages = 6; // Number of textures and images in project.
var numTexturesAndImagesLoaded = 0; // Number of textures and images loaded.

// Main function triggered onload.
function main(){
  var xShip; // X coordinate of ship.
  var yShip; // Y coordinate of ship.
  var speedX; // Speed of the ship in the X direction.
  var speedY; // Speed of the ship in the Y direction.
  var isStoppedLeft; // Is the ship stopped in the left direction.
  var isStoppedRight; // Is the ship stopped in the right direction.
  var isStoppedUp; // Is the ship stopped in the up direction.
  var isStoppedDown; // Is the ship stopped in the down direction.
  var xCursor; // X coordinate of mouse curser.
  var yCursor; // Y coordinate of mouse curser.
  var currentAngle; // Current angle of the ship.
  var triggerPull; // Boolean value for mouse click.
  var laserAngle; // Angle of the laser when it was first shot.
  var laserCounter; // Keeps track of how far the laser has traveled.
  var inRange; // Is the laser still in the range of the screen.
  var numShipVertices; // Number of ship vertices.
  var numAsteroidVertices; // Number of asteroid vertices.
  var numBackgroundVertices; // Number of background vertices.
  var stillAlive; // Boolean value keeps track if the game still going.
  var scoreCounter; // Number of asteroids hit.
  var fps = 90; // Frames per second limit for the game.
  var fpsInterval = 1000 / fps; // Frames per second interval.
  var fpsCounterThen = null; // Timestamp used for maintaining frames per second.
  var fpsCounterNow = null; // Timestamp used for maintaining frames per second.
  var fpsCounterElapsed = null; // Change in time used for maintaining frames per second.
  var keyState = { // Holds data on the state of WASD keypresses.
    'KeyW': false,
    'KeyA': false,
    'KeyS': false,
    'KeyD': false
  }; 
  var startMenuActive = true; // Boolean value set to true when the start menu is active.
  var gameOverMenuActive = false; // Boolean value set to true when the game over menu is active.
  var laserSound = new Audio('./sound/laser.mp3'); // Laser sound.
  var asteroidSound = new Audio('./sound/asteroid.mp3'); // Asteroid hit sound.
  var deathSound = new Audio('./sound/death.mp3'); // Ship hit sounds.
  var tenPointsSound = new Audio('./sound/ten-points.mp3'); // Sound played every 10 points.
  var musicSound = new Audio('./sound/music.mp3'); // Background game music.
  musicSound.loop = true;

  // Setting Mobile incompatability warning if on mobile device.
  if(isMobileDevice()){
    document.getElementById('mobile').style.visibility='visible';
  }
  // Setting up canvas for TV wrapper.
  var tvCanvas = document.getElementById('tv');
  tvContext = tvCanvas.getContext('2d');
  var tvImage = new Image();
  tvImage.src = 'img/tv.png';
  tvImage.onload = function(){
    numTexturesAndImagesLoaded = numTexturesAndImagesLoaded + 1;
  }
  // Setting up canvas for TV glare.
  var glareCanvas = document.getElementById('glare');
  glareContext = glareCanvas.getContext('2d');
  var glareImage = new Image();
  glareImage.src = 'img/glare.png';
  glareImage.onload = function(){
    numTexturesAndImagesLoaded = numTexturesAndImagesLoaded + 1;
  }
  // Display the TV wrapper and glare and hidden text.
  var displayAppImages = (function(){
    var executed = false;
    return function(){
      if (!executed){
        executed = true;
        const hiddenElements = document.querySelectorAll('.hidden');
        for(var i = 0; i < hiddenElements.length; i++){
          hiddenElements[i].classList.remove('hidden');
        }
        tvContext.drawImage(tvImage, 0, 0);
        glareContext.drawImage(glareImage, 0, 0);
      }
    };
  })();
  // Setting up canvas for main WebGL game.
  var canvas = document.getElementById('webgl');
  // Get the rendering context for WebGL.
  var gl = getWebGLContext(canvas);
  if (!gl){
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  // Initialize shaders.
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)){
    console.log('Failed to intialize shaders.');
    return;
  }
  // Setup before running a new game.
  var setup = function(){
    // Initializes ship.
    numShipVertices = initShipBuffer(gl);
    if (numShipVertices < 0){
      console.log('Failed to set the positions of the vertices');
      return;
    }
    // Initializes asteroids.
    for(var i = 0; i < numAsteroids; i++){
      numAsteroidVertices = initAsteroidBuffers(gl, i);
      if (numAsteroidVertices < 0){
        console.log('Failed to set the positions of the asteroids');
        return;
      }
    }
    // Initializes the moving space background.
    numBackgroundVertices = initBackgroundBuffer(gl);
    if (numBackgroundVertices < 0){
      console.log('Failed to set up the background properly');
      return;
    }
    currentAngle = 0.0; // Setting current rotation angle on game start.
    xShip = 0.0; // Setting X coordinate of ship on game start.
    yShip = 0.0; // Setting Y coordinate of ship on game start.
    xCursor = 0.0; // Setting X coordinate of mouse curser on game start.
    yCursor = 1.0; // Setting Y coordinate of mouse curser on game start.
    triggerPull = false; // Trigger has not be clicked on game start.
    speedX = 0.0; // Speed of the ship in the X direction on game start.
    speedY = 0.0; // Speed of the ship in the Y direction on game start.
    scoreCounter = 0; // Number of asteroids hit on game start.
    keyState['KeyW'] = false; // State of keypresses on game start.
    keyState['KeyA'] = false; // State of keypresses on game start.
    keyState['KeyS'] = false; // State of keypresses on game start.
    keyState['KeyD'] = false; // State of keypresses on game start.
    isStoppedLeft = true; // Ship is stopped on game start.
    isStoppedRight = true; // Ship is stopped on game start.
    isStoppedUp = true; // Ship is stopped on game start.
    isStoppedDown = true; // Ship is stopped on game start.
    inRange = false; // Laser not active on game start.
    laserCounter = 0; // Laser has not traveled on game start.
    stillAlive = true; // Game is still active on game start.
  }
  setup();
  // Sets up all the textures for the game.
  if (!initTextures(gl)){
    console.log('Failed to intialize the texture.');
    return;
  }
  // Get storage location of u_ModelMatrix.
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix){
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Model matrix.
  var modelMatrix = new Matrix4();
  // Event Listener to start the game when an Enter is pressed.
  document.addEventListener('keypress', function(e){
    if(startMenuActive && e.code === 'Space'){
      musicSound.play();
      startGame();
      startMenuActive = false;
    }
    else if(gameOverMenuActive && e.code === 'Space'){
      musicSound.play();
      stillAlive = true;
      setup();
      startGame();
      gameOverMenuActive = false;
    }
    // Configure background game music.
  });
  // Event listener for keydown.
  document.addEventListener('keydown',function(e){
    if(e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD'){
      keyState[e.code] = true;
    }
  },true);
  // Event listener for keyup.
  document.addEventListener('keyup',function(e){
    if(e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD'){
      keyState[e.code] = false;
    }
  },true);
  // Event listener for mouse clicks.
  document.addEventListener('click',function(){
    if(!startMenuActive && !gameOverMenuActive){
      triggerPull = true;
    }
  },true);
  // Event listener for mouse movement.
  document.addEventListener('mousemove',function(e){
    var rect = e.target.getBoundingClientRect();
    xCursor = ((e.pageX - rect.left) - canvas.width/2)/(canvas.width/2);
    yCursor = (canvas.height/2 - (e.pageY - rect.top))/(canvas.height/2);
  },true);
  // Main menu loop.
  var mainmenu = function(){
    // Drawing main menu.
    if(startMenuActive && numTexturesAndImages === numTexturesAndImagesLoaded){
      displayAppImages();
      drawBackground(gl, numBackgroundVertices, modelMatrix, u_ModelMatrix);
      drawOverlay(scoreCounter, 1, 0);
    }
    requestAnimationFrame(mainmenu, canvas);
  }
  // Game over loop.
  var gameover = function(){
    // Drawing game over menu.
    if(gameOverMenuActive){
      drawOverlay(scoreCounter, 0, 1);
    }
    requestAnimationFrame(gameover, canvas);
  }
  // Setup before starting game tick function.
  var startGame = function(){
    fpsCounterThen = Date.now();
    tick();
  }
  // Main game loop.
  var tick = function(){
    // Handles when to exit the game.
    if(stillAlive){
      requestAnimationFrame(tick, canvas);
    }
    else{
      musicSound.pause();
      musicSound.currentTime = 0;
      gameOverMenuActive = true;
      gameover();
    }
    // Limiting the game to FPS interval.
    fpsCounterNow = Date.now();
    fpsCounterElapsed = fpsCounterNow - fpsCounterThen;
    if (fpsCounterElapsed > fpsInterval){
      fpsCounterThen = fpsCounterNow - (fpsCounterElapsed % fpsInterval);
      // Main game logic:
      // Finding the current angle of the ship based on the curser.
      currentAngle = Math.atan2(yCursor - yShip, xCursor - xShip) * 180 / Math.PI - 90;
      // Checking if the user has clicked the mouse prompting a laser to be made.
      if(triggerPull === true){
        laserSound.play();
        initlaserBuffer(gl, currentAngle);
        triggerPull = false;
        inRange = true;
        laserAngle = currentAngle;
      }
      // Moving ship left.
      if (keyState['KeyA']){
        xShip = xShip + speedX;
        if(speedX > -0.02){
          speedX = speedX - 0.001;
        }
        if(xShip < -1.0){
          xShip = -1.0;
        }
        isStoppedLeft = false;
      }
      // Moving ship right.
      if (keyState['KeyD']){
        xShip = xShip + speedX;
        if(speedX < 0.02){
          speedX = speedX + 0.001;
        }
        if(xShip > 1.0){
          xShip = 1.0;
        }
        isStoppedRight = false;
      }
      //  Moving ship up.
      if (keyState['KeyW']){
        yShip = yShip + speedY;
        if(speedY < 0.02){
          speedY = speedY + 0.001;
        }
        if(yShip > 1.0){
          yShip = 1.0;
        }
        isStoppedUp = false;
      }
      //  Moving ship down.
      if (keyState['KeyS']){
        yShip = yShip + speedY;
        if(speedY > -0.02){
          speedY = speedY - 0.001;
        }
        if(yShip < -1.0){
          yShip = -1.0;
        }
        isStoppedDown = false;
      }
      // Stopping ship left.
      if (keyState['KeyA'] === false && isStoppedLeft === false && keyState['KeyD'] === false){
        xShip = xShip + speedX;
        if(speedX < 0.0){
          speedX = speedX + 0.001;
        }
        if(speedX === 0.0){
          isStoppedLeft === true;
        }
        if(xShip < -1.0){
          xShip = -1.0;
        }
      }
      // Stopping ship right.
      if (keyState['KeyD'] === false && isStoppedRight === false && keyState['KeyA'] === false){
        xShip = xShip + speedX;
        if(speedX > 0.0){
          speedX = speedX - 0.001;
        }
        if(speedX === 0.0){
          isStoppedRight === true;
        }
        if(xShip > 1.0){
          xShip = 1.0;
        }
      }
      // Stopping ship up.
      if (keyState['KeyW'] === false && isStoppedUp === false && keyState['KeyS'] === false){
        yShip = yShip + speedY;
        if(speedY > 0.0){
          speedY = speedY - 0.001;
        }
        if(speedX === 0.0){
          isStoppedUp === true;
        }
        if(yShip > 1.0){
          yShip = 1.0;
        }
      }
      // Stopping ship down.
      if (keyState['KeyS'] === false && isStoppedDown === false && keyState['KeyW'] === false){
        yShip = yShip + speedY;
        if(speedY < 0.0){
          speedY = speedY + 0.001;
        }
        if(speedY === 0.0){
          isStoppedDown === true;
        }
        if(yShip < -1.0){
          yShip = -1.0;
        }
      }
      // Moving background in the X direction.
      if(isStoppedLeft === false || isStoppedRight === false){
        backgroundVertices[2] = 0.75 + (xShip)/8;
        backgroundVertices[6] = 0.75 + (xShip)/8;
        backgroundVertices[10] = 0.25 + (xShip)/8;
        backgroundVertices[14] = 0.25 + (xShip)/8;
      }
      // Moving background in the Y direction.
      if(isStoppedUp === false || isStoppedDown === false){
        backgroundVertices[3] = 0.75 + (yShip)/8;
        backgroundVertices[7] = 0.25 + (yShip)/8;
        backgroundVertices[11] = 0.75 + (yShip)/8;
        backgroundVertices[15] = 0.25 + (yShip)/8;
      }
      // Moving asteroids.
      for(var i = 0; i < numAsteroids; i++){
        if(asteroidVertices[i][4] >= 1.5 || asteroidVertices[i][20] <= -1.5 || asteroidVertices[i][1] >= 1.5 || asteroidVertices[i][9] <= -1.5){
          asteroidAngle[i] = asteroidAngle[i] + (180 - (asteroidAngle[i]%90)*2);
        }
        let movex = Math.cos((asteroidAngle[i] + 90) * (Math.PI / 180))*.01;
        let movey = Math.sin((asteroidAngle[i] + 90) * (Math.PI / 180))*.01;
        xAsteroid[i] += movex;
        yAsteroid[i] += movey;
        for(var j = 0; j < 8; j++){
          asteroidVertices[i][j*4] += movex;
          asteroidVertices[i][j*4+1] += movey;
        }
      }
      // Asteroid-Ship collisiton detection using circle collison algorithm.
      for(var i = 0; i < numAsteroids; i++){
        let circle1 = {radius: .05, x: xShip, y: yShip};
        let circle2 = {radius: .16, x: xAsteroid[i], y: yAsteroid[i]};
        let dx = circle1.x - circle2.x;
        let dy = circle1.y - circle2.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < circle1.radius + circle2.radius){
          deathSound.play();
          stillAlive = false;
        }
      }
      // Asteroid-Laser collisiton detection using circle collison algorithm.
      if(inRange){
        for(var i = 0; i < numAsteroids; i++){
          let circle1 = {radius: .16, x: xAsteroid[i], y: yAsteroid[i]};
          let circle2 = {radius: 0, x: laserVertices[0], y: laserVertices[1]};
          let dx = circle1.x - circle2.x;
          let dy = circle1.y - circle2.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < circle1.radius + circle2.radius){
            asteroidSound.play();
            initAsteroidBuffers(gl, i);
            scoreCounter++;
            if((scoreCounter+1) % 10  === 1){
              tenPointsSound.play();
            }
          }
        }
      }
      // Making sure the textures are loaded prior to drawing.
      if(numTexturesAndImages === numTexturesAndImagesLoaded){
        drawBackground(gl, numBackgroundVertices, modelMatrix, u_ModelMatrix);
        drawShip(gl, numShipVertices, currentAngle, modelMatrix, u_ModelMatrix, xShip, yShip);
        drawAsteroids(gl, numAsteroidVertices, modelMatrix, u_ModelMatrix);
        drawOverlay(scoreCounter,0,0);
      }
      // Drawing laser.
      if(inRange){
        let xAdj = Math.cos((laserAngle + 90) * (Math.PI / 180));
        let yAdj = Math.sin((laserAngle + 90) * (Math.PI / 180));
        laserVertices[0] = xShip + xAdj * 0.075 * laserCounter;
        laserVertices[1] = yShip + yAdj * 0.075 * laserCounter;
        laserVertices[2] = xShip + xAdj * 0.075 * laserCounter - xAdj * 0.1;
        laserVertices[3] = yShip + yAdj * 0.075 * laserCounter - yAdj * 0.1;
        let xTester = laserVertices[0];
        let yTester = laserVertices[1];
        if(xTester > 1.0 || xTester < -1.0 || yTester > 1.0 || yTester < -1.0){
          inRange = false;
          laserCounter = 0;
        }
        else{
          drawlaser(gl, 2, laserAngle, modelMatrix, u_ModelMatrix);
        }
        laserCounter += 1;
      }
    }
  };
  mainmenu();
}

// Handles drawing the space background.
// gl (RenderingContext) variable holding the rendering context for WebGL.
// numBackgroundVertices (Int) number of vertices for the background.
// modelMatrix (Matrix4) 4x4 matrix.
// u_ModelMatrix (Mat4) shader program 4x4 matrix.
function drawBackground(gl, numBackgroundVertices, modelMatrix, u_ModelMatrix)
{
  modelMatrix.setIdentity();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Render the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, backgroundVertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, fSize * 4, 0);
  gl.enableVertexAttribArray(a_Position);
  // Render the texture vertices.
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, fSize * 4, fSize * 2);
  gl.enableVertexAttribArray(a_TexCoord);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture3);
  gl.uniform1i(u_Sampler, 3);
  // Draw.
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, numBackgroundVertices);
}

// Handles rendering and drawing for the ship.
// gl (RenderingContext) variable holding the rendering context for WebGL.
// numShipVertices (Int) number of vertices for the ship.
// currentAngle (Int) current angle of the ship.
// modelMatrix (Matrix4) 4x4 matrix.
// u_ModelMatrix (Mat4) shader program 4x4 matrix.
function drawShip(gl, numShipVertices, currentAngle, modelMatrix, u_ModelMatrix, xShip, yShip)
{
  modelMatrix.setTranslate(xShip, yShip, 0.0);
  modelMatrix.rotate(currentAngle, 0, 0, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Render the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, shipBuffer);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, fSize * 4, 0);
  gl.enableVertexAttribArray(a_Position);
  // // Render the texture vertices.
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, fSize * 4, fSize * 2);
  gl.enableVertexAttribArray(a_TexCoord);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture0);
  // Draw.
  gl.uniform1i(u_Sampler, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, numShipVertices);
}

// Handles rendering and drawing for the laser.
// gl (RenderingContext) variable holding the rendering context for WebGL.
// numLaserVertices (Int) number of vertices for the laser.
// laserAngle (Int) angle of the laser when it was first shot.
// modelMatrix(Matrix4) 4x4 matrix.
// u_ModelMatrix (Mat4) shader program 4x4 matrix.
function drawlaser(gl, numLaserVertices, laserAngle, modelMatrix, u_ModelMatrix)
{
  modelMatrix.setIdentity();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Render the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, laserBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, laserVertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 2 * 4, 0);
  gl.enableVertexAttribArray(a_Position);
  // Render the texture vertices.
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 2 * 4, 2 * 2);
  gl.enableVertexAttribArray(a_TexCoord);
  gl.uniform1i(u_Sampler, 2);
  // Draw.
  gl.drawArrays(gl.LINES, 0, numLaserVertices);
}

// Handles rendering and drawing for the asteroid.
// gl (RenderingContext) variable holding the rendering context for WebGL.
// numAsteroidVertices (Int) number of vertices for the asteroid.
// modelMatrix (Matrix4) 4x4 matrix.
// u_ModelMatrix (Mat4) shader program 4x4 matrix.
function drawAsteroids(gl, numAsteroidVertices, modelMatrix, u_ModelMatrix)
{
  for(var i = 0; i < numAsteroids; i++)
  {
    modelMatrix.setIdentity();
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // Render the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, asteroidBuffer[i]);
    gl.bufferData(gl.ARRAY_BUFFER, asteroidVertices[i], gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, fSize * 4, 0);
    gl.enableVertexAttribArray(a_Position);
    // Render the texture vertices.
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, fSize*4, fSize*2);
    gl.enableVertexAttribArray(a_TexCoord);
    gl.uniform1i(u_Sampler, 1);
    // Draw.
    gl.drawArrays(gl.TRIANGLE_FAN, 0, numAsteroidVertices);
  }
}

// Initializes the laser buffer
// gl (RenderingContext) variable holding the rendering context for WebGL.
// currentAngle (int) current angle of the asteroid.
function initlaserBuffer(gl, currentAngle)
{
  let xlaser1 = Math.cos((currentAngle) * (Math.PI / 180)) * 0.075;
  let ylaser1 = Math.sin((currentAngle) * (Math.PI / 180)) * 0.075;
  let xlaser2 = Math.cos((currentAngle) * (Math.PI / 180)) * 0.15;
  let ylaser2 = Math.sin((currentAngle) * (Math.PI / 180)) * 0.15;
  laserVertices = new Float32Array ([
    xlaser1, ylaser1, 0.5, 0.5,
    xlaser2, ylaser2, 0.5, 0.5
  ]);
  var numLaserVerticesInit = 2; // The number of vertices.
  // Create a buffer object.
  laserBuffer = gl.createBuffer();
  if (!laserBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  // Bind the buffer object to target.
  gl.bindBuffer(gl.ARRAY_BUFFER, laserBuffer);
  // Write date into the buffer object.
  gl.bufferData(gl.ARRAY_BUFFER, laserVertices, gl.STATIC_DRAW);
  // Assign the buffer object to a_Position variable.
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_TexCoord variable.
  a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 2 * 4, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 2 * 4, 2 * 2);
  gl.enableVertexAttribArray(a_TexCoord);
  return numLaserVerticesInit;
}

// Initializes the background buffer.
// gl (RenderingContext) variable holding the rendering context for WebGL.
function initBackgroundBuffer(gl)
{
  backgroundVertices = new Float32Array ([
    1,1,0.75,0.75,
    1,-1,0.75,0.25,
    -1,1,0.25,0.75,
    -1,-1,0.25,0.25,
  ]);
  let numBackgroundVerticesInit = 4; // The number of vertices.
  // Create a buffer object.
  backgroundBuffer = gl.createBuffer();
  if (!backgroundBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  // Bind the buffer object to target.
  gl.bindBuffer(gl.ARRAY_BUFFER, backgroundBuffer);
  // Write date into the buffer object.
  gl.bufferData(gl.ARRAY_BUFFER, backgroundVertices, gl.STATIC_DRAW);
  // Assign the buffer object to a_Position variable.
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_TexCoord variable.
  a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, fSize * 4, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, fSize * 4, fSize * 2);
  gl.enableVertexAttribArray(a_TexCoord);
  return numBackgroundVerticesInit;
}


// Initializes the ship buffer.
// gl (RenderingContext) variable holding the rendering context for WebGL.
function initShipBuffer(gl)
{
  let vertices = new Float32Array ([
    -0.05,-0.05,0.33333333,0,
    0,-0.025,0.5,0.16666666,
    0,0.075,0.5,1,
    0.05,-0.05,.66666666,0
  ]);
  let numShipVerticesInit = 4; // The number of vertices.
  // Create a buffer object.
  shipBuffer = gl.createBuffer();
  if (!shipBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  // Bind the buffer object to target.
  gl.bindBuffer(gl.ARRAY_BUFFER, shipBuffer);
  // Write date into the buffer object.
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  // Assign the buffer object to a_Position variable.
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_TexCoord variable.
  a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, fSize * 4, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, fSize * 4, fSize * 2);
  gl.enableVertexAttribArray(a_TexCoord);
  return numShipVerticesInit;
}

// Initializes the asteroid buffer.
// gl (RenderingContext) variable holding the rendering context for WebGL.
// index (int) index of current asteroid.
function initAsteroidBuffers(gl, index) {
  let num = Math.random();
  // Handles placing the asteroid at a random point just outside the game window.
  if(num > 0.5) {
    if(num > 0.75) {
      //top
      xAsteroid[index] = (num - 0.75) * 10 - 1.25;
      yAsteroid[index] =  1.25;
    }
    else {
      //bottom
      xAsteroid[index] = (num - 0.5) * 10 - 1.25;
      yAsteroid[index] = -1.25;
    }
  }
  else {
    if(num < 0.25) {
      //left
      yAsteroid[index] = (num) * 10 - 1.25;
      xAsteroid[index] = -1.25;
    }
    else {
      //right
      yAsteroid[index] = (num - 0.25) * 10 - 1.25;
      xAsteroid[index] = 1.25;
    }
  }
  let divisor = 20/3;
  // Creates an asteroid made of 8 randomly picked vertices in a selected areas.
  let tempArray = new Float32Array ([
    xAsteroid[index] + Math.random()/divisor,                  //1-x
    yAsteroid[index] + Math.random()/10 + 0.1,                 //1-y
    xAsteroid[index] + Math.random()/divisor + 0.1,            //2-x
    yAsteroid[index] + Math.random()/10,                       //2-y
    xAsteroid[index] + Math.random()/divisor + 0.1,            //3-x
    yAsteroid[index] + Math.random()/10 * (-1),                //3-y
    xAsteroid[index] + Math.random()/divisor,                  //4-x
    yAsteroid[index] + Math.random()/10 * (-1) - (0.1),        //4-y
    xAsteroid[index] + Math.random()/divisor * (-1),           //5-x
    yAsteroid[index] + Math.random()/10 * (-1) - (0.1),        //5-y
    xAsteroid[index] + Math.random()/divisor * (-1) - (0.1),   //6-x
    yAsteroid[index] + Math.random()/10 * (-1),                //6-y
    xAsteroid[index] + Math.random()/divisor * (-1) - (0.1),   //7-x
    yAsteroid[index] + Math.random()/10,                       //7-y
    xAsteroid[index] + Math.random()/divisor * (-1),           //8-x
    yAsteroid[index] + Math.random()/10 + 0.1,                 //8-y
  ]);
  asteroidVertices[index] = new Float32Array ([
    tempArray[0],                                 //1
    tempArray[1],
    (tempArray[0] - xAsteroid[index])*2 + 0.5,
    (tempArray[1] - yAsteroid[index])*2 + 0.5,
    tempArray[2],                                 //2
    tempArray[3],
    (tempArray[2] - xAsteroid[index])*2 + 0.5 ,
    (tempArray[3] - yAsteroid[index])*2 + 0.5 ,
    tempArray[4],                                 //3
    tempArray[5],
    (tempArray[4]  - xAsteroid[index])*2 + 0.5,
    (tempArray[5]  - yAsteroid[index])*2 + 0.5,
    tempArray[6],                                 //4
    tempArray[7],
    (tempArray[6]  - xAsteroid[index])*2 + 0.5,
    (tempArray[7]  - yAsteroid[index])*2 + 0.5,
    tempArray[8],                                 //5
    tempArray[9],
    (tempArray[8]  - xAsteroid[index])*2 + 0.5,
    (tempArray[9]  - yAsteroid[index])*2 + 0.5,
    tempArray[10],                                //6
    tempArray[11],
    (tempArray[10]  - xAsteroid[index])*2 + 0.5,
    (tempArray[11]  - yAsteroid[index])*2 + 0.5,
    tempArray[12],                                //7
    tempArray[13],
    (tempArray[12]  - xAsteroid[index])*2 + 0.5,
    (tempArray[13]  - yAsteroid[index])*2 + 0.5,
    tempArray[14],                                //8
    tempArray[15],
    (tempArray[14]  - xAsteroid[index])*2 + 0.5,
    (tempArray[15]  - yAsteroid[index])*2 + 0.5,
  ]);
  let numAsteroidVerticesInit = 8; // The number of vertices.
  // Gives the asteroid a random angle.
  asteroidAngle[index] = Math.random()*360;
  // Create a buffer object.
  asteroidBuffer[index] = gl.createBuffer();
  if (!asteroidBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  // Bind the buffer object to target.
  gl.bindBuffer(gl.ARRAY_BUFFER, asteroidBuffer[index]);
  // Write date into the buffer object.
  gl.bufferData(gl.ARRAY_BUFFER, asteroidVertices[index], gl.STATIC_DRAW);
  // Assign the buffer object to a_Position variable.
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, fSize*4, 0);
  gl.enableVertexAttribArray(a_Position);
  a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return -1;
  }
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, fSize*4, fSize*2);
  gl.enableVertexAttribArray(a_TexCoord);
  return numAsteroidVerticesInit;
}

// Initializes the textures for the game.
// gl (RenderingContext) holding the rendering context for WebGL.
function initTextures(gl) {
  // Creates texture objects.
  texture0 = gl.createTexture(); // Ship
  texture1 = gl.createTexture(); // Asteroid
  texture2 = gl.createTexture(); // Laser
  texture3 = gl.createTexture(); // Space-Background
  if (!texture0 || !texture1 || !texture2 || !texture3) {
    console.log('Failed to create the texture object');
    return false;
  }
  // Get the storage location of u_Sampler.
  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }
  // Create the image objects.
  let imageShip = new Image();
  let imageAsteroid = new Image();
  let imageLaser = new Image();
  let imageSpace = new Image();
  // Set image Crossorigin to anonymous.
  if (!imageShip || !imageAsteroid || !imageLaser || !imageSpace) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called when image loading is completed.
  imageShip.onload = function(){ loadTexture(gl, texture0, imageShip, 0); };
  imageAsteroid.onload = function(){ loadTexture(gl, texture1, imageAsteroid, 1);};
  imageLaser.onload = function(){ loadTexture(gl, texture2, imageLaser, 2);};
  imageSpace.onload = function(){ loadTexture(gl, texture3, imageSpace, 3);};
  // Tell the browser to load images.
  imageShip.src = './img/ship.jpg';
  imageAsteroid.src = './img/asteroid.jpg';
  imageLaser.src = './img/laser.jpg';
  imageSpace.src = './img/space.jpg';
  return true;
}

// Handles loading in the textures to the game.
// gl (RenderingContext) holding the rendering context for WebGL.
// texture (TextureObject) texture object.
// image (Image) image to be added to texture object.
// texUnit (int) code to represent the texture.
function loadTexture(gl, texture, image, texUnit){
  // Flip Y when unpacking.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  // Make texture unit active.
  if (texUnit === 0) {
    gl.activeTexture(gl.TEXTURE0);
    numTexturesAndImagesLoaded = numTexturesAndImagesLoaded + 1;
  }
  else if (texUnit === 1) {
    gl.activeTexture(gl.TEXTURE1);
    numTexturesAndImagesLoaded = numTexturesAndImagesLoaded + 1;
  }
  else if (texUnit === 2) {
    gl.activeTexture(gl.TEXTURE2);
    numTexturesAndImagesLoaded = numTexturesAndImagesLoaded + 1;
  }
  else if (texUnit === 3){
    gl.activeTexture(gl.TEXTURE3);
    numTexturesAndImagesLoaded = numTexturesAndImagesLoaded + 1;
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

// Handles drawing the score.
// curScore (int) current game score.
// isMainMenu (int) set to true when main menu.
// isGameOver (int) set to true when game is over.
function drawOverlay(curScore, isMainMenu, isGameOver){
  let scoreCanvas = document.getElementById('overlay');
  let context = scoreCanvas.getContext('2d');
  context.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);
  context.fillStyle = '#E3AD40';
  if(isMainMenu) {
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.font = '700 3.2rem Courier Prime';
    context.fillText('Asteroids', scoreCanvas.width/2, 40);
    context.font = '700 1.6rem Courier Prime';
    context.fillText('WASD to move', scoreCanvas.width/2, 160);
    context.fillText('Mouse to aim', scoreCanvas.width/2, 190);
    context.fillText('Left-click to shoot', scoreCanvas.width/2, 220);
    context.fillText('Press Space to start', scoreCanvas.width/2, 250);
  }
  else {
    if(isGameOver) {
      context.font = '700 3.2rem Courier Prime';
      context.fillText('Game Over', scoreCanvas.width/2, 210);
      context.font = '700 0.8rem Courier Prime';
      context.fillText('Press Space to start', scoreCanvas.width/2, 380);
    }
    context.font = '700 1.6rem Courier Prime';
    let score_text = 'Score: ' + curScore
    context.fillText(score_text, scoreCanvas.width/2, 36);
  }
}

// Determine if browser is on a mobile device.
function isMobileDevice() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}