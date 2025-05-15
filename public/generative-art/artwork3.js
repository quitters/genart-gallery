// Global variables for waves
let waves = [];
let numWaves = 10; // Default number of waves
const minWaves = 1;
const maxWaves = 30;
let hueOffset = 0;
let globalSpeedMultiplier = 1.0;
const minSpeed = 0.1;
const maxSpeed = 3.0;
let trailMode = 3; // Default to long trails (index for trailAlphaValues)
const trailAlphaValues = [1.0, 0.5, 0.2, 0.08, 0.03, 0.0]; // Added 0.0 for infinite trails
let amplitudeMultiplier = 1.0; // Default amplitude
let minAmplitude = 0.2, maxAmplitude = 3.0;
let lineThickness = 2; // Default line thickness
let minThickness = 1, maxThickness = 10;

// UI Elements and State
const uiElements = {};
let buttonPressedState = {
    reset: false,
    wavesMore: false,
    wavesLess: false,
    speedMore: false,
    speedLess: false,
    trailMode: false,
    ampMore: false,
    ampLess: false,
    strokeMore: false,
    strokeLess: false,
    targetButton: null
};

class Wave {
    constructor(baseY, amplitude, frequency, baseSpeed, color) {
        this.baseY = baseY;
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.baseSpeed = baseSpeed; // Store the original speed
        this.color = color;
        this.phase = random(TWO_PI);
        this.points = [];
    }

    update() {
        this.points = [];
        // Use globalSpeedMultiplier to adjust speed
        this.phase += this.baseSpeed * globalSpeedMultiplier;

        if (width <= 0) return; // Prevent errors if canvas width is not set

        for (let x = 0; x <= width; x += 10) { // Increased step for performance
            let angle = this.phase + (x * this.frequency / width) * TWO_PI;
            let y = this.baseY + sin(angle) * this.amplitude;
            this.points.push(createVector(x, y));
        }
    }

    display() {
        if (this.points.length < 2) return; // Need at least 2 points to draw a line/shape

        stroke(this.color);
        noFill();
        strokeWeight(lineThickness);
        beginShape();
        for (let i = 0; i < this.points.length; i++) {
            vertex(this.points[i].x, this.points[i].y);
        }
        endShape();
    }
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    colorMode(HSB, 360, 100, 100, 1); // Alpha from 0 to 1
    
    initializeUI();
    resetSketch();
}

function resetSketch() {
    waves = [];
    background(0, 0, 0); // Black background
    hueOffset = 0;

    if (numWaves <= 0) return;

    for (let i = 0; i < numWaves; i++) {
        let baseY = map(i, 0, numWaves -1 , height * 0.25, height * 0.75);
        let amplitude = random(height * 0.02, height * 0.1) * amplitudeMultiplier;
        let frequency = random(0.3, 1.5);
        let baseSpeed = random(0.005, 0.02);
        // Hue will be set dynamically in draw based on hueOffset
        // Placeholder color, will be updated each frame or on creation for variations
        let initialHue = ( (i * 360 / numWaves) + hueOffset ) % 360;
        let waveColor = color(initialHue, 80, 90, 0.7);
        waves.push(new Wave(baseY, amplitude, frequency, baseSpeed, waveColor));
    }
}

let forceFullClear = false;

function draw() {
    let bgAlpha = trailAlphaValues[trailMode];
    // Overlay full background if reset was pressed
    if (forceFullClear) {
        background(0, 0, 0, 1);
        forceFullClear = false;
    } else if (bgAlpha > 0) {
        background(0, 0, 0, bgAlpha);
    }
    // If bgAlpha === 0, do not clear at all (infinite trails)
    hueOffset += 0.5; // Slowly shift all hues

    for (let i = 0; i < waves.length; i++) {
        let wave = waves[i];
        // Update wave color dynamically
        let currentHue = ( (i * 360 / numWaves) + hueOffset ) % 360;
        wave.color = color(currentHue, 80, 95, 0.75);

        wave.update();
        push();
        wave.display();
        pop();
    }
    drawUI();
}

