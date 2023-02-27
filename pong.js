export class Pong {
    constructor(canvas, keyMap) {
        // save canvas and keyMap as members
        this.canvas = canvas;
        this.keyMap = keyMap;
        
        // set size of canvas
        canvas.width = 640;
        canvas.height = 480;
        canvas.style.display = 'block';
        canvas.style.marginLeft = 'auto';
        canvas.style.marginRight = 'auto';

        // save canvas context as member
        this.ctx = canvas.getContext('2d'); 

        let time = new Date();
        this.timer = time.getTime();

        this.init();
    }

    init() {
        this.obstacles = [];

        // Set up the box (bouncing around the screen)
        this.box = new Box();
        this.box.xVel = 5; // units: pixels per frame
        this.box.yVel = 5;
        this.box.width = 20;
        this.box.height = 20;
        this.box.minX = this.canvas.width/2 - this.box.width/2;
        this.box.minY = this.canvas.height-55;
        this.box.sound = {
            game_over: new Audio('./sound/game_over.wav'),
            victory: new Audio('./sound/victory.wav'),
            reset: new Audio('./sound/reset.mp3'),
            paddle_bounce: new Audio('./sound/paddle_bounce.wav'),
            brick_bounce: new Audio('./sound/brick_bounce.wav'),
            launch: new Audio('./sound/launch.wav')
        }
        this.obstacles = this.destructibles();

        // Set up the player (paddle on the left side)
        this.player = new Box();
        this.player.width = 100;
        this.player.height = 10;
        this.player.minX = this.canvas.width/2 - this.player.width/2;
        this.player.minY = this.canvas.height-30;
        this.player.color = [255, 255, 255];
        this.player.paddle = true;
        this.obstacles.push(this.player);     

        this.topEdge = new Box();
        this.topEdge.minX = 0;
        this.topEdge.minY = -10;
        this.topEdge.width = this.canvas.width;
        this.topEdge.height = 10;
        this.obstacles.push(this.topEdge);

        this.leftEdge = new Box();
        this.leftEdge.minX = 0;
        this.leftEdge.minY = 0;
        this.leftEdge.width = 0;
        this.leftEdge.height = this.canvas.height;
        this.obstacles.push(this.leftEdge);

        this.rightEdge = new Box();
        this.rightEdge.minX = this.canvas.width;
        this.rightEdge.minY = 0;
        this.rightEdge.width = this.canvas.width;
        this.rightEdge.height = this.canvas.height;
        this.obstacles.push(this.rightEdge);
        
        // prevDraw is a member variable used for throttling framerate
        this.prevDraw = 0;

        // state variables
        this.gameOver = false;
        this.paused = false;
        this.launcher = true;
        this.sound_played = false;
        this.lives = 3;
    }

    reset() {
        this.player.width = 100;
        this.player.height = 10;
        this.player.minX = this.canvas.width/2 - this.player.width/2;
        this.player.minY = this.canvas.height-30;
        this.player.color = [255, 255, 255];
        this.player.paddle = true;
        this.obstacles.push(this.player);   

        this.box.xVel = 5; // units: pixels per frame
        this.box.yVel = -5;
        this.box.width = 20;
        this.box.height = 20;
        this.box.minX = this.canvas.width/2 - this.box.width/2;
        this.box.minY = this.canvas.height-55;
    }

    mainLoop() {
        // Compute the FPS
        // First get #milliseconds since previous draw
        const elapsed = performance.now() - this.prevDraw;

        if (elapsed < 1000/60) {
            return;
        }
        // 1000 seconds = elapsed * fps. So fps = 1000/elapsed
        const fps = 1000 / elapsed;
        // Write the FPS in a <p> element.
        // document.getElementById('fps').innerHTML = fps;
        
        this.update();
        this.draw();
    }
    
    destructibles() {
        let list = [];
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                let block = new Box();
                block.hit = false;
                block.width = (this.canvas.width-10)/7 - 10;
                block.height = 15;
                block.minX = 10 + (block.width+10)*j;
                block.minY = 10 + (block.height+10)*i;
                block.randomizeColor();
                list.push(block);
            }
        }
        return list;
    }

    update() {
        // Update the player using keyboard info
        if (this.keyMap['ArrowLeft'] && !this.gameOver && !this.paused) {
            this.player.minX -= 10;
            if (this.player.minX < 0) {
                this.player.minX = 0;
            }
        }
        if (this.keyMap['ArrowRight'] && !this.gameOver && !this.paused){
            this.player.minX += 10;
            if (this.player.minX + this.player.width > this.canvas.width) {
                this.player.minX = this.canvas.width - this.player.width;
            }
        }

        if (this.launcher) {
            this.box.minX = this.player.minX + (this.player.width - this.box.width)/2;
            this.box.minY = this.player.minY - 20;
            this.box.xVel = 0;
        }

        if (this.keyMap['s'] && this.launcher) {
            this.launcher = false;
            this.box.xVel = 5;
            this.box.yVel = -5;
            this.box.sound.launch.currentTime = 0;
            this.box.sound.launch.play();
        }
        
        if (this.keyMap['p'] && !this.gameOver && !this.launcher) {
            let x = new Date();
            if (x.getTime() - this.timer > 200) {
                this.timer = x.getTime()
                this.paused = !this.paused;
            }
        }
        
        if (this.paused) {
            return;
        }
        
        this.box.update(this.obstacles);
        
        let score = 0;

        for (const o of this.obstacles) {
            if (o.hit!=null && o.hit){
                score +=1;
            }
        }

        // Check for winning
        if(score == 42){
            this.gameOver = true;
            this.winner = 1;
            if (!this.sound_played) {
                this.box.sound.victory.currentTime = 0;
                this.box.sound.victory.play();
                this.sound_played = true;
            }
            if (this.keyMap[' ']) {
                this.init();
            }
        }
        if (score < 42) {
            if (this.lives == 0) {
                this.gameOver = true;
                this.winner = 2;
                if (!this.sound_played) {
                    this.box.sound.game_over.currentTime = 0;
                    this.box.sound.game_over.play();
                    this.sound_played = true;
                }
                if (this.keyMap[' ']) {
                    this.init();
                }
            }
            else if (this.lives > 0) {
                if (this.box.minY > this.canvas.height) {
                    this.lives -= 1;
                    if (this.lives != 0) {
                        this.box.sound.reset.currentTime = 0;
                        this.box.sound.reset.play();
                        this.reset();
                    }
               }
            }
        }
    }
    
    draw() {
        // clear background
        this.ctx.fillStyle = "rgb(10, 10, 10)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);        
        
        if (this.paused) {
            this.ctx.font = "50px serif";
            this.ctx.textAlign = "center";            
            this.ctx.fillStyle = "rgb(255,0,0)";
            this.ctx.fillText("PAUSED", this.canvas.width/2, this.canvas.height/2);

            this.ctx.font = "30px serif";
            this.ctx.textAlign = "center";            
            this.ctx.fillStyle = "rgb(255,0,0)";
            this.ctx.fillText("Press P to resume", this.canvas.width/2, this.canvas.height/2 + 50);
        }

        // potentially draw victory text
        if (this.gameOver) {
            let x = "You lost!";
            if (this.winner == 1) {
                x = "You won!";
            }
            this.ctx.font = "50px serif";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = 'rgb(255,255,255)';
            this.ctx.fillText(x, this.canvas.width/2, this.canvas.height/2);

            let y = "Press space to restart";
            this.ctx.font = "30px serif";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = 'rgb(255,255,255)';
            this.ctx.fillText(y, this.canvas.width/2, this.canvas.height/2 + 50);
            
            if (this.keyMap[' '] && this.gameOver) {
                this.init();
            }
        }

        if (this.launcher) {
            let x = "Welcome to Breakout!";
            this.ctx.font = "50px serif";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = 'rgb(255,255,255)';
            this.ctx.fillText(x, this.canvas.width/2, this.canvas.height/2);

            let y = "**INSTRUCTIONS**";
            this.ctx.font = "30px serif";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = 'rgb(255,255,255)';
            this.ctx.fillText(y, this.canvas.width/2, this.canvas.height/2 + 50);

            let z1 = "- Press S to begin";
            this.ctx.font = "25px serif";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = 'rgb(255,255,255)';
            this.ctx.fillText(z1, this.canvas.width/2, this.canvas.height/2 + 90);

            let z2 = "- Press P to pause";
            this.ctx.font = "25px serif";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = 'rgb(255,255,255)';
            this.ctx.fillText(z2, this.canvas.width/2, this.canvas.height/2 + 120);

            let z3 = "- Use left/right arrow to move the paddle";
            this.ctx.font = "25px serif";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = 'rgb(255,255,255)';
            this.ctx.fillText(z3, this.canvas.width/2, this.canvas.height/2 + 150);
        }
        else {
            this.ctx.font = "20px serif";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = 'rgb(255,255,255)';
            this.ctx.fillText("Lives: " + this.lives, this.canvas.width-40, this.canvas.height-10);
        }
        
        // Draw the box
        this.box.draw(this.ctx);

        for (const o of this.obstacles) {
            if (o.hit == null) {
                o.draw(this.ctx);
            }
            else if (!o.hit) {
                o.draw(this.ctx);
            }    
        }

        // Save the value of performance.now() for FPS calculation
        this.prevDraw = performance.now();
    }
}

