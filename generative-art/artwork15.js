// artwork15.js - StringArt Face Generator in p5.js WEBGL
// Efficient implementation with flat arrays and batch rendering
// Now with support for multiple peg layouts (circle, rectangle)

// Configuration constants
const ANCHOR_POINTS = 120;  // High resolution for smooth curves
const BATCH_SIZE = 400;    // Maximum lines to draw per batch for performance

// Layout types
const LAYOUTS = {
  CIRCLE: 'circle',
  RECTANGLE: 'rectangle'
};

// Face parameter ranges
const FACE_PARAMS = {
  headSizeRange: [0.6, 0.8],     // As fraction of canvas size
  eyeSpacingRange: [0.28, 0.38], // As fraction of head width
  eyeSizeRange: [0.12, 0.18],    // As fraction of head size
  noseLengthRange: [0.3, 0.45],  // As fraction of face height
  mouthWidthRange: [0.32, 0.48], // As fraction of face width
  mouthCurveRange: [0.05, 0.25]  // Curvature amount (negative for smile, positive for frown)
};

// String art pattern multipliers
// Base iteration counts (will be multiplied by patternDuration)
const PATTERNS = {
  head: { multiplier: 2, iterations: 60, alpha: 0.4 },
  eyes: { multiplier: 2.5, iterations: 36, alpha: 0.5 },
  nose: { multiplier: 1.8, iterations: 24, alpha: 0.6 },
  mouth: { multiplier: 3.2, iterations: 40, alpha: 0.5 },
  hair: { multiplier: 1.3, iterations: 80, alpha: 0.35 }
};

// Current face parameters (will be randomized in setup)
let faceParams = {};

// String point coordinates (pre-computed)
let stringPoints = {
  head: [], 
  eyes: { left: [], right: [] },
  nose: [], 
  mouth: [], 
  hair: []
};

// Layout choices (will be randomized for some features)
let layoutChoices = {
  head: LAYOUTS.CIRCLE,
  eyes: LAYOUTS.CIRCLE,
  nose: LAYOUTS.CIRCLE,
  mouth: LAYOUTS.CIRCLE,
  hair: LAYOUTS.CIRCLE
};

// Animation variables
let animProgress = 0;
let baseHue = 0;
let lastHue = 0;

// Animation control variables
// Speed: How quickly each frame progresses (progress increment per frame)
// Values: 0.005 (slow), 0.015 (medium), 0.03 (fast)
let animSpeed = 0.015;

// Duration: Total number of iterations for string patterns
// Values: low (fewer strings), medium, high (more detailed patterns)
let patternDuration = 1.0; // Multiplier for PATTERNS.iterations

