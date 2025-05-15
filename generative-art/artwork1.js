class Particle {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = 2;
        this.hue = colors[currentColorIndex].h; // Use the selected color's hue
        this.saturation = colors[currentColorIndex].s;
        this.brightness = colors[currentColorIndex].b;
        this.baseSize = random(8, 16);
        this.size = this.baseSize;
        this.alpha = 0;
        this.targetAlpha = 0.6;
        this.birthTime = millis();
        this.cluster = null;  // Reference to particle's cluster
        this.isHeld = false;
        this.holdOffset = createVector(0, 0);
    }

    update() {
        if (this.isHeld) {
            try {
                // Update position based on mouse with offset
                let targetX = mouseX + this.holdOffset.x;
                let targetY = mouseY + this.holdOffset.y;
                
                // Add slight wobble based on flow field
                let fieldForce = this.getFieldForce();
                // Limit the field force influence
                let maxForce = 2;
                fieldForce.limit(maxForce);
                targetX += fieldForce.x;
                targetY += fieldForce.y;
                
                // Constrain positions to canvas
                targetX = constrain(targetX, 0, width);
                targetY = constrain(targetY, 0, height);
                
                // Smooth movement to target
                this.pos.x = lerp(this.pos.x, targetX, 0.3);
                this.pos.y = lerp(this.pos.y, targetY, 0.3);
                
                // Reset velocity
                this.vel.mult(0);
            } catch (e) {
                console.error('Error in particle update:', e);
                this.isHeld = false; // Release particle if there's an error
            }
        } else {
            this.vel.add(this.acc);
            this.vel.limit(this.maxSpeed);
            this.pos.add(this.vel);
            this.acc.mult(0);
        }
        
        this.alpha = lerp(this.alpha, this.targetAlpha, 0.1);

        // Wrap around edges with boundary checking
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.y < 0) this.pos.y = height;
        if (this.pos.y > height) this.pos.y = 0;
    }

    getFieldForce() {
        let x = floor(this.pos.x / flowfield.scl);
        let y = floor(this.pos.y / flowfield.scl);
        // Prevent out of bounds array access
        x = constrain(x, 0, flowfield.cols - 1);
        y = constrain(y, 0, flowfield.rows - 1);
        let index = x + y * flowfield.cols;
        return flowfield.field[index] || createVector(0, 0);
    }

    startHold() {
        this.isHeld = true;
        // Ensure mouse position is valid before calculating offset
        if (mouseX !== undefined && mouseY !== undefined) {
            this.holdOffset = p5.Vector.sub(this.pos, createVector(mouseX, mouseY));
        } else {
            this.holdOffset = createVector(0, 0);
        }
    }

    releaseHold() {
        this.isHeld = false;
        // Check if movedX/Y are defined before using them
        if (typeof movedX !== 'undefined' && typeof movedY !== 'undefined') {
            let mouseVel = createVector(movedX, movedY);
            this.vel = mouseVel.mult(0.5);
        } else {
            this.vel = createVector(0, 0);
        }
    }

    follow(flowfield) {
        let x = floor(this.pos.x / flowfield.scl);
        let y = floor(this.pos.y / flowfield.scl);
        x = constrain(x, 0, flowfield.cols - 1);
        y = constrain(y, 0, flowfield.rows - 1);
        let index = x + y * flowfield.cols;
        let force = flowfield.field[index];
        
        if (!force) {
            force = createVector(0, 0);
        }
        
        // Add mode-specific behavior
        switch(flowMode) {
            case FLOW_MODES.GRAVITY:
            case FLOW_MODES.REPEL:
                // Adjust force based on distance to mouse
                let d = dist(this.pos.x, this.pos.y, mouseX, mouseY);
                let strength = map(d, 0, 100, 0.5, 0.1);
                force.mult(strength);
                break;
                
            case FLOW_MODES.CHAOS:
                // Add random jitter
                force.add(p5.Vector.random2D().mult(0.2));
                break;
        }
        
        this.applyForce(force);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    display() {
        noStroke();
        fill(this.hue, this.saturation, this.brightness, this.alpha);
        circle(this.pos.x, this.pos.y, this.size);
    }
}

