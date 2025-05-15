class SacredGeometry {
    constructor() {
        this.phi = (1 + sqrt(5)) / 2; // Golden ratio
        this.time = 0;
        this.rotationSpeed = 0.005;
        this.layers = floor(random(3, 7));
        this.baseRadius = min(width, height) * random(0.22, 0.36);
        this.points = [];
        this.connections = [];
        this.pointCount = 50;
        this.generatePoints();
        this.mandalaMode = random() > 0.5;
        // Create color palette
        this.baseHue = random(360);
        this.palette = this.generatePalette();
    }

    generatePalette() {
        return {
            primary: color(this.baseHue, 80, 90),
            secondary: color((this.baseHue + 180) % 360, 70, 80),
            accent: color((this.baseHue + 120) % 360, 90, 70)
        };
    }

    generatePoints() {
        this.points = [];
        
        // Generate fibonacci spiral points
        for (let i = 0; i < this.pointCount; i++) {
    let angle = i * TWO_PI * this.phi;
    let radius = this.baseRadius * sqrt(i) / 13;
    // Animate points with a small oscillation
    let osc = sin(this.time + i * 0.2) * 8;
    let x = cos(angle) * (radius + osc);
    let y = sin(angle) * (radius + osc);
    this.points.push(createVector(x, y));
}
        
        // Generate connections between nearby points
        this.connections = [];
        for (let i = 0; i < this.points.length; i++) {
    // Find distances to all other points
    let dists = [];
    for (let j = 0; j < this.points.length; j++) {
        if (i !== j) {
            let d = p5.Vector.dist(this.points[i], this.points[j]);
            dists.push({j, d});
        }
    }
    // Sort by distance and take the 6 nearest neighbors
    dists.sort((a, b) => a.d - b.d);
    for (let k = 0; k < 6; k++) {
        let j = dists[k].j;
        let d = dists[k].d;
        if (d < this.baseRadius * 0.2) {
            this.connections.push({
                a: i,
                b: j,
                life: 255,
                weight: map(d, 0, this.baseRadius * 0.2, 2, 0.5)
            });
        }
    }
}
    }

    drawFlower(x, y, radius, petals) {
        push();
        translate(x, y);
        
        // Draw petals
        for (let i = 0; i < petals; i++) {
            let angle = TWO_PI * i / petals;
            let petalSize = radius * 0.5;
            
            push();
            rotate(angle + this.time * this.rotationSpeed);
            
            // Draw petal
            beginShape();
            for (let t = 0; t <= 1; t += 0.1) {
                let r = petalSize * (1 - t);
                let theta = PI * t;
                let px = cos(theta) * r;
                let py = sin(theta) * r * 0.5;
                vertex(px, py);
            }
            endShape();
            pop();
        }
        pop();
    }

    update() {
        this.time += deltaTime * 0.001;
        
        // Update connection life
        for (let conn of this.connections) {
            conn.life = 255 * (0.5 + 0.5 * sin(this.time + conn.a * 0.1));
        }
        
        // Occasionally switch between mandala and spiral mode
        if (random() < 0.001) {
            this.mandalaMode = !this.mandalaMode;
        }
    }

    display() {
        push();
        translate(0, 0); // Center for WEBGL
        
        // Draw background patterns
        for (let i = 0; i < min(4, this.layers); i++) {
            let t = this.time * this.rotationSpeed + i * TWO_PI / this.layers;
            let size = this.baseRadius * (1 - i/this.layers);
            
            push();
            rotate(t);
            
            // Draw geometric patterns
            noFill();
            strokeWeight(1);
            stroke(this.palette.primary);
            this.drawFlower(0, 0, size, floor(5 + i * 2));
            
            // Draw sacred geometry symbols
            stroke(this.palette.secondary);
            beginShape();
            for (let j = 0; j < 5; j++) {
                let angle = TWO_PI * j / 5;
                let r = size * 0.8;
                vertex(cos(angle) * r, sin(angle) * r);
            }
            endShape(CLOSE);
            pop();
        }
        
        // Draw points and connections
        // 6-fold rotational symmetry for kaleidoscope
for (let i = 0; i < 6; i++) {
    push();
    rotateZ(this.time * 0.7 + i * PI / 3);
    this.drawPointsAndConnections();
    pop();
}
        
        pop();
    }

    drawPointsAndConnections() {
    // Draw connections in WEBGL
    stroke(this.palette.secondary);
    noFill();
    beginShape(LINES);
    for (let idx = 0; idx < min(200, this.connections.length); idx++) {
        let conn = this.connections[idx];
        let a = this.points[conn.a];
        let b = this.points[conn.b];
        vertex(a.x, a.y, 0);
        vertex(b.x, b.y, 0);
    }
    endShape();
    // Draw points in WEBGL
    stroke(this.palette.accent);
    strokeWeight(6);
    for (let p of this.points) {
        point(p.x, p.y, 0);
    }
}
}

let geometry;

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    colorMode(HSB, 360, 100, 100);
    geometry = new SacredGeometry();
}

function draw() {
    // FPS Counter
    if (!this.lastFrameTime) this.lastFrameTime = millis();
    let now = millis();
    let fps = 1000 / (now - this.lastFrameTime);
    this.lastFrameTime = now;
    background(0, 0, 10, 20);
    
    // Add bloom effect
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = color(geometry.palette.primary);
    
    geometry.update();
    geometry.display();

}

function mousePressed() {
geometry = new SacredGeometry();
}

function windowResized() {
resizeCanvas(windowWidth, windowHeight);
geometry = new SacredGeometry();
}