function initializeUI() {
    let btnSize = 44;
    let margin = 12;
    let topY = margin;
    let currentX = width - margin - btnSize;
    // Reset button always top-right
    uiElements.resetButton = { x: currentX, y: topY, w: btnSize, h: btnSize, r: 7 };
    currentX -= (btnSize + margin);
    uiElements.trailModeButton = { x: currentX, y: topY, w: btnSize, h: btnSize, r: 7 };
    currentX -= (btnSize + margin + 6);
    uiElements.wavesMoreButton = { x: currentX, y: topY, w: btnSize, h: btnSize, r: 7 };
    currentX -= (btnSize + margin);
    uiElements.wavesLessButton = { x: currentX, y: topY, w: btnSize, h: btnSize, r: 7 };
    currentX -= (btnSize + margin + 6);
    uiElements.ampMoreButton = { x: currentX, y: topY, w: btnSize, h: btnSize, r: 7 };
    currentX -= (btnSize + margin);
    uiElements.ampLessButton = { x: currentX, y: topY, w: btnSize, h: btnSize, r: 7 };
    currentX -= (btnSize + margin + 6);
    uiElements.strokeMoreButton = { x: currentX, y: topY, w: btnSize, h: btnSize, r: 7 };
    currentX -= (btnSize + margin);
    uiElements.strokeLessButton = { x: currentX, y: topY, w: btnSize, h: btnSize, r: 7 };
    currentX -= (btnSize + margin);
    uiElements.speedMoreButton = { x: currentX, y: topY, w: btnSize, h: btnSize, r: 7 };
    currentX -= (btnSize + margin);
    uiElements.speedLessButton = { x: currentX, y: topY, w: btnSize, h: btnSize, r: 7 };
}

function drawSkeuomorphicButton(btn, iconDrawFunc) {
    // Outer shadow
    noStroke();
    fill(210, 40, 70, 0.18); // Subtle blue shadow
    rect(btn.x + 2, btn.y + 3, btn.w, btn.h, btn.r + 2);
    // Base
    fill(230);
    rect(btn.x, btn.y, btn.w, btn.h, btn.r);
    // Inner shadow
    fill(200, 0.45);
    rect(btn.x, btn.y, btn.w, btn.h, btn.r);
    // Main surface
    fill(247);
    rect(btn.x + 1.5, btn.y + 1.5, btn.w - 3, btn.h - 3, btn.r - 2 > 0 ? btn.r - 2 : 0);
    // Highlight
    fill(255, 0.7);
    rect(btn.x + 2, btn.y + 2, btn.w - 4, btn.h - 4, btn.r - 3 > 0 ? btn.r - 3 : 0);
    // Bevel
    fill(200);
    rect(btn.x + btn.r / 2, btn.y + btn.h - 4, btn.w - btn.r, 3, btn.r / 3 > 0 ? btn.r / 3 : 0);
    rect(btn.x + btn.w - 4, btn.y + btn.r / 2, 3, btn.h - btn.r, btn.r / 3 > 0 ? btn.r / 3 : 0);
    ellipse(btn.x + btn.w - btn.r / 2, btn.y + btn.h - btn.r / 2, btn.r, btn.r);
    // Icon
    push();
    translate(btn.x + btn.w / 2, btn.y + btn.h / 2);
    iconDrawFunc();
    pop();
}

