class QuantumParticle {
    constructor(x, y, partner) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(2, 4));
        this.acc = createVector();
        this.partner = partner;
        this.radius = random(4, 8);
        this.spinPhase = random(TWO_PI);
        this.spinSpeed = random(0.02, 0.05);
        this.hue = random(360);
        this.history = [];
        this.maxHistory = 50;
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        // Update position
        this.vel.add(this.acc);
        this.vel.limit(5);
        this.pos.add(this.vel);
        this.acc.mult(0);

        // Update spin
        this.spinPhase += this.spinSpeed;

        // Update history
        this.history.push(this.pos.copy());
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        // Wrap around edges
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.y < 0) this.pos.y = height;
        if (this.pos.y > height) this.pos.y = 0;

        // Quantum entanglement effect
        if (this.partner) {
            // Synchronized spin
            this.partner.spinPhase = this.spinPhase + PI;

            // Correlated movement
            let distance = p5.Vector.dist(this.pos, this.partner.pos);
            if (distance > 300) {
                let force = p5.Vector.sub(this.partner.pos, this.pos);
                force.normalize();
                force.mult(0.1);
                this.applyForce(force);
            }
        }
    }

    display() {
        push();
        // Draw history trail
        noFill();
        beginShape();
        for (let i = 0; i < this.history.length; i++) {
            let alpha = map(i, 0, this.history.length, 0, 255);
            stroke(this.hue, 80, 100, alpha);
            strokeWeight(1);
            vertex(this.history[i].x, this.history[i].y);
        }
        endShape();

        // Draw quantum wave function
        translate(this.pos.x, this.pos.y);
        noFill();
        for (let i = 0; i < 3; i++) {
            let size = this.radius * (2 + i);
            stroke(this.hue, 80, 100, 100 - i * 30);
            strokeWeight(1);
            beginShape();
            for (let a = 0; a < TWO_PI; a += 0.1) {
                let r = size + sin(a * 8 + this.spinPhase) * 2;
                let x = cos(a) * r;
                let y = sin(a) * r;
                vertex(x, y);
            }
            endShape(CLOSE);
        }

        // Draw particle core
        fill(this.hue, 80, 100);
        noStroke();
        circle(0, 0, this.radius * 2);
        pop();

        // Draw entanglement line
        if (this.partner) {
            push();
            let distance = p5.Vector.dist(this.pos, this.partner.pos);
            let alpha = map(distance, 0, 300, 255, 0);
            stroke(this.hue, 80, 100, alpha);
            strokeWeight(1);
            drawingContext.setLineDash([5, 5]);
            line(this.pos.x, this.pos.y, this.partner.pos.x, this.partner.pos.y);
            
            // Draw interference pattern
            let mid = p5.Vector.add(this.pos, this.partner.pos).mult(0.5);
            let interference = map(sin(this.spinPhase * 2), -1, 1, 0, 1);
            noFill();
            stroke(this.hue, 80, 100, alpha * interference);
            strokeWeight(2);
            drawingContext.setLineDash([]);
            circle(mid.x, mid.y, distance * 0.2);
            pop();
        }
    }
}

class QuantumSystem {
    constructor() {
        this.pairs = [];
        this.init();
    }

    init() {
        // Create quantum-entangled pairs
        for (let i = 0; i < 6; i++) {
            let x1 = random(width);
            let y1 = random(height);
            let x2 = x1 + random(-100, 100);
            let y2 = y1 + random(-100, 100);
            
            let p1 = new QuantumParticle(x1, y1, null);
            let p2 = new QuantumParticle(x2, y2, p1);
            p1.partner = p2;
            
            this.pairs.push([p1, p2]);
        }
    }

    update() {
        for (let pair of this.pairs) {
            pair[0].update();
            pair[1].update();
        }
    }

    display() {
        for (let pair of this.pairs) {
            pair[0].display();
            pair[1].display();
        }
    }
}

let quantumSystem;

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 255);
    background(0);
    quantumSystem = new QuantumSystem();
}

function draw() {
    // Create fade effect
    background(0, 20);
    
    quantumSystem.update();
    quantumSystem.display();
}

function mousePressed() {
    // Create new quantum system
    quantumSystem = new QuantumSystem();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(0);
    quantumSystem = new QuantumSystem();
}