// Creates a layout of pegs based on the specified type and parameters
function createPegLayout(type, params) {
  const pegs = [];
  
  switch(type) {
    case LAYOUTS.CIRCLE:
      // Circular layout
      for (let i = 0; i < params.count; i++) {
        const angle = i * TWO_PI / params.count;
        pegs.push({
          x: params.centerX + cos(angle) * params.radius,
          y: params.centerY + sin(angle) * params.radius,
          angle: angle
        });
      }
      break;
      
    case LAYOUTS.RECTANGLE:
      // Rectangular layout 
      const {width, height, centerX, centerY, count} = params;
      const halfWidth = width/2;
      const halfHeight = height/2;
      
      // Distribute pegs evenly along perimeter
      const totalPerimeter = 2 * (width + height);
      let pegsSoFar = 0;
      
      // Top edge (left to right)
      const topCount = Math.ceil(count * (width / totalPerimeter));
      for (let i = 0; i < topCount; i++) {
        const ratio = i / (topCount - 1);
        const x = centerX - halfWidth + width * ratio;
        const y = centerY - halfHeight;
        pegs.push({x, y, angle: PI * 1.5});
        pegsSoFar++;
      }
      
      // Right edge (top to bottom)
      const rightCount = Math.ceil(count * (height / totalPerimeter));
      for (let i = 1; i < rightCount; i++) { // Start at 1 to avoid duplicating corner
        const ratio = i / (rightCount);
        const x = centerX + halfWidth;
        const y = centerY - halfHeight + height * ratio;
        pegs.push({x, y, angle: 0});
        pegsSoFar++;
      }
      
      // Bottom edge (right to left)
      const bottomCount = Math.ceil(count * (width / totalPerimeter));
      for (let i = 0; i < bottomCount - 1; i++) { // Subtract 1 to avoid duplicating corner
        const ratio = i / (bottomCount - 1);
        const x = centerX + halfWidth - width * ratio;
        const y = centerY + halfHeight;
        pegs.push({x, y, angle: PI * 0.5});
        pegsSoFar++;
      }
      
      // Left edge (bottom to top)
      const leftCount = Math.ceil(count * (height / totalPerimeter));  
      for (let i = 0; i < leftCount - 1; i++) { // Subtract 1 to avoid duplicating corner
        const ratio = i / (leftCount - 1);
        const x = centerX - halfWidth;
        const y = centerY + halfHeight - height * ratio;
        pegs.push({x, y, angle: PI});
        pegsSoFar++;
      }
      break;
      
    default:
      console.error('Unknown layout type:', type);
  }
  
  return pegs;
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB, 360, 100, 100, 1);
  generateNewFace();
  background(0);
}

function generateNewFace() {
  // Random face parameters
  faceParams = {
    headSize: random(FACE_PARAMS.headSizeRange[0], FACE_PARAMS.headSizeRange[1]) * min(width, height),
    eyeSpacing: random(FACE_PARAMS.eyeSpacingRange[0], FACE_PARAMS.eyeSpacingRange[1]),
    eyeSize: random(FACE_PARAMS.eyeSizeRange[0], FACE_PARAMS.eyeSizeRange[1]),
    noseLength: random(FACE_PARAMS.noseLengthRange[0], FACE_PARAMS.noseLengthRange[1]),
    mouthWidth: random(FACE_PARAMS.mouthWidthRange[0], FACE_PARAMS.mouthWidthRange[1]),
    mouthCurve: random(FACE_PARAMS.mouthCurveRange[0], FACE_PARAMS.mouthCurveRange[1]) * 
                (random() > 0.7 ? -1 : 1), // Occasional frown
    stringDensity: floor(random(3, 8)),
    // Rectangle aspect ratio for rectangular layouts
    rectAspect: random(0.7, 1.3) 
  };
  
  // Randomly select layout types for features
  layoutChoices = {
    // 35% chance of rectangular head outline
    head: random() < 0.35 ? LAYOUTS.RECTANGLE : LAYOUTS.CIRCLE,
    eyes: LAYOUTS.CIRCLE, // Keep eyes circular for now
    nose: LAYOUTS.CIRCLE,
    mouth: LAYOUTS.CIRCLE,
    hair: LAYOUTS.CIRCLE
  };
  
  // Pre-compute all string art anchor points
  precomputeStringPoints();
  
  // Reset animation
  animProgress = 0;
  baseHue = random(360);
}