class FlowField {
    constructor() {
        this.scl = 20;
        this.cols = floor(width / this.scl);
        this.rows = floor(height / this.scl);
        this.field = new Array(this.cols * this.rows);
        this.zoff = 0;
    }

    init() {
        this.cols = floor(width / this.scl);
        this.rows = floor(height / this.scl);
        this.field = new Array(this.cols * this.rows);
        this.calculateField(); // Separate calculation from initialization
    }

    // Renamed the core logic to calculateField
    calculateField(updateOnlyTimeDependent = false) {
        let xoff = 0;
        for (let x = 0; x < this.cols; x++) {
            let yoff = 0;
            for (let y = 0; y < this.rows; y++) {
                let index = x + y * this.cols;
                let angle = 0; // Declare angle here
                let px, py;
                
                switch(flowMode) {
                    case FLOW_MODES.PERLIN:
                         if (!updateOnlyTimeDependent) {
                             angle = noise(xoff, yoff, this.zoff) * TWO_PI * 4;
                             this.field[index] = p5.Vector.fromAngle(angle);
                         }
                         break;
                        
                    case FLOW_MODES.CIRCULAR:
                        if (!updateOnlyTimeDependent) { // Only calculate if not just updating time
                            let centerX = width / 2;
                            let centerY = height / 2;
                            px = x * this.scl + this.scl / 2;
                            py = y * this.scl + this.scl / 2;
                            angle = atan2(py - centerY, px - centerX) + PI/2;
                            this.field[index] = p5.Vector.fromAngle(angle);
                        }
                        break;
                        
                    case FLOW_MODES.GRAVITY:
                        if (!updateOnlyTimeDependent) { // Only calculate if not just updating time
                           px = x * this.scl + this.scl / 2;
                           py = y * this.scl + this.scl / 2;
                            angle = atan2(mouseY - py, mouseX - px);
                            this.field[index] = p5.Vector.fromAngle(angle);
                        }
                        break;
                        
                    case FLOW_MODES.REPEL:
                         if (!updateOnlyTimeDependent) { // Only calculate if not just updating time
                            px = x * this.scl + this.scl / 2;
                            py = y * this.scl + this.scl / 2;
                            angle = atan2(mouseY - py, mouseX - px) + PI;
                            this.field[index] = p5.Vector.fromAngle(angle);
                         }
                        break;
                        
                    case FLOW_MODES.WAVE:
                         if (!updateOnlyTimeDependent) {
                            angle = sin(x * 0.1 + this.zoff) * cos(y * 0.1) * PI;
                            this.field[index] = p5.Vector.fromAngle(angle);
                         }
                        break;
                        
                    case FLOW_MODES.CHAOS:
                         if (!updateOnlyTimeDependent) {
                            angle = noise(xoff, yoff, this.zoff) * TWO_PI * 8;
                            this.field[index] = p5.Vector.fromAngle(angle).mult(random(0.5, 2));
                         }
                        break;
                }
                
                 // Always update yoff regardless of mode or update type
                 yoff += 0.1;
             }
             // Always update xoff regardless of mode or update type
             xoff += 0.1;
         }
    }

    // Update function for time-dependent changes
    update() {
        this.zoff += 0.01;
        // Only recalculate vectors for modes that use zoff
        if (flowMode === FLOW_MODES.PERLIN || flowMode === FLOW_MODES.WAVE || flowMode === FLOW_MODES.CHAOS) {
             this.calculateField(true); // Pass flag to only update time-dependent calculations
        }
        // For modes like GRAVITY/REPEL, we might want to recalculate if mouse moves significantly,
        // but doing it every frame is still costly. Let's skip that for now unless performance allows.
        // Consider adding a check `if (movedX !== 0 || movedY !== 0)` for mouse-dependent modes.
        // if (!this.field) return; // Add check for initialization race condition

        // Simplified recalculation for GRAVITY/REPEL based on mouse pos (could be optimized further)
        if (flowMode === FLOW_MODES.GRAVITY || flowMode === FLOW_MODES.REPEL) {
             this.calculateField(); // Recalculate fully for now, can optimize later if needed
        }
    }
}

