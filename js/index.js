/**
 * @author John Provazek
 * Astroids Game
 */

// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_TexCoord;\n' +
    'varying vec2 v_TexCoord;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelMatrix * a_Position;\n' +
    '  v_TexCoord = a_TexCoord;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform sampler2D u_Sampler;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
    '}\n';

var NUM_ASTROIDS = 5;    // Number of astroids.
var X_SHIP = 0.0;        // X-coordinate of ship.
var Y_SHIP = 0.0;        // Y-coordinate of ship.
var X_CURSER = 0.0;      // X-coordinate of mouse curser.
var Y_CURSER = 1.0;      // Y-coordinate of mouse curser.
var triggerPull = false; // Boolean value set to whether mouse is clicked.
var laserBuffer;         // Shouldn't be global.
var shipBuffer;          // Shouldn't be global.
var backgroundBuffer;    // Shouldn't be global.
var astroidBuffer = new Array(NUM_ASTROIDS);  // Shouldn't be global.
var a_Position;          // Shader vertices.
var a_TexCoord;          // Shader texture vertices.
var FSIZE;               // Bytes per element of vertices arrays.
var backgroundVertices;
var laserVertices;
var astroidVertices = new Array(NUM_ASTROIDS);
var astroidAngle = new Array(NUM_ASTROIDS);   // Angle the astroid is traveling.
var X_ASTROID = new Array(NUM_ASTROIDS);      // X-coordinate of astroids.
var Y_ASTROID = new Array(NUM_ASTROIDS);      // Y-coordinate of astroids.
var scoreCounter = 0;                         // Number of astroids hit.
var laserSound = new Audio('./sound/laser.mp3');
var astroidSound = new Audio('./sound/astcrash.mp3');
var deathSound = new Audio('./sound/death.mp3');
var tenPointsSound = new Audio('./sound/10points.wav');
//var gameStartSound = new Audio('../resources/game-start.mp3');


