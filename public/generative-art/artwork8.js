class HarmonicOscillator {
    constructor(frequency, amplitude, phase, color) {
        this.frequency = frequency;
        this.amplitude = amplitude;
        this.phase = phase;
        this.color = color;
        this.history = [];
        this.maxHistory = 150;
    }

    update(time) {
        let value = sin(time * this.frequency + this.phase) * this.amplitude;
        this.history.unshift(value);
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
    }

    display(x, y) {
        push();
        translate(x, y);
        
        // Draw wave with varying opacity
        noFill();
        beginShape();
        for (let i = 0; i < this.history.length; i++) {
            let alpha = map(i, 0, this.history.length, 1, 0);
            stroke(this.color.levels[0], 
                   this.color.levels[1], 
                   this.color.levels[2], 
                   255 * alpha);
            strokeWeight(3 * (1 - i/this.history.length));
            vertex(i * 2, this.history[i]);
        }
        endShape();
        pop();
    }
}

class ColorSymphony {
    constructor() {
        this.oscillators = [];
        this.time = 0;
        this.baseFreq = random(0.05, 0.1);
        this.createOscillators();
        this.particles = [];
        this.maxParticles = 100;
        this.modes = [
            'Straight Right',
            'Upward Arc',
            'Downward Arc',
            'Wavy Sine',
            'Fan Spread',
            'Spiral',
            'Bounce',
            'Center Out'
        ];
        this.mode = 6; // Bounce mode as default
    }

    nextMode() {
        this.mode = (this.mode + 1) % this.modes.length;
    }
    prevMode() {
        this.mode = (this.mode - 1 + this.modes.length) % this.modes.length;
    }

    createOscillators() {
        // Create harmonically related oscillators
        let harmonics = [1, 1.5, 2, 2.5, 3, 4];
        let baseHue = random(360);
        
        for (let i = 0; i < harmonics.length; i++) {
            let hue = (baseHue + i * 360/harmonics.length) % 360;
            let osc = new HarmonicOscillator(
                this.baseFreq * harmonics[i],
                50 - i * 5,
                random(TWO_PI),
                color(hue, 80, 90)
            );
            this.oscillators.push(osc);
        }
    }

    addParticle(x, y, sourceColor) {
        if (this.particles.length < this.maxParticles) {
            // Generative particle spawn logic by mode
let pos, vel;
switch (this.mode) {
    case 0: // Straight Right
        pos = createVector(0, y);
        vel = createVector(random(2.2, 3.5), random(-0.2, 0.2));
        break;
    case 1: // Upward Arc
        pos = createVector(0, y + random(-30, 30));
        vel = createVector(random(2.0, 2.8), random(-2.5, -0.5));
        break;
    case 2: // Downward Arc
        pos = createVector(0, y + random(-30, 30));
        vel = createVector(random(2.0, 2.8), random(0.5, 2.5));
        break;
    case 3: // Wavy Sine
        pos = createVector(0, y);
        vel = createVector(random(2.0, 2.5), sin(frameCount * 0.15 + random(TWO_PI)) * 0.5);
        break;
    case 4: // Fan Spread
        pos = createVector(0, y);
        vel = p5.Vector.fromAngle(random(-PI/12, PI/12)).mult(random(2.0, 3.2)); // mostly horizontal
        break;
    case 5: // Spiral
        pos = createVector(0, y);
        let ang = frameCount * 0.05 + random(TWO_PI);
        vel = createVector(2.0 + cos(ang) * 1.5, sin(ang) * 0.5); // mostly horizontal
        break;
    case 6: // Bounce
        pos = createVector(0, constrain(y, 50, height-50));
        vel = createVector(random(2.0, 2.8), random(-2, 2));
        break;
    case 7: // Center Out
        pos = createVector(width/2, height/2);
        vel = p5.Vector.fromAngle(random(-PI/3, PI/3)).mult(random(2.0, 3.2));
        break;
    default:
        pos = createVector(0, y);
        vel = createVector(random(2.2, 3.5), random(-1, 1));
}
this.particles.push({
    pos: pos,
    vel: vel,
    color: sourceColor,
    life: 255,
    size: random(4, 8),
    bounced: false // for bounce mode
});
        }
    }