class ParticleCluster {
    constructor(x, y) {
        this.center = createVector(x, y);
        this.particles = [];
        this.sizeMultiplier = 1.0;
        this.cohesion = 1.0;  // How tightly particles stick together
        this.birthTime = millis();
    }

    addParticle(particle) {
        this.particles.push(particle);
        particle.cluster = this;
    }

    update() {
        // Update cluster center based on average position of particles
        let newCenter = createVector(0, 0);
        for (let p of this.particles) {
            newCenter.add(p.pos);
        }
        if (this.particles.length > 0) {
            newCenter.div(this.particles.length);
            this.center = newCenter;
        }

        // Apply cohesion force to keep particles together
        for (let p of this.particles) {
            let toCenter = p5.Vector.sub(this.center, p.pos);
            toCenter.mult(0.001 * this.cohesion);
            p.applyForce(toCenter);
            
            // Apply size multiplier
            p.size = p.baseSize * this.sizeMultiplier;
        }

        // Remove dead particles
        this.particles = this.particles.filter(p => millis() - p.birthTime < 30000);
    }
}

let flowfield;
let particles = [];
let maxParticles = 500; // Add a maximum particle limit
let lastSpawnTime = 0;
let spawnInterval = 100;
let targetHue = { h: 180, s: 80, b: 95 };
let mouseHoldStartTime = 0;
let isHolding = false;
let lastClickTime = 0;
let clickInterval = 500;
let clickCount = 0;
let clusters = [];  // Array to track particle clusters
let colorPaletteOpen = false;
let trailMode = 1; // 0: no trails, 1: medium trails, 2: full trails
let icons = {
    paintCan: null,
    trailToggle: null
};
let brushSize = 35; // Default brush size
let minBrushSize = 10;
let maxBrushSize = 500; // Updated max brush size
let colors = [
    { h: 0, s: 100, b: 100 }, // Red
    { h: 60, s: 100, b: 100 }, // Yellow
    { h: 120, s: 100, b: 100 }, // Green
    { h: 240, s: 100, b: 100 }, // Blue
    { h: 300, s: 100, b: 100 }, // Magenta
    { h: 0, s: 0, b: 0 },      // Black
    { h: 0, s: 0, b: 100 }     // White
];
let currentColorIndex = 0;

let flowMode = 0;
const FLOW_MODES = {
    PERLIN: 0,      // Classic perlin noise flow
    CIRCULAR: 1,    // Circular vortex pattern
    GRAVITY: 2,     // Particles attracted to mouse
    REPEL: 3,       // Particles repelled from mouse
    WAVE: 4,        // Sine wave pattern
    CHAOS: 5        // Random direction changes
};
const FLOW_MODE_COUNT = 6;

const uiElements = {}; // Object to hold UI element definitions
// State to track which button was pressed down
let buttonPressedState = {
    flowMode: false, // Use boolean flags
    brushSize: false,
    color: false,
    trailMode: false,
    targetButton: null // Store which button was actually pressed
};

function preload() {
    // Create paint can icon
    icons.paintCan = createGraphics(40, 40);
    drawPaintCanIcon(icons.paintCan);
    
    // Create trail toggle icon
    icons.trailToggle = createGraphics(40, 40);
    drawTrailToggleIcon(icons.trailToggle);
}

function drawPaintCanIcon(g) {
    g.clear();
    g.stroke(0);
    g.strokeWeight(2);
    g.fill(220);
    g.rect(8, 12, 24, 20, 2);
    g.rect(12, 8, 16, 4);
    g.line(14, 4, 26, 4);
    g.line(14, 4, 12, 8);
    g.line(26, 4, 28, 8);
}

