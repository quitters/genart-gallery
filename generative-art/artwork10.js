// === Constants ===
const MAX_ATTRACTORS = 8;
const NUM_PARTICLES = 200;
const ATTRACTOR_MASS_MIN = 50;
const ATTRACTOR_MASS_MAX = 150;
const ATTRACTOR_LIFESPAN_MIN = 300;
const ATTRACTOR_LIFESPAN_MAX = 600;
const PARTICLE_HISTORY_MIN = 10;
const PARTICLE_HISTORY_MAX = 30;
const PARTICLE_MASS_MIN = 0.1;
const PARTICLE_MASS_MAX = 2;
const PARTICLE_ALPHA_MIN = 150;
const PARTICLE_ALPHA_MAX = 200;
const PARTICLE_MAX_SPEED = 15;

class Attractor {
    constructor(x, y, mass) {
        this.dragging = false;
        this.dragOffset = createVector(0, 0);
    
        this.pos = createVector(x, y);
        this.mass = mass;
        this.r = sqrt(mass) * 2;
        this.color = color(random(360), 80, 100);
        this.active = true;
        this.lifespan = random(ATTRACTOR_LIFESPAN_MIN, ATTRACTOR_LIFESPAN_MAX);
    }

    // Calculate gravitational force applied to a particle
    attract(particle) {
        let force = p5.Vector.sub(this.pos, particle.pos);
        let distance = force.mag();
        distance = constrain(distance, 5, 25);
        let strength = (this.mass * particle.mass) / (distance * distance);
        force.setMag(strength);
        return force;
    }

    update() {
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.active = false;
        }
    }

    display() {
        // Save context state
        push();
        noStroke();
        let alpha = map(this.lifespan, 0, ATTRACTOR_LIFESPAN_MIN, 0, 255);
        fill(this.color._getHue(), 80, 100, alpha);
        // Add glow effect
        drawingContext.shadowBlur = 20;
        drawingContext.shadowColor = color(this.color._getHue(), 80, 100);
        circle(this.pos.x, this.pos.y, this.r * 2);
        // Draw a subtle outline when dragging
        if (this.dragging) {
            stroke(0, 0, 100, 200);
            strokeWeight(2);
            noFill();
            circle(this.pos.x, this.pos.y, this.r * 2 + 8);
        }
        // Restore context state
        drawingContext.shadowBlur = 0;
        drawingContext.shadowColor = 'rgba(0,0,0,0)';
        pop();
    }
}

class Particle {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(0.5, 2));
        this.acc = createVector(0, 0);
        this.mass = random(PARTICLE_MASS_MIN, PARTICLE_MASS_MAX);
        this.maxSpeed = PARTICLE_MAX_SPEED;
        this.history = [];
        this.maxHistory = floor(random(PARTICLE_HISTORY_MIN, PARTICLE_HISTORY_MAX));
        this.hue = random(360);
        this.alpha = random(PARTICLE_ALPHA_MIN, PARTICLE_ALPHA_MAX);
    }

    applyForce(force) {
        let f = p5.Vector.div(force, this.mass);
        this.acc.add(f);
    }

    update() {
        // Integrate velocity and position
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);

        // Update trail history
        this.history.push(this.pos.copy());
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        // Wrap around edges
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.y > height) this.pos.y = 0;
        if (this.pos.y < 0) this.pos.y = height;
    }

    display(attractors=[]) {
        // Draw particle trail with blended color if near attractor
        noFill();
        beginShape();
        for (let i = 0; i < this.history.length; i++) {
            let alpha = map(i, 0, this.history.length, 0, this.alpha);
            let baseColor = color(this.hue, 80, 100, alpha);
            let c = baseColor;
            // Blend with attractor color if close
            for (let attractor of attractors) {
                if (p5.Vector.dist(this.history[i], attractor.pos) < attractor.r * 2) {
                    c = lerpColor(baseColor, attractor.color, 0.6);
                }
            }
            stroke(c);
            strokeWeight(map(i, 0, this.history.length, 0.5, 2));
            vertex(this.history[i].x, this.history[i].y);
        }
        endShape();

        // Draw particle itself
        noStroke();
        fill(this.hue, 80, 100, this.alpha);
        circle(this.pos.x, this.pos.y, this.mass * 2);
    }
}