function precomputeStringPoints() {
  const centerX = 0;
  const centerY = 0;
  const headRadius = faceParams.headSize / 2;
  
  // Compute head outline points based on selected layout
  if (layoutChoices.head === LAYOUTS.CIRCLE) {
    // Use circular layout for head
    stringPoints.head = createPegLayout(LAYOUTS.CIRCLE, {
      centerX, 
      centerY, 
      radius: headRadius, 
      count: ANCHOR_POINTS
    });
  } else {
    // Use rectangular layout for head
    const headWidth = faceParams.headSize * faceParams.rectAspect;
    const headHeight = faceParams.headSize;
    
    stringPoints.head = createPegLayout(LAYOUTS.RECTANGLE, {
      centerX,
      centerY,
      width: headWidth,
      height: headHeight,
      count: ANCHOR_POINTS
    });
  }
  
  // Eyes always use circular layout for now
  const eyeRadius = faceParams.headSize * faceParams.eyeSize / 2;
  const eyeY = -faceParams.headSize * 0.1; // Slightly above center
  const eyeX = faceParams.headSize * faceParams.eyeSpacing;
  
  // Left eye
  stringPoints.eyes.left = createPegLayout(LAYOUTS.CIRCLE, {
    centerX: -eyeX,
    centerY: eyeY,
    radius: eyeRadius,
    count: Math.floor(ANCHOR_POINTS/2)
  });
  
  // Right eye
  stringPoints.eyes.right = createPegLayout(LAYOUTS.CIRCLE, {
    centerX: eyeX,
    centerY: eyeY,
    radius: eyeRadius,
    count: Math.floor(ANCHOR_POINTS/2)
  });
  
  // Nose (subset of points for vertical string pattern)
  const noseTop = eyeY + eyeRadius * 1.2;
  const noseBottom = noseTop + faceParams.noseLength * faceParams.headSize;
  
  // Create custom pegs for nose (top and bottom rows)
  const nosePoints = [];
  const noseWidth = faceParams.headSize * 0.25;
  
  // Top of nose (narrower)
  for (let i = 0; i < Math.floor(ANCHOR_POINTS/8); i++) {
    const ratio = i / Math.floor(ANCHOR_POINTS/8 - 1);
    nosePoints.push({
      x: -noseWidth * 0.4 + ratio * noseWidth * 0.8,
      y: noseTop,
      angle: PI * 1.5
    });
  }
  
  // Bottom of nose (wider - nostrils)
  for (let i = 0; i < Math.floor(ANCHOR_POINTS/8); i++) {
    const ratio = i / Math.floor(ANCHOR_POINTS/8 - 1);
    nosePoints.push({
      x: -noseWidth * 0.8 + ratio * noseWidth * 1.6,
      y: noseBottom,
      angle: PI * 0.5
    });
  }
  
  stringPoints.nose = nosePoints;
  
  // Mouth - can be rectangular or curved
  const mouthY = faceParams.headSize * 0.3;
  const mouthWidth = faceParams.headSize * faceParams.mouthWidth;
  const mouthHeight = faceParams.headSize * 0.12;
  
  if (layoutChoices.mouth === LAYOUTS.RECTANGLE) {
    // Rectangular mouth
    stringPoints.mouth = createPegLayout(LAYOUTS.RECTANGLE, {
      centerX: 0,
      centerY: mouthY,
      width: mouthWidth,
      height: mouthHeight,
      count: Math.floor(ANCHOR_POINTS/2)
    });
  } else {
    // Curved mouth (arc-based)
    const mouthPoints = [];
    const mouthCurve = faceParams.mouthCurve;
    
    for (let i = 0; i < ANCHOR_POINTS/2; i++) {
      // Arc from mouth left to right
      const ratio = i / (ANCHOR_POINTS/2 - 1);
      const angle = PI + ratio * PI;
      const x = cos(angle) * mouthWidth/2;
      const y = mouthY + sin(angle) * mouthHeight * mouthCurve;
      
      mouthPoints.push({
        x: x,
        y: y,
        angle: angle + PI/2
      });
    }
    
    stringPoints.mouth = mouthPoints;
  }
  
  // Hair - random variations at top of head
  if (layoutChoices.hair === LAYOUTS.CIRCLE) {
    // Create circular hair with variations
    const hairPoints = [];
    for (let i = 0; i < ANCHOR_POINTS * 0.7; i++) {
      // Concentrate on upper half with randomness
      const angle = PI + i * PI / (ANCHOR_POINTS * 0.35);
      const radiusVar = headRadius * (1 + random(-0.15, 0.15));
      
      hairPoints.push({
        x: cos(angle) * radiusVar,
        y: sin(angle) * radiusVar,
        angle: angle
      });
    }
    stringPoints.hair = hairPoints;
  } else {
    // Create spiky hair using small rectangles
    const hairPoints = [];
    const hairHeight = headRadius * 0.4;
    
    for (let i = 0; i < 7; i++) { // 7 spikes across top
      const offset = (i - 3) * headRadius * 0.3;
      const spikeHeight = hairHeight * (1 + random(-0.3, 0.3));
      
      // Small rectangle for each spike
      const spikePoints = createPegLayout(LAYOUTS.RECTANGLE, {
        centerX: offset,
        centerY: -headRadius - spikeHeight/2,
        width: headRadius * 0.15,
        height: spikeHeight,
        count: 8
      });
      
      hairPoints.push(...spikePoints);
    }
    
    stringPoints.hair = hairPoints;
  }
}