function main()
{
    // gameStartSound.play();
    // Retrieve <canvas> element.
    var canvas = document.getElementById('webgl');
    // Get the rendering context for WebGL.
    var gl = getWebGLContext(canvas);
    if (!gl)
    {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders.
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE))
    {
        console.log('Failed to intialize shaders.');
        return;
    }
    // Initializes ship.
    var num_ship_vertices = initShipBuffer(gl);
    if (num_ship_vertices < 0)
    {
        console.log('Failed to set the positions of the vertices');
        return;
    }
    // Initializes astroids.
    var num_astroid_vertices
    for(var i = 0; i < NUM_ASTROIDS; i++)
    {
        num_astroid_vertices = initAstroidBuffers(gl, i);
        if (num_astroid_vertices < 0)
        {
            console.log('Failed to set the positions of the astroids');
            return;
        }
    }
    //Initializes the moving space background.
    var num_background = initBackgroundBuffer(gl);
    if (num_background < 0)
    {
        console.log('Failed to set up the background properly');
        return;
    }
    // Sets up all the textures for the game.
    if (!initTextures(gl)) {
        console.log('Failed to intialize the texture.');
        return;
    }
    // Get storage location of u_ModelMatrix
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix)
    {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    // Current rotation angle
    var currentAngle = 0.0;
    // Model matrix
    var modelMatrix = new Matrix4();
    // holds data on the state of keypresses
    var keyState = {};

    // Event listener for keydown
    document.addEventListener('keydown',function(e){
        keyState[e.keyCode || e.which] = true;
    },true);
    // Event listener for keyup
    document.addEventListener('keyup',function(e){
        keyState[e.keyCode || e.which] = false;
    },true);
    // Event listener for mouse clicks
    canvas.addEventListener('click',function(e){
        triggerPull = true;
    },true);
    // Event listener for mouse movement
    canvas.addEventListener('mousemove',function(e){
        var rect = e.target.getBoundingClientRect() ;
        X_CURSER = ((e.pageX - rect.left) - canvas.width/2)/(canvas.width/2);
        Y_CURSER = (canvas.height/2 - (e.pageY - rect.top))/(canvas.height/2);
    },true);

    var isStoppedXleft = true;  // Is the ship stopped in the left direction.
    var isStoppedXright = true; // Is the ship stopped in the right direction.
    var isStoppedYup = true;    // Is the ship stopped in the up direction.
    var isStoppedYdown = true;  // Is the ship stopped in the down direction.
    var speedX = 0.0;           // Speed of the ship in the X direction.
    var speedY = 0.0;           // Speed of the ship in the Y direction.
    var inRange = false;        // Is the laser still in the range of the screen.
    var laserCounter = 1;       // Keeps track of how far the laser has traveled.
    var laserAngle;             // Angle of the laser when it was first shot.
    var stillAlive = true;      // Is the game still going.


    //main game loop
    var tick = function()
    {
        // Finding the current angle of the ship based on the curser.
        currentAngle = Math.atan2(Y_CURSER - Y_SHIP, X_CURSER - X_SHIP) * 180 /
                                                                Math.PI - 90;
        // Checking if the user has clicked the mouse prompting a laser to be made.
        if(triggerPull == true)
        {
        laserSound.play();
        initlaserBuffer(gl, currentAngle);
        triggerPull = false;
        inRange = true;
        laserAngle = currentAngle;
        }

        // The following statemnet handle moving the ship. Needs improvement.
        // Error with first couple ship movements and code could be more efficient.

        // Moving ship left.
        if (keyState[65])
        {
        X_SHIP = X_SHIP + speedX;
        if(speedX > -0.02)
        {
            speedX = speedX - 0.001;
        }
        if(X_SHIP < -1.0)
        {
            X_SHIP = -1.0;
        }
        isStoppedXleft = false;
        }
        // Moving ship right.
        if (keyState[68])
        {
        X_SHIP = X_SHIP + speedX;
        if(speedX < 0.02)
        {
            speedX = speedX + 0.001;
        }
        if(X_SHIP > 1.0)
        {
            X_SHIP = 1.0;
        }
        isStoppedXright = false;
        }
        //  Moving ship down.
        if (keyState[83])
        {
        Y_SHIP = Y_SHIP + speedY;
        if(speedY > -0.02)
        {
            speedY = speedY - 0.001;
        }
        if(Y_SHIP < -1.0)
        {
            Y_SHIP = -1.0;
        }
        isStoppedYdown = false;
        }
        //  Moving ship up.
        if (keyState[87])
        {
        Y_SHIP = Y_SHIP + speedY;
        if(speedY < 0.02)
        {
            speedY = speedY + 0.001;
        }
        if(Y_SHIP > 1.0)
        {
            Y_SHIP = 1.0;
        }
        isStoppedYup = false;
        }
        // Stopping ship left.
        if (keyState[65] == false && isStoppedXleft == false &&
            keyState[68] == false)
        {
        X_SHIP = X_SHIP + speedX;
        if(speedX < 0.0)
        {
            speedX = speedX + 0.001;
        }
        if(speedX == 0.0)
        {
            isStoppedXleft == true;
        }
        if(X_SHIP < -1.0)
        {
            X_SHIP = -1.0;
        }
        }
        // Stopping ship right.
        if (keyState[68] == false && isStoppedXright == false &&
            keyState[65] == false)
        {
        X_SHIP = X_SHIP + speedX;
        if(speedX > 0.0)
        {
            speedX = speedX - 0.001;
        }
        if(speedX == 0.0)
        {
            isStoppedXright == true;
        }
        if(X_SHIP > 1.0)
        {
            X_SHIP = 1.0;
        }
        }
        // Stopping ship down.
        if (keyState[83] == false && isStoppedYdown == false &&
            keyState[87] == false)
        {
        Y_SHIP = Y_SHIP + speedY
        if(speedY < 0.0)
        {
            speedY = speedY + 0.001;
        }
        if(speedY == 0.0)
        {
            isStoppedYdown == true;
        }
        if(Y_SHIP < -1.0)
        {
            Y_SHIP = -1.0;
        }
        }
        // Stopping ship up.
        if (keyState[87] == false && isStoppedYup == false && keyState[83] == false)
        {
        Y_SHIP = Y_SHIP + speedY;
        if(speedY > 0.0)
        {
            speedY = speedY - 0.001;
        }
        if(speedX == 0.0)
        {
            isStoppedYup == true;
        }
        if(Y_SHIP > 1.0)
        {
            Y_SHIP = 1.0;
        }
        }

        // Moving background in the X direction.
        if(isStoppedXleft == false || isStoppedXright == false)
        {
        backgroundVertices[2] = 0.75 +  (X_SHIP)/8;
        backgroundVertices[6] = 0.75 +  (X_SHIP)/8;
        backgroundVertices[10] = 0.25 + (X_SHIP)/8;
        backgroundVertices[14] = 0.25 + (X_SHIP)/8;
        }
        // Moving background in the Y direction.
        if(isStoppedYup == false || isStoppedYdown == false)
        {
        backgroundVertices[3] = 0.75 +  (Y_SHIP)/8;
        backgroundVertices[7] = 0.25 +  (Y_SHIP)/8;
        backgroundVertices[11] = 0.75 + (Y_SHIP)/8;
        backgroundVertices[15] = 0.25 + (Y_SHIP)/8;
        }


        // Moving astroids
        for(var i = 0; i < NUM_ASTROIDS; i++)
        {
        if(astroidVertices[i][4] >= 1.5 || astroidVertices[i][20] <= -1.5 ||
            astroidVertices[i][1] >= 1.5 || astroidVertices[i][9] <= -1.5)
        {
            astroidAngle[i] = astroidAngle[i] + (180 - (astroidAngle[i]%90)*2);
        }
        var movex = Math.cos((astroidAngle[i] + 90) * (Math.PI / 180))*.01;
        var movey = Math.sin((astroidAngle[i] + 90) * (Math.PI / 180))*.01;
        X_ASTROID[i] += movex;
        Y_ASTROID[i] += movey;
        for(q = 0; q < 8; q++)
        {
            astroidVertices[i][q*4]   += movex;
            astroidVertices[i][q*4+1] += movey;
        }
        }

        // Astroid-Ship collisiton detection using circle collison algorithm
        for(var i = 0; i < NUM_ASTROIDS; i++)
        {
        var circle1 = {radius: .05, x: X_SHIP, y: Y_SHIP};
        var circle2 = {radius: .16, x: X_ASTROID[i], y: Y_ASTROID[i]};
        var dx = circle1.x - circle2.x;
        var dy = circle1.y - circle2.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < circle1.radius + circle2.radius)
        {
            deathSound.play();
            document.getElementById("Title").innerHTML = "GAME OVER.  " +
                                                    "\"Cntl + R\" to play again.";
            document.getElementById("Score").innerHTML = "Score: " + scoreCounter;
            stillAlive = false;
        }
        }

        // Astroid-Laser collisiton detection using circle collison algorithm
        if(inRange)
        {
            for(var i = 0; i < NUM_ASTROIDS; i++)
            {
                var circle1 = {radius: .16, x: X_ASTROID[i], y: Y_ASTROID[i]};
                var circle2 = {radius: 0, x: laserVertices[0], y: laserVertices[1]};
                var dx = circle1.x - circle2.x;
                var dy = circle1.y - circle2.y;
                var distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < circle1.radius + circle2.radius)
                {
                astroidSound.play();
                initAstroidBuffers(gl, i);
                scoreCounter++;
                if((scoreCounter+1) % 10  == 1 )
                {
                    tenPointsSound.play();
                    // Future implementation: add more astroids to game here.
                }
                document.getElementById("Score").innerHTML = "Score: " + scoreCounter;
                }
            }
        }

        // Future implementation: Astroid-Astroid collison.

        // //Astroid-Astroid collisiton using circle collison algorithm
        // var points = [];
        // for(var j = 0; j < NUM_ASTROIDS; j++)
        // {
        //   points[j*2]   = X_ASTROID[j];
        //   points[j*2+1] = Y_ASTROID[j];
        // }
        // for(var i = 0; i < NUM_ASTROIDS; i++)
        // {
        //   for(var k = 0; k < NUM_ASTROIDS; k++)
        //   {
        //     if(i!=k)
        //     {
        //       //var dx = circle1.x - circle2.x;
        //       var dx = points[i*2] - points[k*2];
        //       //var dy = circle1.y - circle2.y;
        //       var dx = points[k*2+1] - points[k*2+1];
        //       var distance = Math.sqrt(dx * dx + dy * dy);
        //       if (distance < .26)
        //       {
        //          //what to put here
        //       }
        //     }
        //   }
        // }


        // Drawing and rendering handled here.
        // Making sure the textures are loaded prior to drawing.
        if(g_texUnit0 && g_texUnit1 && g_texUnit3)
        {
        drawBackground(gl, num_background, modelMatrix, u_ModelMatrix);
        drawShip(gl, num_ship_vertices, currentAngle, modelMatrix, u_ModelMatrix);
        drawAstroids(gl, num_astroid_vertices, modelMatrix, u_ModelMatrix);
        }

        // Drawing laser.
        if(inRange)
        {
        var xAdj = Math.cos((laserAngle + 90) * (Math.PI / 180))
        var yAdj = Math.sin((laserAngle + 90) * (Math.PI / 180))
        laserVertices[0] = X_SHIP + xAdj * 0.075 * laserCounter;
        laserVertices[1] = Y_SHIP + yAdj * 0.075 * laserCounter;
        laserVertices[2] = X_SHIP + xAdj * 0.075 * laserCounter - xAdj * 0.1;
        laserVertices[3] = Y_SHIP + yAdj * 0.075 * laserCounter - yAdj * 0.1;
        var xTester = laserVertices[0];
        var yTester = laserVertices[1];
        if(xTester > 1.0 || xTester < -1.0 || yTester > 1.0 || yTester < -1.0)
        {
            inRange = false;
            laserCounter = 0;
        }
        else
        {
            drawlaser(gl, 2, laserAngle, modelMatrix, u_ModelMatrix);
        }
        laserCounter += 1;
        }

        if(stillAlive)
        {
        requestAnimationFrame(tick, canvas); //Request that the browser calls tick
        }
    };
    tick();
}