    updateParticles() {
        // Gravity vectors for each mode
        const gravities = [
    createVector(0, 0),     // Straight Right: no gravity
    createVector(0, -0.03), // Upward Arc: gentle upward
    createVector(0, 0.09),  // Downward Arc: strong downward
    createVector(0, 0),     // Wavy Sine: no gravity
    createVector(0, 0),     // Fan Spread: no gravity
    createVector(0, 0),     // Spiral: no gravity
    createVector(0, 0.07),  // Bounce: moderate downward
    createVector(0, 0)      // Center Out: no gravity
];
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.pos.add(p.vel);
            p.life -= 0.35; // even slower fade, particles last twice as long

            // Apply mode-specific gravity
            let g = gravities[this.mode] || createVector(0, 0.05);
            p.vel.add(g);

            // Add some organic movement
            let wobble = 0.04;
            if (this.mode === 0) wobble = 0.008; // almost no wobble for Straight Right
            p.vel.rotate(noise(p.pos.x * 0.01, p.pos.y * 0.01, frameCount * 0.01) * wobble);

            // Clamp x velocity to always move right (except Center Out)
            if (this.mode !== 7) p.vel.x = max(p.vel.x, 0.6);
            // Bounce mode: reflect off top/bottom
            if (this.mode === 6) {
                if (p.pos.y < 10 && !p.bounced) { p.vel.y *= -1; p.bounced = true; }
                else if (p.pos.y > height-10 && !p.bounced) { p.vel.y *= -1; p.bounced = true; }
                else if (p.pos.y >= 10 && p.pos.y <= height-10) { p.bounced = false; }
            }
            // Center Out mode: remove if off-canvas
            if (this.mode === 7 && (p.pos.x < -20 || p.pos.x > width+20 || p.pos.y < -20 || p.pos.y > height+20)) {
                this.particles.splice(i, 1);
                continue;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    displayParticles() {
        noStroke();
        for (let p of this.particles) {
            let c = color(p.color);
            fill(red(c), green(c), blue(c), p.life);
            circle(p.pos.x, p.pos.y, p.size);
        }
    }

    update() {
        this.time += deltaTime * 0.001;
        
        // Update oscillators
        for (let osc of this.oscillators) {
            osc.update(this.time);
            
            // Occasionally spawn particles along the wave
            if (random() < 0.1) {
                let index = floor(random(osc.history.length));
                let x = 0; // Always spawn at the far left
                let y = osc.history[index];
                this.addParticle(x, height/2 + y, osc.color);
            }
        }
        
        this.updateParticles();
    }

    display() {
        background(0, 20);
        
        // Draw center line
        stroke(255, 30);
        line(0, height/2, width, height/2);
        
        // Draw oscillators
        push();
        translate(50, height/2);
        for (let osc of this.oscillators) {
            osc.display(0, 0);
        }
        pop();
        
        // Draw particles
        this.displayParticles();
        
        // Add bloom effect
        drawingContext.shadowBlur = 20;
        drawingContext.shadowColor = color(255, 100);
    }
}

let symphony;
let isPlaying = true;

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100);
    symphony = new ColorSymphony();
}

function draw() {
    if (isPlaying) {
        symphony.update();
        symphony.display();
    }
    // Show current mode name
    fill(255);
    noStroke();
    textAlign(RIGHT, TOP);
    textSize(18);
    text('Mode: ' + symphony.modes[symphony.mode], width - 30, 20);
}

function mousePressed() {
    // Toggle play/pause on click
    isPlaying = !isPlaying;
    if (isPlaying) {
        symphony = new ColorSymphony();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    symphony = new ColorSymphony();
}

function keyPressed() {
    if (keyCode === RIGHT_ARROW) {
        symphony.nextMode();
    } else if (keyCode === LEFT_ARROW) {
        symphony.prevMode();
    }
}
