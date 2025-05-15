// artwork16.js - Ultra-fast Time Crystals (flat, batch, WEBGL)
// No recursion, no deep trees. All geometry batched and precomputed.

const CRYSTAL_COUNT = 48;
const MIN_VERTICES = 4, MAX_VERTICES = 7;
let crystals = [];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB, 360, 100, 100, 1);
  // Precompute all crystals
  crystals = [];
  let rOuter = min(width, height) * 0.36;
  for (let i = 0; i < CRYSTAL_COUNT; i++) {
    // Distribute in a rosette pattern
    let angle = i * TWO_PI / CRYSTAL_COUNT;
    let radius = rOuter * (0.7 + 0.3 * sin(i * 1.7));
    let cx = cos(angle) * radius;
    let cy = sin(angle) * radius;
    let vertices = floor(random(MIN_VERTICES, MAX_VERTICES + 1));
    let baseHue = (angle * 180 / PI + 360) % 360;
    let timePhase = random(TWO_PI);
    let timeSpeed = random(0.01, 0.025);
    let rotationSpeed = random(-0.008, 0.008);
    let size = random(36, 72);
    let vertexAngles = Array.from({length: vertices}, (_, j) => j * TWO_PI / vertices);
    crystals.push({
      cx, cy, size, vertices, vertexAngles,
      baseHue, timePhase, timeSpeed, rotation: random(TWO_PI), rotationSpeed
    });
  }
  background(0);
}

function draw() {
  background(0, 0.1);
  // Animate and draw all crystals in a single batch
  for (let i = 0; i < crystals.length; i++) {
    let c = crystals[i];
    // Animate
    c.rotation += c.rotationSpeed;
    c.timePhase += c.timeSpeed;
    let hue = (c.baseHue + 60 * sin(c.timePhase)) % 360;
    let scaleOsc = 1 + 0.13 * sin(c.timePhase * 1.4 + i * 0.8);
    push();
    translate(c.cx, c.cy, 0);
    rotate(c.rotation);
    scale(scaleOsc);
    // Draw main polygon
    fill(hue, 80, 65, 0.82);
    stroke((hue + 30) % 360, 80, 40, 0.7);
    strokeWeight(2);
    beginShape();
    for (let j = 0; j < c.vertices; j++) {
      let angle = c.vertexAngles[j];
      let r = c.size * (0.94 + 0.12 * sin(c.timePhase + angle * 2));
      vertex(cos(angle) * r, sin(angle) * r);
    }
    endShape(CLOSE);
    // Draw inner polygon
    noFill();
    stroke((hue + 180) % 360, 60, 80, 0.35);
    strokeWeight(1.1);
    beginShape();
    for (let j = 0; j < c.vertices; j++) {
      let angle = c.vertexAngles[j];
      let r = c.size * 0.55 * (1 + 0.08 * cos(c.timePhase + angle * 3));
      vertex(cos(angle) * r, sin(angle) * r);
    }
    endShape(CLOSE);
    pop();
  }
  // Draw visual indicator for click interaction (no text needed)
  resetMatrix();
  push();
  translate(0, -height/2 + 15, 0);
  noStroke();
  fill(255, 180);
  ellipse(0, 0, 12, 12);
  fill(255, 90);
  ellipse(0, 0, 24 + 5 * sin(frameCount * 0.05), 24 + 5 * sin(frameCount * 0.05));
  pop();
}

function mousePressed() {
  setup(); // Regenerate crystals
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setup();
}
