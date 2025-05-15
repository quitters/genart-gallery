class CircuitPoem {
    constructor() {
        this.grid = [];
        // Generative grid variables
        this.cellSize = int(random(32, 54));
        this.gridOffsetX = int(random(-10, 10));
        this.gridOffsetY = int(random(-10, 10));
        this.cols = ceil((width - this.gridOffsetX * 2) / this.cellSize);
        this.rows = ceil((height - this.gridOffsetY * 2) / this.cellSize);
        this.words = [
            'dream', 'flow', 'pulse', 'echo', 'sync', 'wave', 'node', 'path',
            'data', 'time', 'space', 'light', 'spark', 'code', 'loop', 'link', 'core', 'trace', 'glow', 'shift'
        ];
        this.symbols = [
            '⊕', '⊗', '⊙', '◊', '○', '□', '△', '▽',
            '∑', '≡', '≜', '∿', '∩', '∫', '⨀', '⧫', '◆', '◇', '✦', '✧', '✩', '✪', '✫', '✬', '✭', '✮', '★', '☆', '☀', '☁', '☯', '☢', '☣', '☮', '☾', '☽', '✶', '✹', '✺', '✻', '✼', '✽', '✾', '✿', '❀', '❁', '❂', '❃', '❄', '❅', '❆', '❇', '❈', '❉', '❊', '❋', '☘', '☙', '☼', '☽', '☾', '☄'
        ];
        this.activeNodes = [];
        this.connections = [];
        this.palette = this.pickPalette();
        this.init();
    }

    // Curated palettes
    pickPalette() {
        const palettes = [
            // Cyberpunk
            [color(295, 80, 80), color(200, 90, 80), color(60, 100, 95), color(330, 100, 60), color(180, 30, 90)],
            // Pastel
            [color(320, 20, 100), color(200, 30, 100), color(60, 20, 100), color(120, 15, 100), color(30, 15, 100)],
            // Warm
            [color(20, 90, 100), color(35, 80, 100), color(10, 80, 80), color(50, 70, 90), color(5, 90, 90)],
            // Cool
            [color(200, 60, 90), color(210, 40, 80), color(190, 30, 70), color(220, 60, 95), color(160, 40, 80)],
            // Monochrome
            [color(0, 0, 15), color(0, 0, 40), color(0, 0, 70), color(0, 0, 100), color(200, 10, 80)]
        ];
        let p = random(palettes);
        return {
            bg: p[0],
            node: p[1],
            letter: p[2],
            wire: p[3],
            energy: p[4]
        };
    }

    init() {
        // Initialize grid with more generative node types
        const nodeTypes = ['node', 'power', 'switch', 'glitch', 'empty', 'empty', 'empty'];
        for (let i = 0; i < this.cols; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.rows; j++) {
                let t = random(nodeTypes);
                this.grid[i][j] = {
                    type: t,
                    content: random(this.symbols),
                    active: false,
                    energy: 0
                };
            }
        }

        // Add random words
        for (let word of this.words) {
            let x = floor(random(this.cols - word.length));
            let y = floor(random(this.rows));
            if (random() < 0.5) { // horizontal
                for (let i = 0; i < word.length; i++) {
                    this.grid[x + i][y].type = 'letter';
                    this.grid[x + i][y].content = word[i];
                }
            } else { // vertical
                if (y + word.length >= this.rows) y = this.rows - word.length;
                for (let i = 0; i < word.length; i++) {
                    this.grid[x][y + i].type = 'letter';
                    this.grid[x][y + i].content = word[i];
                }
            }
        }
    }

    update() {
        // Update energy levels
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (this.grid[i][j].energy > 0) {
                    this.grid[i][j].energy *= 0.95;
                    
                    // Propagate energy to neighbors
                    this.propagateEnergy(i, j);
                }
            }
        }

        // Update connections
        for (let i = this.connections.length - 1; i >= 0; i--) {
            this.connections[i].life--;
            if (this.connections[i].life <= 0) {
                this.connections.splice(i, 1);
            }
        }

        // Randomly activate nodes
        if (random() < 0.05) {
            let x = floor(random(this.cols));
            let y = floor(random(this.rows));
            if (this.grid[x][y].type === 'node') {
                this.grid[x][y].energy = 1;
                this.createConnections(x, y);
            }
        }
    }

    propagateEnergy(x, y) {
        let neighbors = this.getNeighbors(x, y);
        for (let n of neighbors) {
            if (this.grid[n.x][n.y].type !== 'empty') {
                this.grid[n.x][n.y].energy = 
                    max(this.grid[n.x][n.y].energy, this.grid[x][y].energy * 0.7);
            }
        }
    }

    getNeighbors(x, y) {
        let neighbors = [];
        let dirs = [{x:-1,y:0}, {x:1,y:0}, {x:0,y:-1}, {x:0,y:1}];
        for (let dir of dirs) {
            let nx = x + dir.x;
            let ny = y + dir.y;
            if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
                neighbors.push({x: nx, y: ny});
            }
        }
        return neighbors;
    }

    createConnections(x, y) {
        let neighbors = this.getNeighbors(x, y);
        for (let n of neighbors) {
            if (this.grid[n.x][n.y].type !== 'empty' && random() < 0.5) {
                this.connections.push({
                    start: {x, y},
                    end: {x: n.x, y: n.y},
                    life: random(30, 60),
                    offset: random(TWO_PI)
                });
            }
        }
    }

    display() {
        // Animated generative background
        push();
        noStroke();
        for (let i = 0; i < 40; i++) {
            let r = map(i, 0, 40, 0, (typeof centralCircleSize !== 'undefined' ? centralCircleSize : width * 0.95));
            fill(lerpColor(this.palette.bg, this.palette.energy, sin(frameCount*0.003+i)*0.5+0.5), 8);
            ellipse(width/2, height/2, r, r);
        }
        pop();

        // Draw grid
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                let cell = this.grid[i][j];
                let x = i * this.cellSize + this.cellSize/2 + this.gridOffsetX;
                let y = j * this.cellSize + this.cellSize/2 + this.gridOffsetY;
                if (cell.type !== 'empty') {
                    push();
                    translate(x, y);
                    // Draw energy glow
                    if (cell.energy > 0.1) {
                        drawingContext.shadowBlur = 22;
                        // Ensure palette.accent is defined and a p5.Color
                        let accentCol = (this.palette.accent instanceof p5.Color) ? this.palette.accent : color(0,0,100);
                        let energyCol = (this.palette.energy instanceof p5.Color) ? this.palette.energy : color(60,100,100);
                        let cyc = lerpColor(energyCol, accentCol, 0.5 + 0.5 * sin(frameCount*0.04 + i + j));
                        drawingContext.shadowColor = cyc;
                        noStroke();
                        fill(cyc, 140);
                        circle(0, 0, cell.energy * 26 + (cell.type === 'power' ? 12 : 0));
                    }
                    // Node type color
                    let nodeColor = this.palette.node;
                    if (cell.type === 'power') nodeColor = this.palette.energy;
                    if (cell.type === 'switch') nodeColor = this.palette.wire;
                    if (cell.type === 'glitch') nodeColor = color(0, 100, 100);
                    // Draw content
                    textAlign(CENTER, CENTER);
                    textSize(cell.type === 'node' ? 20 : 16);
                    fill(lerpColor(nodeColor, this.palette.letter, cell.energy));
                    if (cell.type === 'glitch') fill(color(random(360), 100, 100));
                    noStroke();
                    text(cell.content, 0, 0);
                    pop();
                }
            }
        }

        // Draw connections
        for (let conn of this.connections) {
            let x1 = conn.start.x * this.cellSize + this.cellSize/2 + this.gridOffsetX;
            let y1 = conn.start.y * this.cellSize + this.cellSize/2 + this.gridOffsetY;
            let x2 = conn.end.x * this.cellSize + this.cellSize/2 + this.gridOffsetX;
            let y2 = conn.end.y * this.cellSize + this.cellSize/2 + this.gridOffsetY;
            // Connection style
            let thick = 1.5 + 2.5 * noise(conn.offset + frameCount*0.01);
            let dash = int(2 + 6 * noise(conn.offset + frameCount*0.02));
            let glow = 10 + 12 * sin(frameCount*0.02 + conn.offset);
            stroke(this.palette.wire);
            strokeWeight(thick);
            drawingContext.setLineDash([dash, dash]);
            drawingContext.shadowBlur = glow;
            drawingContext.shadowColor = this.palette.energy;
            noFill();
            // Add wave effect to connection
            beginShape();
            for (let t = 0; t <= 1; t += 0.1) {
                let x = lerp(x1, x2, t);
                let y = lerp(y1, y2, t);
                let offset = sin(t * PI + frameCount * 0.1 + conn.offset) * 5;
                let nx = x + offset * (y2-y1) / dist(x1,y1,x2,y2);
                let ny = y - offset * (x2-x1) / dist(x1,y1,x2,y2);
                vertex(nx, ny);
            }
            endShape();
        }
    }
}

// Central circle size variables (for generative control)
let centralCircleBase = 420;
let centralCircleVar = 1.0;
let centralCircleSize = 420;
let circuitPoem;

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 255);
    // Generative central circle size
    centralCircleVar = random(0.85, 1.15);
    centralCircleSize = centralCircleBase * centralCircleVar;
    circuitPoem = new CircuitPoem();
}

function draw() {
    circuitPoem.update();
    circuitPoem.display();
}

function mousePressed() {
    // Create new poem with new color palette
    circuitPoem = new CircuitPoem();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    circuitPoem = new CircuitPoem();
}