/**
 * Handles drawing the space background.
 *
 *
 * @param {RenderingContext} gl variable holding the rendering context for WebGL
 * @param {Int} num_background number of vertices for the background
 * @param {Matrix4} modelMatrix 4x4 matrix
 * @param {Mat4} u_ModelMatrix shader program 4x4 matrix
 */

function drawBackground(gl, num_background, modelMatrix, u_ModelMatrix)
{
    modelMatrix.setIdentity();
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // Render the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, backgroundBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, backgroundVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
    gl.enableVertexAttribArray(a_Position);
    // Render the texture vertices.
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
    gl.enableVertexAttribArray(a_TexCoord);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture3);
    gl.uniform1i(u_Sampler, 3);
    // Draw.
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, num_background);
}

/**
 * Handles rendering and drawing for the ship.
 *
 *
 * @param {RenderingContext} gl variable holding the rendering context for WebGL
 * @param {Int} num_ship_vertices number of vertices for the ship
 * @param {Int} currentAngle current angle of the ship
 * @param {Matrix4} modelMatrix 4x4 matrix
 * @param {Mat4} u_ModelMatrix shader program 4x4 matrix
 */

function drawShip(gl, num_ship_vertices, currentAngle, modelMatrix, u_ModelMatrix)
{
    modelMatrix.setTranslate(X_SHIP, Y_SHIP, 0.0);
    modelMatrix.rotate(currentAngle, 0, 0, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // Render the vertices.
    gl.bindBuffer(gl.ARRAY_BUFFER, shipBuffer);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
    gl.enableVertexAttribArray(a_Position);
    // // Render the texture vertices.
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
    gl.enableVertexAttribArray(a_TexCoord);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    // Draw.
    gl.uniform1i(u_Sampler, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, num_ship_vertices); //was lineloop
}

/**
 * Handles rendering and drawing for the laser.
 *
 *
 * @param {RenderingContext} gl variable holding the rendering context for WebGL
 * @param {Int} num_laser_vertices number of vertices for the laser
 * @param {Int} laserAngle angle of the laser when it was first shot
 * @param {Matrix4} modelMatrix 4x4 matrix
 * @param {Mat4} u_ModelMatrix shader program 4x4 matrix
 */

function drawlaser(gl, num_laser_vertices, laserAngle, modelMatrix, u_ModelMatrix)
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
    gl.drawArrays(gl.LINES, 0, num_laser_vertices);
}