function drawTrailToggleIcon(g) {
    g.clear();
    g.stroke(0);
    g.strokeWeight(2);
    g.noFill();
    g.beginShape();
    for(let i = 0; i < 3; i++) {
        g.curveVertex(10 + i*10, 20 + sin(i*2)*5);
    }
    g.endShape();
    g.fill(220);
    g.ellipse(30, 20, 8, 8);
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container'); // Ensure canvas is placed correctly
    colorMode(HSB, 360, 100, 100, 1);
    background(95);
    flowfield = new FlowField();
    flowfield.init();
    initializeUI(); // Initialize UI element positions/sizes

    // Initialize particles
    for (let i = 0; i < 200; i++) {
        if (particles.length < maxParticles) { // Check against cap during init too
             particles.push(new Particle(random(width), random(height)));
        }
    }
}

// Function to initialize UI element properties
function initializeUI() {
    let buttonSize = 40;
    let margin = 10;
    let startX = width - margin - buttonSize;

    uiElements.flowModeButton = { x: startX - (buttonSize + margin) * 3, y: margin, w: buttonSize, h: buttonSize, cornerRadius: 5 };
    uiElements.brushSizeButton = { x: startX - (buttonSize + margin) * 2, y: margin, w: buttonSize, h: buttonSize, cornerRadius: 5 };
    uiElements.colorButton = { x: startX - (buttonSize + margin) * 1, y: margin, w: buttonSize, h: buttonSize, cornerRadius: 5 };
    uiElements.trailModeButton = { x: startX, y: margin, w: buttonSize, h: buttonSize, cornerRadius: 5 };
}

function draw() {
    // Map trailMode (0-4) to alpha values (1, 0.5, 0.2, 0.05, 0)
    let trailAlphaValues = [1, 0.5, 0.2, 0.05, 0];
    let bgAlpha = trailAlphaValues[trailMode];

    // Adjust background fade based on trail mode
    background(95, bgAlpha); 

    try {
        flowfield.update(); // Update flow field incrementally

        // Limit particle count
        while (particles.length > maxParticles) {
            particles.shift(); // Remove the oldest particle
        }

        // Update particles with error handling
        for (let i = particles.length - 1; i >= 0; i--) {
            try {
                let particle = particles[i];
                particle.follow(flowfield);
                particle.update();
                particle.display();
                
                // Remove particles that are too old or invalid
                if (millis() - particle.birthTime > 30000) {
                    particles.splice(i, 1);
                }
            } catch (e) {
                console.error('Error updating particle:', e);
                particles.splice(i, 1);
            }
        }

        // Update clusters with error handling
        for (let i = clusters.length - 1; i >= 0; i--) {
            try {
                clusters[i].update();
                if (clusters[i].particles.length === 0) {
                    clusters.splice(i, 1);
                }
            } catch (e) {
                console.error('Error updating cluster:', e);
                clusters.splice(i, 1);
            }
        }

        // Handle long press with bounds checking
        if (isHolding && mouseIsPressed &&
            mouseX >= 0 && mouseX <= width &&
            mouseY >= 0 && mouseY <= height) {
            
            let holdDuration = millis() - mouseHoldStartTime;
            if (clusters.length > 0) {
                let currentCluster = clusters[clusters.length - 1];
                let sizeMultiplier = map(sin(holdDuration * 0.002), -1, 1, 0.5, 1.5);
                currentCluster.sizeMultiplier = sizeMultiplier;
            }
        }

        // Draw UI last
        drawUI();
        
        // Update particle colors
        updateParticleColors();
    } catch (e) {
        console.error('Error in draw loop:', e);
        // Reset state if necessary
        isHolding = false;
        background(95);
    }
}

