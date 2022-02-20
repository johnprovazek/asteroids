/**
 * @author John Provazek
 * Astroids Game
 */

// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +  // assigned to the buffer object
    'uniform mat4 u_ModelMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelMatrix * a_Position;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform vec4 u_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = u_Color;\n' +
    '}\n';

var NUM_ASTROIDS = 5;
var X_SHIP = 0.0;        // X-coordinate of ship
var Y_SHIP = 0.0;        // Y-coordinate of ship
var X_CURSER = 0.0;      // X-coordinate of mouse curser
var Y_CURSER = 1.0;      // Y-coordinate of mouse curser
var triggerPull = false; // Boolean value set to whether mouse is clicked
var lazerBuffer;         // possibly shouldn't be global. Don't know work around
var shipBuffer;          // possibly shouldn't be global. Don't know work around
var astroidBuffer = new Array(NUM_ASTROIDS);  //Array because there are multiple
var a_Position;          // possibly shouldn't be global. Don't know work around
var lazerVertices;
var astroidVertices = new Array(NUM_ASTROIDS);
var astroidAngle = new Array(NUM_ASTROIDS);
var X_ASTROID = new Array(NUM_ASTROIDS);  // X-coordinate of astroids
var Y_ASTROID = new Array(NUM_ASTROIDS);  // Y-coordinate of astroids
var scoreCounter = 0;                     // Number of astroids hit