function drawUI() {
    textAlign(CENTER, CENTER);
    textSize(20);
    strokeWeight(2);
    stroke(50); // Default stroke for icons
    fill(50);   // Default fill for text icons

    // Improved Reset Button Icon (circular arrow with thicker base and arrowhead)
    drawSkeuomorphicButton(uiElements.resetButton, () => {
        noFill();
        stroke(70);
        strokeWeight(3.2);
        arc(0, 0, 18, 18, PI * 0.25, PI * 2.05);
        stroke(50);
        strokeWeight(2.2);
        arc(0, 0, 16, 16, PI * 0.25, PI * 1.95);
        push();
        let arrowAngle = PI * 1.95;
        translate(cos(arrowAngle) * 8, sin(arrowAngle) * 8);
        rotate(arrowAngle + HALF_PI * 0.95);
        fill(70);
        noStroke();
        triangle(0, -4, -3, 2, 3, 2);
        pop();
    });
    drawSkeuomorphicButton(uiElements.wavesMoreButton, () => { fill(30); noStroke(); text('W+', 0, 0); });
    drawSkeuomorphicButton(uiElements.wavesLessButton, () => { fill(30); noStroke(); text('W-', 0, 0); });
    drawSkeuomorphicButton(uiElements.ampMoreButton, () => { fill(30); noStroke(); text('I+', 0, 0); });
    drawSkeuomorphicButton(uiElements.ampLessButton, () => { fill(30); noStroke(); text('I-', 0, 0); });
    drawSkeuomorphicButton(uiElements.strokeMoreButton, () => { fill(30); noStroke(); text('T+', 0, 0); });
    drawSkeuomorphicButton(uiElements.strokeLessButton, () => { fill(30); noStroke(); text('T-', 0, 0); });
    drawSkeuomorphicButton(uiElements.speedMoreButton, () => { fill(30); noStroke(); text('S+', 0, 0); });
    drawSkeuomorphicButton(uiElements.speedLessButton, () => { fill(30); noStroke(); text('S-', 0, 0); });

    // Trail Mode Button Icon (6 modes)
    drawSkeuomorphicButton(uiElements.trailModeButton, () => {
        stroke(50);
        strokeWeight(2.1);
        let iconSize = 18;
        let center = 0;
        if (trailMode === 0) { // Opaque (Mode 0 - Filled Square)
            fill(50);
            rectMode(CENTER);
            rect(center, center, iconSize * 0.7, iconSize * 0.7, 2.5);
            rectMode(CORNER); 
        } else if (trailMode === 1) { // Short trails (Mode 1 - Quarter Arc)
            noFill();
            arc(center, center, iconSize, iconSize, -HALF_PI, 0);
        } else if (trailMode === 2) { // Medium trails (Mode 2 - Half Arc)
            noFill();
            arc(center, center, iconSize, iconSize, -HALF_PI, HALF_PI);
        } else if (trailMode === 3) { // Long trails (Mode 3 - Three-Quarter Arc)
            noFill();
            arc(center, center, iconSize, iconSize, -HALF_PI, PI + HALF_PI);
        } else if (trailMode === 4) { // Very Long (Mode 4 - Full Circle Outline)
            noFill();
            ellipse(center, center, iconSize, iconSize);
        } else { // Infinite trails (Mode 5 - Open Circle, light stroke)
            noFill();
            stroke(120, 60); // Lighter gray
            ellipse(center, center, iconSize, iconSize);
            stroke(50);
        }
    });
}

function isMouseInButton(btn) {
    if (!btn) return false;
    return mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h;
}

function mousePressed() {
    buttonPressedState.targetButton = null;
    if (isMouseInButton(uiElements.resetButton)) { buttonPressedState.reset = true; buttonPressedState.targetButton = uiElements.resetButton; return; }
    if (isMouseInButton(uiElements.trailModeButton)) { buttonPressedState.trailMode = true; buttonPressedState.targetButton = uiElements.trailModeButton; return; }
    if (isMouseInButton(uiElements.wavesMoreButton)) { buttonPressedState.wavesMore = true; buttonPressedState.targetButton = uiElements.wavesMoreButton; return; }
    if (isMouseInButton(uiElements.wavesLessButton)) { buttonPressedState.wavesLess = true; buttonPressedState.targetButton = uiElements.wavesLessButton; return; }
    if (isMouseInButton(uiElements.ampMoreButton)) { buttonPressedState.ampMore = true; buttonPressedState.targetButton = uiElements.ampMoreButton; return; }
    if (isMouseInButton(uiElements.ampLessButton)) { buttonPressedState.ampLess = true; buttonPressedState.targetButton = uiElements.ampLessButton; return; }
    if (isMouseInButton(uiElements.strokeMoreButton)) { buttonPressedState.strokeMore = true; buttonPressedState.targetButton = uiElements.strokeMoreButton; return; }
    if (isMouseInButton(uiElements.strokeLessButton)) { buttonPressedState.strokeLess = true; buttonPressedState.targetButton = uiElements.strokeLessButton; return; }
    if (isMouseInButton(uiElements.speedMoreButton)) { buttonPressedState.speedMore = true; buttonPressedState.targetButton = uiElements.speedMoreButton; return; }
    if (isMouseInButton(uiElements.speedLessButton)) { buttonPressedState.speedLess = true; buttonPressedState.targetButton = uiElements.speedLessButton; return; }
}