function drawSkeuomorphicButton(btn, iconDrawFunc) {
    // Base
    fill(230); // Light base
    noStroke();
    rect(btn.x, btn.y, btn.w, btn.h, btn.cornerRadius);

    // Inner shadow (top-left)
    fill(200, 0.5); // Darker, semi-transparent
    rect(btn.x, btn.y, btn.w, btn.h, btn.cornerRadius);

    // Main surface (slightly inset)
    fill(245); // Slightly lighter than base
    rect(btn.x + 1, btn.y + 1, btn.w - 2, btn.h - 2, btn.cornerRadius - 1);

     // Highlight (bottom-right inset)
    fill(255, 0.6); // White, semi-transparent
    rect(btn.x + 1, btn.y + 1, btn.w - 2, btn.h - 2, btn.cornerRadius - 1);

    // Bevel effect (darker bottom/right edge)
    fill(200); // Darker edge color
    noStroke();
    // Bottom edge
    rect(btn.x + btn.cornerRadius / 2, btn.y + btn.h - 3, btn.w - btn.cornerRadius, 3, btn.cornerRadius / 3);
    // Right edge
    rect(btn.x + btn.w - 3, btn.y + btn.cornerRadius / 2, 3, btn.h - btn.cornerRadius, btn.cornerRadius / 3);
    // Bottom-right corner (ellipse used for smoother corner)
    ellipse(btn.x + btn.w - btn.cornerRadius / 2, btn.y + btn.h - btn.cornerRadius/2, btn.cornerRadius, btn.cornerRadius);


    // Draw the specific icon centered
    push();
    translate(btn.x + btn.w / 2, btn.y + btn.h / 2);
    iconDrawFunc();
    pop();
}

function drawUI() {
    // Flow mode icon
    drawSkeuomorphicButton(uiElements.flowModeButton, () => {
        stroke(50);
        strokeWeight(1.5);
        noFill();
        // Simplified Perlin-like waves
        if (flowMode === FLOW_MODES.PERLIN) {
            for(let i = -1; i <= 1; i++) {
                beginShape();
                for(let x = -10; x <= 10; x += 4) {
                    let y = sin(x * 0.3 + i) * 3;
                    vertex(x, y + i * 4);
                }
                endShape();
            }
        } else if (flowMode === FLOW_MODES.CIRCULAR) {
             ellipse(0, 0, 18, 18);
             ellipse(0, 0, 8, 8);
        } else if (flowMode === FLOW_MODES.GRAVITY) {
            for(let a = 0; a < TWO_PI; a += PI/3) {
                line(cos(a) * 9, sin(a) * 9, cos(a) * 5, sin(a) * 5);
            }
            fill(50);
            ellipse(0,0, 5, 5);
        } else if (flowMode === FLOW_MODES.REPEL) {
             for(let a = 0; a < TWO_PI; a += PI/3) {
                line(cos(a) * 5, sin(a) * 5, cos(a) * 9, sin(a) * 9);
            }
             noFill();
             ellipse(0,0, 5, 5);
        } else if (flowMode === FLOW_MODES.WAVE) {
             for(let i = -1; i <= 1; i++) {
                 line(-10, i * 5 + sin(-10 * 0.2)*3, 10, i * 5 + sin(10 * 0.2)*3);
             }
        } else { // Chaos
             for (let i=0; i< 5; i++) {
                 let angle = random(TWO_PI);
                 let dist = random(3, 9);
                 line(0, 0, cos(angle)*dist, sin(angle)*dist);
             }
        }

    });

    // Brush size icon
    drawSkeuomorphicButton(uiElements.brushSizeButton, () => {
        let sizeIndicator = map(brushSize, 24, 400, 8, 20); // Map brushSize to icon size
        fill(50);
        noStroke();
        ellipse(0, 0, sizeIndicator, sizeIndicator);
    });

    // Color cycle icon
    drawSkeuomorphicButton(uiElements.colorButton, () => {
        fill(colors[currentColorIndex].h, colors[currentColorIndex].s, colors[currentColorIndex].b);
        noStroke();
        rect(-10, -10, 20, 20, 3); // Centered square
    });

    // Trail intensity icon
    drawSkeuomorphicButton(uiElements.trailModeButton, () => {
        noStroke();
        fill(50);
        let iconSize = 18;
        let center = 0;
        strokeWeight(2);
        stroke(50);
        noFill();

        if (trailMode === 0) { // Opaque (Mode 0)
            rectMode(CENTER);
            rect(center, center, iconSize * 0.8, iconSize * 0.8, 2);
            rectMode(CORNER); // Reset rectMode
        } else if (trailMode === 1) { // Short trails (Mode 1 - Alpha 0.5)
             arc(center, center, iconSize, iconSize, -HALF_PI, 0);
        } else if (trailMode === 2) { // Medium trails (Mode 2 - Alpha 0.2)
             arc(center, center, iconSize, iconSize, -HALF_PI, HALF_PI);
        } else if (trailMode === 3) { // Long trails (Mode 3 - Alpha 0.05)
             arc(center, center, iconSize, iconSize, -HALF_PI, PI + HALF_PI); // Three quarters
        } else { // Infinite trails (Mode 4 - Alpha 0)
             ellipse(center, center, iconSize, iconSize); // Full circle
        }
    });
}