function main()
{
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');
    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl)
    {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE))
    {
        console.log('Failed to intialize shaders.');
        return;
    }
    // Initializes ship
    var num_ship_vertices = initShipBuffer(gl);
    if (num_ship_vertices < 0)
    {
        console.log('Failed to set the positions of the vertices');
        return;
    }
    // Initializes astroids
    for(var i = 0; i < NUM_ASTROIDS; i++)
    {
        var num_astroid_vertices = initAstroidBuffers(gl, i);
        if (num_astroid_vertices < 0)
        {
        console.log('Failed to set the positions of the astroids');
        return;
        }
    }

    // Initilizes the color
    var u_Color = gl.getUniformLocation(gl.program, 'u_Color');
    if (u_Color < 0)
    {
        console.log('Failed to get the storage location of u_Color');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

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


    var isStoppedXleft = true;
    var isStoppedXright = true;
    var isStoppedYdown = true;
    var isStoppedYup = true;
    var speedX = 0.0;      // speed of the ship in the X direction
    var speedY = 0.0;      // speed of the ship in the Y direction
    var inRange = false;   // is the lazer still in the screen
    var lazerCounter = 1;  // keeps track of how far the lazer has traveled
    var lazerAngle;        // angle of the lazer when it was first shot
    var stillAlive = true; // handles ending the game

    //main game loop
    var tick = function()
    {
        currentAngle = Math.atan2(Y_CURSER - Y_SHIP, X_CURSER - X_SHIP) * 180 /
                                                                Math.PI - 90;

        if(triggerPull == true)
        {
        initLazerBuffer(gl, currentAngle);
        triggerPull = false;
        inRange = true;
        lazerAngle = currentAngle;
        }

        //  Moving ship left
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
        //  Moving ship right
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
        //  Moving ship down
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
        //  Moving ship up
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
        //Stopping ship left
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
        //Stopping ship right
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
        //Stopping ship down
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
        //Stopping ship up
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

        //Moving astroids
        for(var i = 0; i < NUM_ASTROIDS; i++)
        {
        if(astroidVertices[i][2] >= 1.5 || astroidVertices[i][10] <= -1.5 ||
            astroidVertices[i][1] >= 1.5 || astroidVertices[i][5] <= -1.5)
        {
            astroidAngle[i] = astroidAngle[i] + (180 - (astroidAngle[i]%90)*2);
        }
        var movex = Math.cos((astroidAngle[i] + 90) * (Math.PI / 180))*.01;
        var movey = Math.sin((astroidAngle[i] + 90) * (Math.PI / 180))*.01;
        X_ASTROID[i] += movex;
        Y_ASTROID[i] += movey;
        for(q = 0; q < 8; q++)
        {
            astroidVertices[i][q*2]   += movex;
            astroidVertices[i][q*2+1] += movey;
        }
        }

        gl.clear(gl.COLOR_BUFFER_BIT);

        //Astroid-Ship collisiton detection using circle collison algorithm
        for(var i = 0; i < NUM_ASTROIDS; i++)
        {
        var circle1 = {radius: .05, x: X_SHIP, y: Y_SHIP};
        var circle2 = {radius: .16, x: X_ASTROID[i], y: Y_ASTROID[i]};
        var dx = circle1.x - circle2.x;
        var dy = circle1.y - circle2.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < circle1.radius + circle2.radius)
        {
            document.getElementById("Title").innerHTML = "GAME OVER.  " +
                                                    "\"Cntl + R\" to play again.";
            document.getElementById("Score").innerHTML = "Score: " + scoreCounter;
            stillAlive = false;
        }
        }

        //Astroid-Lazer collisiton detection using circle collison algorithm
        if(inRange)
        {
        for(var i = 0; i < NUM_ASTROIDS; i++)
        {
            var circle1 = {radius: .16, x: X_ASTROID[i], y: Y_ASTROID[i]};
            var circle2 = {radius: 0, x: lazerVertices[0], y: lazerVertices[1]};
            var dx = circle1.x - circle2.x;
            var dy = circle1.y - circle2.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < circle1.radius + circle2.radius)
            {
            initAstroidBuffers(gl, i);
            scoreCounter++;
            document.getElementById("Score").innerHTML = "Score: " + scoreCounter;
            }
        }
        }

        // Incomplete attempt at Astroid-Astroid collison, leaving here for later

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

        // Drawing and rendering handled here
        drawShip(gl, num_ship_vertices, currentAngle, modelMatrix, u_ModelMatrix, u_Color);
        drawAstroids(gl, num_astroid_vertices, modelMatrix, u_ModelMatrix, u_Color );
        if(inRange)
        {
        var xAdj = Math.cos((lazerAngle + 90) * (Math.PI / 180))
        var yAdj = Math.sin((lazerAngle + 90) * (Math.PI / 180))
        lazerVertices[0] = X_SHIP + xAdj * 0.075 * lazerCounter;
        lazerVertices[1] = Y_SHIP + yAdj * 0.075 * lazerCounter;
        lazerVertices[2] = X_SHIP + xAdj * 0.075 * lazerCounter - xAdj * 0.1;
        lazerVertices[3] = Y_SHIP + yAdj * 0.075 * lazerCounter - yAdj * 0.1;
        var xTester = lazerVertices[0];
        var yTester = lazerVertices[1];
        if(xTester > 1.0 || xTester < -1.0 || yTester > 1.0 || yTester < -1.0)
        {
            inRange = false;
            lazerCounter = 0;
        }
        else
        {
            drawLazer(gl, 2, lazerAngle, modelMatrix, u_ModelMatrix, u_Color);
        }
        lazerCounter += 1;
        }

        if(stillAlive)
        {
        requestAnimationFrame(tick, canvas); //Request that the browser calls tick
        }
    };
    tick();
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
 * @param {Vec4} u_Color uniform variable for color of buffer object
 */