class Box {
    constructor() {
        this.minX = 10;
        this.minY = 30;
        this.width = 20;
        this.height = 20;
        this.xVel = 5;
        this.yVel = 5;  
        this.color = [255, 0, 0];
    }

    randomizeColor() {
        this.color[0] = Math.round(Math.random()*255);
        this.color[1] = Math.round(Math.random()*255);
        this.color[2] = Math.round(Math.random()*255);
    }
    
    intersects(box2) {
        // the x-intervals
        const xi1 = [this.minX, this.minX + this.width];
        const xi2 = [box2.minX, box2.minX + box2.width];
        
        if (!intervalsOverlap(xi1, xi2)) {
            return false;
        }
        
        const yi1 = [this.minY, this.minY + this.height];
        const yi2 = [box2.minY, box2.minY + box2.height];
        
        return intervalsOverlap(yi1, yi2);
    }

    update(obstacles) {
        // move x
        this.minX += this.xVel;

        for (const o of obstacles) {
            if (this.intersects(o) && !o.hit) {
                // undo the step that caused the collision
                if (o.hit != null) {
                    if(this.sound != null) {
                        this.sound.brick_bounce.currentTime = 0;
                        this.sound.brick_bounce.play();
                    }
                    o.hit = true;
                }
                this.minX -= this.xVel;
                if (o.paddle) {
                    let midY_pad = o.minY + o.height/2;
                    let midY_ball = this.minY + this.height/2;
                    let intp = (o.height/2 - Math.abs(midY_pad - midY_ball)) / (o.height/2);
                    let rad = Math.PI * intp / 2;
                    this.yVel = Math.sign(midY_ball - midY_pad);
                    let r = 5 * Math.cos(rad);
                    this.yVel *= r;
                    if(this.sound != null) {
                        this.sound.paddle_bounce.currentTime = 0;
                        this.sound.paddle_bounce.play();
                    }
                }

                // reverse xVel to bounce
                this.xVel *= -1;
                this.randomizeColor();
            }
        }

        // move y
        this.minY += this.yVel;

        for (const o of obstacles) {
            if (this.intersects(o) && !o.hit) {
                // undo the step that caused the collision
                if (o.hit != null) {
                    if(this.sound != null) {
                        this.sound.brick_bounce.currentTime = 0;
                        this.sound.brick_bounce.play();
                    }
                    o.hit = true;
                }
                
                this.minY -= this.yVel;
                if (o.paddle) {
                    let midX_pad = o.minX + o.width/2;
                    let midX_ball = this.minX + this.width/2;
                    let intp = (o.width/2 - Math.abs(midX_pad - midX_ball)) / (o.width/2);
                    let rad = Math.PI * intp / 2;
                    this.xVel = Math.sign(midX_ball - midX_pad);
                    let r = 13 * Math.cos(rad);
                    this.xVel *= r;
                    if(this.sound != null) {
                        this.sound.paddle_bounce.currentTime = 0;
                        this.sound.paddle_bounce.play();
                    }
                }
                // reverse yVel to bounce
                this.yVel *= -1;
                this.randomizeColor();
            }   
        }
    }

    draw(ctx) {
        const [r,g,b] = this.color;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(this.minX, this.minY, this.width, this.height);                
    }
}

function intervalsOverlap(int1, int2) {
    const [a,b] = int1;
    const [c,d] = int2;
    if (a > c) {
        return intervalsOverlap(int2, int1);
    }
    return (b > c);
}