function mouseReleased() {
    let actionTaken = false;
    if (buttonPressedState.reset && isMouseInButton(uiElements.resetButton)) {
        forceFullClear = true; // Overlay full background next frame
        resetSketch();
        actionTaken = true;
    }
    if (buttonPressedState.trailMode && isMouseInButton(uiElements.trailModeButton)) { trailMode = (trailMode + 1) % trailAlphaValues.length; actionTaken = true; }
    if (buttonPressedState.wavesMore && isMouseInButton(uiElements.wavesMoreButton)) { numWaves = min(maxWaves, numWaves + 1); resetSketch(); actionTaken = true; }
    if (buttonPressedState.wavesLess && isMouseInButton(uiElements.wavesLessButton)) { numWaves = max(minWaves, numWaves - 1); resetSketch(); actionTaken = true; }
    if (buttonPressedState.ampMore && isMouseInButton(uiElements.ampMoreButton)) { 
        amplitudeMultiplier = min(maxAmplitude, amplitudeMultiplier + 0.1);
        // Update all waves' amplitude in real time
        for (let wave of waves) {
            wave.amplitude *= (amplitudeMultiplier / (amplitudeMultiplier - 0.1));
        }
        actionTaken = true;
    }
    if (buttonPressedState.ampLess && isMouseInButton(uiElements.ampLessButton)) { 
        amplitudeMultiplier = max(minAmplitude, amplitudeMultiplier - 0.1);
        // Update all waves' amplitude in real time
        for (let wave of waves) {
            wave.amplitude *= (amplitudeMultiplier / (amplitudeMultiplier + 0.1));
        }
        actionTaken = true;
    }
    if (buttonPressedState.strokeMore && isMouseInButton(uiElements.strokeMoreButton)) { lineThickness = min(maxThickness, lineThickness + 1); actionTaken = true; }
    if (buttonPressedState.strokeLess && isMouseInButton(uiElements.strokeLessButton)) { lineThickness = max(minThickness, lineThickness - 1); actionTaken = true; }
    if (buttonPressedState.speedMore && isMouseInButton(uiElements.speedMoreButton)) { globalSpeedMultiplier = min(maxSpeed, globalSpeedMultiplier + 0.1); actionTaken = true; }
    if (buttonPressedState.speedLess && isMouseInButton(uiElements.speedLessButton)) { globalSpeedMultiplier = max(minSpeed, globalSpeedMultiplier - 0.1); actionTaken = true; }
    if (buttonPressedState.intensityMore && isMouseInButton(uiElements.intensityMoreButton)) { // Add action for intensity more }
    if (buttonPressedState.intensityLess && isMouseInButton(uiElements.intensityLessButton)) { // Add action for intensity less }

    // Reset all button press states
    for (let key in buttonPressedState) {
        if (typeof buttonPressedState[key] === 'boolean') {
            buttonPressedState[key] = false;
        }
    }
    buttonPressedState.targetButton = null;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    initializeUI(); // Recalculate button positions based on new width/height
    resetSketch();  // Recreate waves for new dimensions
}}}