// Helper function to check if mouse is inside a button's area
function isMouseInButton(btn) {
    return mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h;
}

function mousePressed() {
    // Reset button state at the start of a new press
    buttonPressedState.targetButton = null;

    // Check UI buttons first
    if (isMouseInButton(uiElements.flowModeButton)) {
        buttonPressedState.flowMode = true;
        buttonPressedState.targetButton = uiElements.flowModeButton;
        return; // Stop further processing
    }

    if (isMouseInButton(uiElements.brushSizeButton)) {
        buttonPressedState.brushSize = true;
         buttonPressedState.targetButton = uiElements.brushSizeButton;
        return; // Stop further processing
    }

    if (isMouseInButton(uiElements.colorButton)) {
        buttonPressedState.color = true;
         buttonPressedState.targetButton = uiElements.colorButton;
        return; // Stop further processing
    }

    if (isMouseInButton(uiElements.trailModeButton)) {
        buttonPressedState.trailMode = true;
         buttonPressedState.targetButton = uiElements.trailModeButton;
        return; // Stop further processing
    }

    // If no button was clicked, handle particle creation/interaction
    isHolding = true;
    mouseHoldStartTime = millis();
    
    // Create new cluster with bounds checking
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        let newCluster = new ParticleCluster(mouseX, mouseY);
        clusters.push(newCluster);

        let currentTime = millis();
        if (currentTime - lastClickTime < clickInterval) {
            clickCount = min(clickCount + 1, 5);
            let cohesion = map(clickCount, 0, 5, 1, 5);
            newCluster.cohesion = cohesion;
        } else {
            clickCount = 0;
        }
        lastClickTime = currentTime;
        
        for (let i = 0; i < 8; i++) {
            try {
                let angle = (TWO_PI / 8) * i + random(-0.2, 0.2);
                let radius = random(brushSize * 0.4, brushSize * 0.6);
                let x = constrain(mouseX + cos(angle) * radius, 0, width);
                let y = constrain(mouseY + sin(angle) * radius, 0, height);

                // Add particle only if under the cap
                if (particles.length < maxParticles) {
                    let newParticle = new Particle(x, y);
                    particles.push(newParticle);
                    newCluster.addParticle(newParticle);
                    newParticle.startHold();
                } else {
                    // Optional: could provide feedback that max particles reached
                    break; // Stop adding particles in this click if cap is reached
                }
            } catch (e) {
                console.error('Error creating particle:', e);
            }
        }
    }
}