function drawStringPattern(points, multiplier, iterations, hueOffset, alpha) {
  // Batch rendering for performance
  beginShape(LINES);
  
  // Apply duration multiplier to iterations and animation progress
  const totalIterations = floor(iterations * patternDuration);
  const actualIterations = floor(totalIterations * animProgress);
  
  for (let i = 0; i < actualIterations; i++) {
    const idx1 = i % points.length;
    const idx2 = floor(i * multiplier) % points.length;
    
    const p1 = points[idx1];
    const p2 = points[idx2];
    
    // Color based on angle and base hue
    const hue = (baseHue + hueOffset + i * 3) % 360;
    stroke(hue, 80, 90, alpha);
    
    vertex(p1.x, p1.y);
    vertex(p2.x, p2.y);
  }
  
  endShape();
}

function drawHead() {
  push();
  strokeWeight(1.0);
  noFill();
  const pattern = PATTERNS.head;
  drawStringPattern(
    stringPoints.head, 
    pattern.multiplier, 
    pattern.iterations,
    0, pattern.alpha
  );
  pop();
}

function drawEyes() {
  push();
  strokeWeight(0.8);
  noFill();
  
  // Left eye
  const leftPattern = PATTERNS.eyes;
  drawStringPattern(
    stringPoints.eyes.left, 
    leftPattern.multiplier, 
    leftPattern.iterations,
    60, leftPattern.alpha
  );
  
  // Right eye
  const rightPattern = PATTERNS.eyes;
  drawStringPattern(
    stringPoints.eyes.right, 
    rightPattern.multiplier, 
    rightPattern.iterations,
    60, rightPattern.alpha
  );
  
  pop();
}

function drawNose() {
  push();
  strokeWeight(0.6);
  noFill();
  
  const pattern = PATTERNS.nose;
  drawStringPattern(
    stringPoints.nose, 
    pattern.multiplier, 
    pattern.iterations,
    120, pattern.alpha
  );
  
  pop();
}

function drawMouth() {
  push();
  strokeWeight(0.7);
  noFill();
  
  const pattern = PATTERNS.mouth;
  drawStringPattern(
    stringPoints.mouth, 
    pattern.multiplier, 
    pattern.iterations,
    180, pattern.alpha
  );
  
  pop();
}

function drawHair() {
  push();
  strokeWeight(0.5);
  noFill();
  
  const pattern = PATTERNS.hair;
  drawStringPattern(
    stringPoints.hair, 
    pattern.multiplier, 
    pattern.iterations,
    240, pattern.alpha
  );
  
  pop();
}

function drawInteractionHint() {
  // Draw minimal visual indicators instead of text
  push();
  resetMatrix();
  translate(0, -height/2 + 15, 0);
  noStroke();
  fill(255, 120);
  ellipse(0, 0, 12, 12);
  fill(255, 60);
  ellipse(0, 0, 24 + 5 * sin(frameCount * 0.05), 24 + 5 * sin(frameCount * 0.05));
  pop();
}

