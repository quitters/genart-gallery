class Crystal {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.size = random(20, 40);
        this.angles = [];
        this.growthRate = random(0.2, 0.5);
        this.maxSize = random(100, 200);
        this.hue = random(180, 240); // Blue to purple range
        this.alpha = random(150, 200);
        this.facets = floor(random(5, 8));
        
        // Generate random angles for crystal facets
        for (let i = 0; i < this.facets; i++) {
            this.angles.push(random(TWO_PI));
        }
    }

    grow() {
        if (this.size < this.maxSize) {
            this.size += this.growthRate;
        }
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y);
        
        // Draw shadow
        noStroke();
        fill(0, 20);
        this.drawCrystal(2, 2, 0.9);
        
        // Draw crystal
        for (let i = 0; i < 3; i++) {
            let shade = map(i, 0, 2, 0.7, 1);
            this.drawFacet(0, 0, shade);
        }
        pop();
    }

    drawCrystal(offsetX, offsetY, shade) {
        beginShape();
        for (let angle of this.angles) {
            let x = cos(angle) * this.size * shade + offsetX;
            let y = sin(angle) * this.size * shade + offsetY;
            vertex(x, y);
        }
        endShape(CLOSE);
    }

    drawFacet(offsetX, offsetY, shade) {
        let sat = map(shade, 0.7, 1, 40, 80);
        let bright = map(shade, 0.7, 1, 80, 100);
        fill(this.hue, sat, bright, this.alpha);
        noStroke();
        this.drawCrystal(offsetX, offsetY, shade);
    }
}

let crystals = [];
const maxCrystals = 100;
const spawnRate = 500; // Milliseconds between spawns
let lastSpawnTime = 0;

// --- UI Placeholder --- 
const uiElements = {};
let buttonPressedState = {
    reset: false,
    targetButton: null
};
// --- End UI Placeholder ---

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    colorMode(HSB, 360, 100, 100, 1);
    initializeUI(); // Call UI setup
    resetSketch(); // Initial setup of crystals etc.
}

// Function to initialize UI element properties (like button positions)
function initializeUI() {
    let buttonSize = 40;
    let margin = 10;
    // Position reset button (example: top-right)
    uiElements.resetButton = { x: width - margin - buttonSize, y: margin, w: buttonSize, h: buttonSize, cornerRadius: 5 };
}

// Function to reset the sketch state
function resetSketch() {
    crystals = [];
    lastSpawnTime = millis(); // Reset spawn timer
    background(220, 30, 15); // Clear background
}

function draw() {
    background(220, 30, 15, 5); // Slight trails effect

    // Add new crystals randomly
    if (crystals.length < maxCrystals && millis() - lastSpawnTime > spawnRate) {
        let x = random(width);
        let y = random(height);
        crystals.push(new Crystal(x, y));
        lastSpawnTime = millis();
    }

    // Update and display crystals
    for (let i = crystals.length - 1; i >= 0; i--) {
        let crystal = crystals[i];
        // Only grow if not yet max size
        if (crystal.size < crystal.maxSize) {
             crystal.grow();
        }
        crystal.display();
    }

    // Remove crystals that have reached max size
    crystals = crystals.filter(crystal => crystal.size < crystal.maxSize);

    drawUI(); // Draw UI elements
}

// --- UI Drawing & Interaction --- 
// Copied from artwork1.js
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
    // Draw Reset Button
    if (uiElements.resetButton) { // Check if initialized
        drawSkeuomorphicButton(uiElements.resetButton, () => {
            // Simple Reset Icon (e.g., a circle arrow)
            stroke(255);
            strokeWeight(2);
            noFill();
            arc(0, -2, 15, 15, HALF_PI, TWO_PI);
            line(2, -9, 7.5, -9); // Arrowhead top
            line(7.5, -9, 7.5, -4); // Arrowhead bottom
        });
    }
}

function isMouseInButton(btn) {
    if (!btn) return false;
    return mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h;
}

function mousePressed() {
     buttonPressedState.targetButton = null;
     if (isMouseInButton(uiElements.resetButton)) {
        buttonPressedState.reset = true;
        buttonPressedState.targetButton = uiElements.resetButton;
        return; // Prevent other actions
     }
}

function mouseReleased() {
    let buttonClicked = false;
    if (buttonPressedState.reset && isMouseInButton(uiElements.resetButton)) {
        resetSketch();
        buttonClicked = true;
    }

    // If no button was clicked, try to spawn a crystal
    if (!buttonClicked && crystals.length < maxCrystals) {
        // Check mouse bounds to ensure it's within canvas
        if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
             crystals.push(new Crystal(mouseX, mouseY));
        }
    }

    // Reset state
    buttonPressedState.reset = false;
    buttonPressedState.targetButton = null;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    initializeUI(); // Recalculate button positions
    // Optional: resetSketch() on resize?
    background(220, 30, 15); // Clear background
}
// --- End UI Drawing & Interaction ---