function drawShip(gl, num_ship_vertices, currentAngle, modelMatrix, u_ModelMatrix, u_Color)
    {
    modelMatrix.setTranslate(X_SHIP, Y_SHIP, 0.0);
    modelMatrix.rotate(currentAngle, 0, 0, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniform4f(u_Color, 1.0, 0.0, 0.0, 1.0);
    // render
    gl.bindBuffer(gl.ARRAY_BUFFER, shipBuffer);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    // Draw the rectangle
    gl.drawArrays(gl.LINE_LOOP, 0, num_ship_vertices);
}

/**
 * Handles rendering and drawing for the lazer.
 *
 *
 * @param {RenderingContext} gl variable holding the rendering context for WebGL
 * @param {Int} num_lazer_vertices number of vertices for the lazer
 * @param {Int} lazerAngle angle of the lazer when it was first shot
 * @param {Matrix4} modelMatrix 4x4 matrix
 * @param {Mat4} u_ModelMatrix shader program 4x4 matrix
 * @param {Vec4} u_Color uniform variable for color of buffer object
 */

function drawLazer(gl, num_lazer_vertices, lazerAngle, modelMatrix, u_ModelMatrix, u_Color)
{
    modelMatrix.setIdentity();
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.uniform4f(u_Color, 1.0, 1.0, 0.0, 1.0);
    //render
    gl.bindBuffer(gl.ARRAY_BUFFER, lazerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lazerVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.LINES, 0, num_lazer_vertices);
}

/**
 * Handles rendering and drawing for the astroid.
 *
 *
 * @param {RenderingContext} gl variable holding the rendering context for WebGL
 * @param {Int} num_astroid_vertices number of vertices for the astroid
 * @param {Matrix4} modelMatrix 4x4 matrix
 * @param {Mat4} u_ModelMatrix shader program 4x4 matrix
 * @param {Vec4} u_Color uniform variable for color of buffer object
 */

function drawAstroids(gl, num_astroid_vertices, modelMatrix, u_ModelMatrix, u_Color)
{
    for(var i = 0; i < NUM_ASTROIDS; i++)
    {
        modelMatrix.setIdentity();
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        gl.uniform4f(u_Color, 1.0, 1.0, 1.0, 1.0);
        //render
        gl.bindBuffer(gl.ARRAY_BUFFER, astroidBuffer[i]);
        gl.bufferData(gl.ARRAY_BUFFER, astroidVertices[i], gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.drawArrays(gl.LINE_LOOP, 0, num_astroid_vertices);
    }
}

/**
 * Initializes the lazer buffer
 *
 *
 * @param {RenderingContext} gl variable holding the rendering context for WebGL
 * @param {Int} currentAngle current angle of the astroid
 */

function initLazerBuffer(gl, currentAngle)
{
    var xlazer1 = X_SHIP + Math.cos((currentAngle) * (Math.PI / 180))*0.075;
    var ylazer1 = Y_SHIP + Math.sin((currentAngle) * (Math.PI / 180))*0.075;
    var xlazer2 = X_SHIP + Math.cos((currentAngle) * (Math.PI / 180))*0.15;
    var ylazer2 = Y_SHIP + Math.sin((currentAngle) * (Math.PI / 180))*0.15;

    lazerVertices = new Float32Array ([
        xlazer1, ylazer1 , xlazer2, ylazer2
    ]);
    var num_lazer_vertices_init = 2;   // The number of vertices
    // Create a buffer object
    lazerBuffer = gl.createBuffer();
    if (!lazerBuffer)
    {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, lazerBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, lazerVertices, gl.STATIC_DRAW);
    // Assign the buffer object to a_Position variable
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0)
    {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
    return num_lazer_vertices_init;
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
        0, -0.025,  0.05, -0.05,  0, 0.075,   -0.05, -0.05
    ]);
    var num_ship_vertices_init = 4;   // The number of vertices
    // Create a buffer object
    shipBuffer = gl.createBuffer();
    if (!shipBuffer)
    {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, shipBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // Assign the buffer object to a_Position variable
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0)
    {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
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
    // Handles placing the astroid at a random point outside the game window
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
    // Creates an astroid made of 8 randomly picked vertices in a selected area
    astroidVertices[index] = new Float32Array ([
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
    var num_ship_vertices_init = 8;   // The number of vertices
    //Gives the astroid a random angle
    astroidAngle[index] = Math.random()*360;
    // Create a buffer object
    astroidBuffer[index] = gl.createBuffer();
    if (!shipBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, astroidBuffer[index]);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, astroidVertices[index], gl.STATIC_DRAW);
    // Assign the buffer object to a_Position variable
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
    return num_ship_vertices_init;
}