function draw() {
  background(0, 0.15); // Trail effect for smoother animation
  
  // Animate progression (using animSpeed for variable duration)
  animProgress = min(animProgress + animSpeed, 1);
  baseHue = (baseHue + 0.2) % 360;
  
  // Draw all facial features using string art
  drawHead();
  drawEyes();
  drawNose();
  drawMouth();
  drawHair();
  
  // Draw hover indicator for interactivity
  drawInteractionHint();
}

function mousePressed() {
  // Generate new face on click
  generateNewFace();
}

function keyPressed() {
  // Interaction for adjusting specific features
  if (key === 'e' || key === 'E') {
    // Regenerate just eyes
    const eyeSize = random(FACE_PARAMS.eyeSizeRange[0], FACE_PARAMS.eyeSizeRange[1]);
    const eyeSpacing = random(FACE_PARAMS.eyeSpacingRange[0], FACE_PARAMS.eyeSpacingRange[1]);
    faceParams.eyeSize = eyeSize;
    faceParams.eyeSpacing = eyeSpacing;
    precomputeStringPoints();
    animProgress = 0; // Reset animation
  } else if (key === 'm' || key === 'M') {
    // Regenerate just mouth
    faceParams.mouthWidth = random(FACE_PARAMS.mouthWidthRange[0], FACE_PARAMS.mouthWidthRange[1]);
    faceParams.mouthCurve = random(FACE_PARAMS.mouthCurveRange[0], FACE_PARAMS.mouthCurveRange[1]) * 
                          (random() > 0.7 ? -1 : 1);
    // Toggle mouth layout between rectangle and circle
    layoutChoices.mouth = (layoutChoices.mouth === LAYOUTS.CIRCLE) ? 
                          LAYOUTS.RECTANGLE : LAYOUTS.CIRCLE;
    precomputeStringPoints();
    animProgress = 0; // Reset animation
  } else if (key === 'h' || key === 'H') {
    // Toggle hair layout and regenerate
    layoutChoices.hair = (layoutChoices.hair === LAYOUTS.CIRCLE) ? 
                         LAYOUTS.RECTANGLE : LAYOUTS.CIRCLE;
    precomputeStringPoints();
    animProgress = 0; // Reset animation
  } else if (key === 'c' || key === 'C') {
    // Change color palette
    baseHue = random(360);
  } else if (key === 'l' || key === 'L') {
    // Toggle head layout between rectangle and circle
    layoutChoices.head = (layoutChoices.head === LAYOUTS.CIRCLE) ? 
                         LAYOUTS.RECTANGLE : LAYOUTS.CIRCLE;
    // Also randomize the aspect ratio for rectangle
    if (layoutChoices.head === LAYOUTS.RECTANGLE) {
      faceParams.rectAspect = random(0.7, 1.3);
    }
    precomputeStringPoints();
    animProgress = 0; // Reset animation
  } else if (key === 'd' || key === 'D') {
    // Cycle through pattern durations (total iterations/detail level)
    if (patternDuration === 0.6) {
      patternDuration = 1.0; // Medium duration
      console.log('Pattern Detail: Medium');
    } else if (patternDuration === 1.0) {
      patternDuration = 1.5; // Long duration (more strings)
      console.log('Pattern Detail: High');
    } else {
      patternDuration = 0.6; // Short duration (fewer strings)
      console.log('Pattern Detail: Low');
    }
    // Reset animation with new duration
    animProgress = 0;
  } else if (key === 's' || key === 'S') {
    // Cycle through animation speeds: slow -> medium -> fast -> slow
    if (animSpeed === 0.005) {
      animSpeed = 0.015; // Medium speed
      console.log('Animation Speed: Medium');
    } else if (animSpeed === 0.015) {
      animSpeed = 0.03; // Fast speed
      console.log('Animation Speed: Fast');
    } else {
      animSpeed = 0.005; // Slow speed
      console.log('Animation Speed: Slow');
    }
    // Reset animation with new speed
    animProgress = 0;
  } else if (key === ' ') {
    // Spacebar generates completely new face
    generateNewFace();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateNewFace();
}