/**
 * Handles rendering and drawing for the astroid.
 *
 *
 * @param {RenderingContext} gl variable holding the rendering context for WebGL
 * @param {Int} num_astroid_vertices number of vertices for the astroid
 * @param {Matrix4} modelMatrix 4x4 matrix
 * @param {Mat4} u_ModelMatrix shader program 4x4 matrix
 */

function drawAstroids(gl, num_astroid_vertices, modelMatrix, u_ModelMatrix)
{
    for(var i = 0; i < NUM_ASTROIDS; i++)
    {
        modelMatrix.setIdentity();
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        // Render the vertices.
        gl.bindBuffer(gl.ARRAY_BUFFER, astroidBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, astroidVertices[i], gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
        gl.enableVertexAttribArray(a_Position);
        // Render the texture vertices.
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE*4, FSIZE*2);
        gl.enableVertexAttribArray(a_TexCoord);
        gl.uniform1i(u_Sampler, 1);
        // Draw.
        gl.drawArrays(gl.TRIANGLE_FAN, 0, num_astroid_vertices);  // was line_loop
    }
}

/**
 * Initializes the laser buffer
 *
 *
 * @param {RenderingContext} gl variable holding the rendering context for WebGL
 * @param {Int} currentAngle current angle of the astroid
 */