class ParticleNebula {
    constructor() {
        this.particles = [];
        this.attractors = [];
        this.numParticles = NUM_PARTICLES;
        this.init();
    }

    init() {
        // Create initial particles
        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push(new Particle(
                random(width),
                random(height)
            ));
        }
    }

    // Reset all particles and attractors
    reset() {
        this.particles = [];
        this.attractors = [];
        this.init();
    }

    addAttractor(x, y) {
        if (this.attractors.length < MAX_ATTRACTORS) {
            this.attractors.push(new Attractor(x, y, random(ATTRACTOR_MASS_MIN, ATTRACTOR_MASS_MAX)));
        }
    }

    update() {
        // Update attractors and remove inactive ones
        for (let i = this.attractors.length - 1; i >= 0; i--) {
            this.attractors[i].update();
            if (!this.attractors[i].active) {
                this.attractors.splice(i, 1);
            }
        }

        // Update all particles
        for (let particle of this.particles) {
            // Apply forces from all attractors
            for (let attractor of this.attractors) {
                let force = attractor.attract(particle);
                particle.applyForce(force);
            }
            // Add some noise-based movement for organic effect
            let angle = noise(
                particle.pos.x * 0.002,
                particle.pos.y * 0.002,
                frameCount * 0.002
            ) * TWO_PI * 2;
            let noiseForce = p5.Vector.fromAngle(angle);
            noiseForce.mult(0.1);
            particle.applyForce(noiseForce);
            particle.update();
        }
    }

    display() {
        // Draw subtle animated background gradient
        push();
        for (let y = 0; y < height; y += 24) {
            let c1 = color(220, 20, 14, 12); // lower saturation, brightness, alpha
            let c2 = color(260, 24, 20, 8);
            let lerped = lerpColor(c1, c2, y / height);
            stroke(lerped);
            line(0, y, width, y);
        }
        pop();

        // Draw particles with attractor-aware trails
        for (let particle of this.particles) {
            particle.display(this.attractors);
        }

        // Draw attractors
        for (let attractor of this.attractors) {
            attractor.display();
        }
    }
}

let nebula;

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 255);
    background(0);
    nebula = new ParticleNebula();
}

let bgAlpha = 20;
let tripleClickTimestamps = [];
let infiniteTrails = false;

function draw() {
    // Create fade effect (infinite trails mode disables fade)
    background(0, infiniteTrails ? 0 : bgAlpha);
    
    // Occasionally add new attractors
    if (random() < 0.01) {
        nebula.addAttractor(random(width), random(height));
    }
    
    nebula.update();
    nebula.display();
}

let draggingAttractor = null;

function mousePressed() {
    // Triple-click detection for infinite trails mode
    let now = millis();
    tripleClickTimestamps.push(now);
    // Remove timestamps older than 1 second
    tripleClickTimestamps = tripleClickTimestamps.filter(ts => now - ts < 1000);
    if (tripleClickTimestamps.length >= 3) {
        infiniteTrails = !infiniteTrails;
        tripleClickTimestamps = [];
    }

    // Try to pick up an attractor first
    for (let attractor of nebula.attractors) {
        if (dist(mouseX, mouseY, attractor.pos.x, attractor.pos.y) < attractor.r + 8) {
            draggingAttractor = attractor;
            attractor.dragging = true;
            attractor.dragOffset = createVector(mouseX - attractor.pos.x, mouseY - attractor.pos.y);
            return;
        }
    }
    // If not dragging, add attractor at mouse position
    nebula.addAttractor(mouseX, mouseY);
}

function mouseDragged() {
    if (draggingAttractor) {
        draggingAttractor.pos.x = mouseX - draggingAttractor.dragOffset.x;
        draggingAttractor.pos.y = mouseY - draggingAttractor.dragOffset.y;
    }
}

function mouseReleased() {
    if (draggingAttractor) {
        draggingAttractor.dragging = false;
        draggingAttractor = null;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(0);
}