function mouseReleased() {
    let buttonClicked = false; // Flag to check if a button action was performed

    // Check if a button press was initiated and mouse is still over it
    if (buttonPressedState.flowMode && isMouseInButton(uiElements.flowModeButton)) {
        flowMode = (flowMode + 1) % FLOW_MODE_COUNT;
        flowfield.init(); // Re-init flowfield when mode changes
        buttonClicked = true;
    }
    else if (buttonPressedState.brushSize && isMouseInButton(uiElements.brushSizeButton)) {
        if (brushSize === 24) {
            brushSize = 150;
        } else if (brushSize === 150) {
            brushSize = 400;
        } else {
            brushSize = 24;
        }
        buttonClicked = true;
    }
     else if (buttonPressedState.color && isMouseInButton(uiElements.colorButton)) {
        currentColorIndex = (currentColorIndex + 1) % colors.length;
        // REMOVED: updateParticleColors(); // Don't update existing particles
        buttonClicked = true;
    }
     else if (buttonPressedState.trailMode && isMouseInButton(uiElements.trailModeButton)) {
        trailMode = (trailMode + 1) % 5; // Cycle through 5 modes (0-4)
        if (trailMode === 0) {
             // No need for immediate background clear if alpha is 1
         }
        buttonClicked = true;
    }

    // Reset button press state regardless of outcome
    buttonPressedState.flowMode = false;
    buttonPressedState.brushSize = false;
    buttonPressedState.color = false;
    buttonPressedState.trailMode = false;
    buttonPressedState.targetButton = null;

    // Original mouseReleased logic for particle holds
    // (Only release particles if a button wasn't the primary action of this click)
    if (!buttonClicked) { 
        isHolding = false;
        particles.forEach(particle => {
            if (particle.isHeld) {
                particle.releaseHold();
            }
        });

        if (clusters.length > 0) {
            let currentCluster = clusters[clusters.length - 1];
        }
    } else {
         // If a button was clicked, ensure isHolding is also reset if it was set in mousePressed
         isHolding = false; 
    }
}

function mouseDragged() {
    // Limit drag particle creation rate and check bounds
    if (frameCount % 6 === 0 && 
        mouseX >= 0 && mouseX <= width && 
        mouseY >= 0 && mouseY <= height) {
        
        let maxReached = false; // Flag to signal max particles
        for (let i = 0; i < 8; i++) { // 8 particles per drag event segment
            if (maxReached) break; // Check flag at loop start

            try {
                let angle = (TWO_PI / 8) * i + random(-0.2, 0.2);
                let radius = random(brushSize * 0.4, brushSize * 0.6);
                let x = constrain(mouseX + cos(angle) * radius, 0, width);
                let y = constrain(mouseY + sin(angle) * radius, 0, height);
                
                // Add particle only if under the cap
                if (particles.length < maxParticles) {
                    let newParticle = new Particle(x, y);
                     particles.push(newParticle);
                    
                     // Update new particle's color to match the current color
                     newParticle.hue = colors[currentColorIndex].h;
                     newParticle.saturation = colors[currentColorIndex].s;
                     newParticle.brightness = colors[currentColorIndex].b;
                    
                     if (clusters.length > 0) {
                        clusters[clusters.length - 1].addParticle(newParticle);
                    }
                    newParticle.startHold();
                } else {
                    // Optional: could provide feedback that max particles reached
                    maxReached = true; // Set flag instead of breaking here
                }
            } catch (e) {
                console.error('Error in mouseDragged:', e);
            }
        }
    }
    return false;
}

function keyPressed() {
    if (key === ' ') {  // Spacebar
        // Create a ripple effect through all particles
        particles.forEach((p, index) => {
            setTimeout(() => {
                p.size *= 2;
                setTimeout(() => {
                    p.size = p.baseSize;
                }, 200);
            }, index * 10);
        });
    } else if (key === 'r' || key === 'R') {
        // Randomize all particle velocities
        particles.forEach(p => {
            p.vel = p5.Vector.random2D().mult(random(1, 3));
        });
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    flowfield = new FlowField(); // Recreate flowfield for new dimensions
    flowfield.init();
    initializeUI(); // Re-calculate button positions
    background(95); // Clear background on resize
}

function updateParticleColors() {
    const selectedColor = colors[currentColorIndex];
    particles.forEach(particle => {
        // Set the particle's color properties to the selected palette color
        particle.hue = selectedColor.h;
        particle.saturation = selectedColor.s;
        particle.brightness = selectedColor.b;

        // Optional: Add a slight random variation if desired, but keep base color
        // particle.hue += random(-2, 2);
        // particle.saturation = constrain(selectedColor.s + random(-5, 5), 0, 100);
        // particle.brightness = constrain(selectedColor.b + random(-5, 5), 0, 100);

        // No need to constrain base values as they come from the predefined palette
    });
}