function initlaserBuffer(gl, currentAngle)
{
    var xlaser1 = X_SHIP + Math.cos((currentAngle) * (Math.PI / 180))*0.075;
    var ylaser1 = Y_SHIP + Math.sin((currentAngle) * (Math.PI / 180))*0.075;
    var xlaser2 = X_SHIP + Math.cos((currentAngle) * (Math.PI / 180))*0.15;
    var ylaser2 = Y_SHIP + Math.sin((currentAngle) * (Math.PI / 180))*0.15;

    laserVertices = new Float32Array ([
        xlaser1, ylaser1 , 0.5, 0.5,
        xlaser2, ylaser2, 0.5, 0.5
    ]);
    var num_laser_vertices_init = 2;   // The number of vertices.
    // Create a buffer object.
    laserBuffer = gl.createBuffer();
    if (!laserBuffer)
    {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Bind the buffer object to target.
    gl.bindBuffer(gl.ARRAY_BUFFER, laserBuffer);
    // Write date into the buffer object.
    gl.bufferData(gl.ARRAY_BUFFER, laserVertices, gl.STATIC_DRAW);
    // Assign the buffer object to a_Position variable.
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0)
    {
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
    return num_laser_vertices_init;
}

function initBackgroundBuffer(gl)
{
    backgroundVertices = new Float32Array ([
        1,1 ,    0.75, 0.75,
        1,-1,    0.75, 0.25,
        -1, 1,    0.25, 0.75,
        -1,-1,    0.25,0.25,
    ]);
    var num_background_init = 4;   // The number of vertices.
    // Create a buffer object
    backgroundBuffer = gl.createBuffer();
    if (!backgroundBuffer)
    {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Bind the buffer object to target.
    gl.bindBuffer(gl.ARRAY_BUFFER, backgroundBuffer);
    // Write date into the buffer object.
    gl.bufferData(gl.ARRAY_BUFFER, backgroundVertices, gl.STATIC_DRAW);
    // Assign the buffer object to a_Position variable.
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0)
    {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    // Assign the buffer object to a_TexCoord variable.
    a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    if (a_TexCoord < 0) {
        console.log('Failed to get the storage location of a_TexCoord');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
    gl.enableVertexAttribArray(a_TexCoord);
    return num_background_init;
}


/**
 * Initializes the ship buffer
 *
 *
 * @param {RenderingContext} gl variable holding the rendering context for WebGL
 */
function initShipBuffer(gl)
{
    var vertices = new Float32Array ([
        -0.05, -0.05,   0.33333333, 0,
            0, -0.025,         0.5, 0.16666666,
            0, 0.075,          0.5, 1,
        0.05, -0.05,    .66666666, 0
    ]);
    var num_ship_vertices_init = 4;   // The number of vertices.
    // Create a buffer object.
    shipBuffer = gl.createBuffer();
    if (!shipBuffer)
    {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Bind the buffer object to target.
    gl.bindBuffer(gl.ARRAY_BUFFER, shipBuffer);
    // Write date into the buffer object.
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // Assign the buffer object to a_Position variable
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0)
    {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    // Assign the buffer object to a_TexCoord variable.
    a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    if (a_TexCoord < 0) {
        console.log('Failed to get the storage location of a_TexCoord');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
    gl.enableVertexAttribArray(a_TexCoord);
    return num_ship_vertices_init;
}

/**
 * Initializes the astroid buffer
 *
 *
 * @param {RenderingContext} gl variable holding the rendering context for WebGL
 * @param {Int} index index of current astroid
 */
function initAstroidBuffers(gl, index)
{
    var num = Math.random();
    // Handles placing the astroid at a random point just outside the game window.
    if(num > 0.5)
    {
        if(num > 0.75)
        {
            //top
            X_ASTROID[index] = (num - 0.75) * 10 - 1.25;
            Y_ASTROID[index] =  1.25;
        }
        else
        {
            //bottom
            X_ASTROID[index] = (num - 0.5) * 10 - 1.25;
            Y_ASTROID[index] = -1.25;
            }
    }
    else
    {
        if(num < 0.25)
        {
            //left
            Y_ASTROID[index] = (num) * 10 - 1.25;
            X_ASTROID[index] = -1.25;
        }
        else
        {
            //right
            Y_ASTROID[index] = (num - 0.25) * 10 - 1.25;
            X_ASTROID[index] = 1.25;
        }
    }
    var divisor = 20/3;
    // Creates an astroid made of 8 randomly picked vertices in a selected areas.
    var tempArray = new Float32Array ([
        X_ASTROID[index] + Math.random()/divisor,                  //1-x
        Y_ASTROID[index] + Math.random()/10 + 0.1,                 //1-y
        X_ASTROID[index] + Math.random()/divisor + 0.1,            //2-x
        Y_ASTROID[index] + Math.random()/10,                       //2-y
        X_ASTROID[index] + Math.random()/divisor + 0.1,            //3-x
        Y_ASTROID[index] + Math.random()/10 * (-1),                //3-y
        X_ASTROID[index] + Math.random()/divisor,                  //4-x
        Y_ASTROID[index] + Math.random()/10 * (-1) - (0.1),        //4-y
        X_ASTROID[index] + Math.random()/divisor * (-1),           //5-x
        Y_ASTROID[index] + Math.random()/10 * (-1) - (0.1),        //5-y
        X_ASTROID[index] + Math.random()/divisor * (-1) - (0.1),   //6-x
        Y_ASTROID[index] + Math.random()/10 * (-1),                //6-y
        X_ASTROID[index] + Math.random()/divisor * (-1) - (0.1),   //7-x
        Y_ASTROID[index] + Math.random()/10,                       //7-y
        X_ASTROID[index] + Math.random()/divisor * (-1),           //8-x
        Y_ASTROID[index] + Math.random()/10 + 0.1,                 //8-y
    ]);

    astroidVertices[index] = new Float32Array ([
        tempArray[0],                                 //1
        tempArray[1],
    (tempArray[0] - X_ASTROID[index])*2 + 0.5,
    (tempArray[1] - Y_ASTROID[index])*2 + 0.5,
        tempArray[2],                                 //2
        tempArray[3],
    (tempArray[2] - X_ASTROID[index])*2 + 0.5 ,
    (tempArray[3] - Y_ASTROID[index])*2 + 0.5 ,
        tempArray[4],                                 //3
        tempArray[5],
    (tempArray[4]  - X_ASTROID[index])*2 + 0.5,
    (tempArray[5]  - Y_ASTROID[index])*2 + 0.5,
        tempArray[6],                                 //4
        tempArray[7],
    (tempArray[6]  - X_ASTROID[index])*2 + 0.5,
    (tempArray[7]  - Y_ASTROID[index])*2 + 0.5,
        tempArray[8],                                 //5
        tempArray[9],
    (tempArray[8]  - X_ASTROID[index])*2 + 0.5,
    (tempArray[9]  - Y_ASTROID[index])*2 + 0.5,
        tempArray[10],                                //6
        tempArray[11],
    (tempArray[10]  - X_ASTROID[index])*2 + 0.5,
    (tempArray[11]  - Y_ASTROID[index])*2 + 0.5,
        tempArray[12],                                //7
        tempArray[13],
    (tempArray[12]  - X_ASTROID[index])*2 + 0.5,
    (tempArray[13]  - Y_ASTROID[index])*2 + 0.5,
        tempArray[14],                                //8
        tempArray[15],
    (tempArray[14]  - X_ASTROID[index])*2 + 0.5,
    (tempArray[15]  - Y_ASTROID[index])*2 + 0.5,
    ]);
    var num_astroid_vertices_init = 8;   // The number of vertices.
    // Gives the astroid a random angle.
    astroidAngle[index] = Math.random()*360;
    // Create a buffer object.
    astroidBuffer[index] = gl.createBuffer();
    if (!shipBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Bind the buffer object to target.
    gl.bindBuffer(gl.ARRAY_BUFFER, astroidBuffer[index]);
    // Write date into the buffer object.
    gl.bufferData(gl.ARRAY_BUFFER, astroidVertices[index], gl.STATIC_DRAW);
    // Assign the buffer object to a_Position variable.
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    FSIZE = astroidVertices[index].BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*4, 0);
    gl.enableVertexAttribArray(a_Position);
    a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    if (a_TexCoord < 0) {
        console.log('Failed to get the storage location of a_TexCoord');
        return -1;
    }
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE*4, FSIZE*2);
    gl.enableVertexAttribArray(a_TexCoord);
    return num_astroid_vertices_init;
    }

/**
 * Initializes the textures for the game.
 *
 *
 * @param {RenderingContext} gl variable holding the rendering context for WebGL
 */
function initTextures(gl) {
    // Creates texture objects.
    texture0 = gl.createTexture();
    texture1 = gl.createTexture();
    texture2 = gl.createTexture();
    texture3 = gl.createTexture();
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

    // Create the image objects
    var imageShip = new Image();
    var imageAst = new Image();
    var imageYellow = new Image();
    var imageSpace = new Image();
    // Set image Crossorigin to anonymous
    if (!imageShip || !imageAst || !imageYellow || !imageSpace) {
        console.log('Failed to create the image object');
        return false;
    }
    // Register the event handler to be called when image loading is completed.
    imageShip.onload = function(){ loadTexture(gl, texture0, imageShip, 0); };
    imageAst.onload = function(){ loadTexture(gl, texture1, imageAst, 1);};
    imageYellow.onload = function(){ loadTexture(gl, texture2, imageYellow, 2);};
    imageSpace.onload = function(){ loadTexture(gl, texture3, imageSpace, 3);};
    // Tell the browser to load images.
    imageShip.src = './img/ship.jpg';
    imageAst.src = './img/astroid1.jpg';
    imageYellow.src = './img/yellow.jpg';
    imageSpace.src = './img/space.jpg';
    return true;
}


var g_texUnit0 = false, g_texUnit1 = false,
    g_texUnit2 = false, g_texUnit3 = false;

function loadTexture(gl, texture, image, texUnit) {
    // Flip Y when unpacking.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // Make texture unit active.
    if (texUnit == 0)
    {
        gl.activeTexture(gl.TEXTURE0);
        g_texUnit0 = true;
    }
    else if (texUnit == 1)
    {
        gl.activeTexture(gl.TEXTURE1);
        g_texUnit1 = true;
    }
    else if (texUnit == 2)
    {
        gl.activeTexture(gl.TEXTURE2);
        g_texUnit2 = true;
    }
    else
    {
        gl.activeTexture(gl.TEXTURE3);
        g_texUnit3 = true;
    }
    // Bind to target.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Set texture parameters.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Upload image to GPU.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}
