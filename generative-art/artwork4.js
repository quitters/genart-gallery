class Branch {
    constructor(start, dir, len, generation = 0) {
        this.start = start;
        this.dir = dir;
        this.len = len;
        this.end = p5.Vector.add(start, p5.Vector.mult(dir, len));
        this.hue = random(90, 140) + generation * 3 + random(-8, 8);
        this.sat = random(40, 80) + generation * 2;
        this.alpha = random(180, 220);
        this.thickness = map(len, 2, 120, 1.2, 13) * (1 - generation * 0.07);
        this.growing = true;
        this.currentLen = 0;
        this.growthSpeed = random(1.2, 3.2) * pow(0.96, generation);
        this.watercolorBlobs = [];
        this.generation = generation;
        this.hasLeaves = false;
        this.curveSeed = random(1000); // For per-branch curve
    }

    // Calculate a curved path for this branch, using Perlin noise and wind
    getCurvePoints(lenOverride = null) {
        let pts = [];
        let segs = 12;
        let l = lenOverride !== null ? lenOverride : this.currentLen;
        let base = this.start.copy();
        let dir = this.dir.copy();
        let groundY = height * 0.93;
        for (let i = 0; i <= segs; i++) {
            let t = i / segs;
            let pt = p5.Vector.add(base, p5.Vector.mult(dir, l * t));
            // Perlin noise-based bend
            let n = noise(this.curveSeed + t * 2, this.generation * 0.2);
            let bendAngle = map(n, 0, 1, -PI/7, PI/7) * (1-t) * 0.8;
            let wind = sin(frameCount * 0.01 + this.curveSeed + t * 2) * (0.2 + 0.1 * this.generation);
            let angle = dir.heading() + bendAngle + wind;
            pt.x += sin(angle) * 10 * t * (1-t) * (1 + 0.5*this.generation);
            pt.y += cos(angle) * 5 * t * (1-t) * (1 + 0.5*this.generation);
            // Prevent below ground
            pt.y = min(pt.y, groundY);
            pts.push(pt.copy());
        }
        return pts;
    }

    grow() {
        if (this.growing) {
            this.currentLen = min(this.currentLen + this.growthSpeed, this.len);
            if (this.currentLen >= this.len) {
                this.growing = false;
                this.addWatercolorEffect();
            }
        }
    }

    addWatercolorEffect() {
        let numBlobs = floor(random(3, 6)) + this.generation;
        for (let i = 0; i < numBlobs; i++) {
            let t = random(0.3, 0.8);
            let pts = this.getCurvePoints();
            let idx = floor(t * (pts.length-1));
            let pos = pts[idx];
            this.watercolorBlobs.push({
                pos: pos,
                size: random(12, 38) * pow(0.92, this.generation),
                alpha: random(30, 60) + this.generation * 4,
                offset: random(TWO_PI),
                noiseScale: random(0.015, 0.04)
            });
        }
        if (!this.hasLeaves && this.generation > 2 && this.len < 30) {
            this.hasLeaves = true;
            this.leafCluster = this.createLeafCluster();
        }
    }

    createLeafCluster() {
        let leaves = [];
        let n = floor(random(5, 13));
        let pts = this.getCurvePoints();
        let tip = pts[pts.length-1];
        for (let i = 0; i < n; i++) {
            let angle = random(TWO_PI);
            let r = random(13, 32) * pow(0.96, this.generation);
            let col = color(
                this.hue + random(-18, 18),
                min(100, this.sat + random(10, 30)),
                random(65, 100),
                random(110, 210)
            );
            leaves.push({
                x: tip.x + cos(angle) * r * 0.5,
                y: tip.y + sin(angle) * r * 0.5,
                r: r,
                col: col,
                rot: angle + random(-0.5, 0.5)
            });
        }
        return leaves;
    }

    drawLeaves(gfx) {
        if (this.hasLeaves && this.leafCluster) {
            for (let leaf of this.leafCluster) {
                gfx.push();
                gfx.translate(leaf.x, leaf.y);
                gfx.rotate(leaf.rot);
                gfx.noStroke();
                gfx.fill(leaf.col);
                gfx.ellipse(0, 0, leaf.r * 0.9, leaf.r * random(0.5, 0.8));
                gfx.pop();
            }
        }
    }

    drawToBuffer(gfx) {
        // Draw watercolor blobs
        for (let blob of this.watercolorBlobs) {
            gfx.push();
            gfx.translate(blob.pos.x, blob.pos.y);
            gfx.noStroke();
            let c1 = color(this.hue + random(-10, 10), this.sat + random(-10, 10), 90, blob.alpha);
            let c2 = color(this.hue + random(-12, 12), this.sat + random(-10, 10), random(60, 100), blob.alpha * 0.6);
            gfx.beginShape();
            for (let a = 0; a < TWO_PI; a += 0.15) {
                let xoff = cos(a + blob.offset) * blob.noiseScale;
                let yoff = sin(a + blob.offset) * blob.noiseScale;
                let r = blob.size + noise(xoff, yoff, frameCount * 0.01) * 10;
                let x = cos(a) * r;
                let y = sin(a) * r;
                gfx.stroke(lerpColor(c1, c2, map(a, 0, TWO_PI, 0, 1)), 30);
                gfx.strokeWeight(1.1);
                gfx.fill(lerpColor(c1, c2, map(a, 0, TWO_PI, 0, 1)));
                gfx.curveVertex(x, y);
            }
            gfx.endShape(CLOSE);
            gfx.pop();
        }
        // Draw curved branch with tapering
        let pts = this.getCurvePoints(this.len);
        for (let i = 1; i < pts.length; i++) {
            let t = i / (pts.length-1);
            let thick = lerp(this.thickness, max(1, this.thickness*0.3), t);
            let col = lerpColor(
                color(this.hue, this.sat, 30, this.alpha),
                color(this.hue-18, this.sat-10, 20, this.alpha*0.7),
                t
            );
            gfx.stroke(col);
            gfx.strokeWeight(thick);
            gfx.line(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y);
        }
        // Draw leaves if present
        this.drawLeaves(gfx);
    }

    display() {
        if (this.currentLen > 0) {
            // Draw growing part as a curve
            let pts = this.getCurvePoints();
            for (let i = 1; i < pts.length; i++) {
                let t = i / (pts.length-1);
                let thick = lerp(this.thickness, max(1, this.thickness*0.3), t);
                let col = lerpColor(
                    color(this.hue, this.sat, 30, this.alpha),
                    color(this.hue-18, this.sat-10, 20, this.alpha*0.7),
                    t
                );
                stroke(col);
                strokeWeight(thick);
                line(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y);
            }
        }
    }
    // (Stub) root system, seasonal controls for future
}

class BotanicalSystem {
    constructor() {
        this.branches = [];
        this.growingQueue = [];
        this.rules = {
            'F': ['FF', 'F[+F]F', 'F[-F]F', 'F[+F][-F]F']
        };
        this.angle = PI / 6;
        this.initLength = random(220, 320); // Much longer initial branch
        this.lengthReduction = 0.78; // Less aggressive reduction for longer branches
        this.BATCH_SIZE = 10; // Only grow this many branches per frame
        this.init();
    }

    init() {
        this.addInitialBranch();
    }

    addInitialBranch() {
        // Start trunk lower
        let groundY = height * 0.93;
        let start = createVector(width/2, groundY);
        let dir = createVector(0, -1);
        this.addBranch(start, dir, this.initLength, 0);
    }

    addBranch(start, dir, len, generation = 0) {
        // Only create the branch itself now; children will be generated lazily
        let branch = new Branch(start, dir, len, generation);
        this.branches.push(branch);
        this.growingQueue.push(branch);
        branch._canGrowChildren = (len > 4 && generation < 14);
    }

    update() {
        // Only grow a batch of branches per frame
        let grownThisFrame = 0;
        for (let i = 0; i < this.growingQueue.length && grownThisFrame < this.BATCH_SIZE; ) {
            let branch = this.growingQueue[i];
            if (branch.growing) {
                branch.grow();
                grownThisFrame++;
                // When finished growing, draw to buffer and spawn children lazily
                if (!branch.growing && !branch._drawnToBuffer) {
                    branch.drawToBuffer(staticBuffer);
                    branch._drawnToBuffer = true;
                    // Lazy/deferred child branch generation
                    if (branch._canGrowChildren) {
                        let start = branch.end;
                        let dir = branch.dir.copy();
                        let len = branch.len;
                        let generation = branch.generation;
                        if (random() < 0.97 && len > 10) {
                            let extraRules = ['F[+F][-F][++F][--F]F','F[+F][++F][-F][--F]F','F[+F]F[-F][+++F]','F[-F]F[+F][---F]'];
                            let rule = random(this.rules['F'].concat(extraRules));
                            let newLen = len * (this.lengthReduction + random(-0.06, 0.09));
                            let angleDelta = this.angle * random(0.55, 1.65) * (random() < 0.25 ? random(1.2, 1.7) : 1);
                            let oldDir = dir.copy();
                            let stack = [];
                            for (let char of rule) {
                                if (char === 'F') {
                                    let newStart = p5.Vector.add(start, p5.Vector.mult(dir, newLen / len));
                                    this.addBranch(newStart, dir.copy(), newLen, generation + 1);
                                } else if (char === '+') {
                                    dir = p5.Vector.fromAngle(dir.heading() + angleDelta * random(0.85, 1.35));
                                } else if (char === '-') {
                                    dir = p5.Vector.fromAngle(dir.heading() - angleDelta * random(0.85, 1.35));
                                } else if (char === '[') {
                                    stack.push(dir.copy());
                                } else if (char === ']') {
                                    dir = stack.pop() || oldDir.copy();
                                }
                            }
                        }
                    }
                    this.growingQueue.splice(i, 1);
                    continue;
                }
            }
            i++;
        }
    }

    display() {
        // Only draw growing branches on main canvas
        for (let branch of this.growingQueue) {
            if (branch.growing) branch.display();
        }
    }
}

let botanicalSystem;
let staticBuffer;

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 255);
    staticBuffer = createGraphics(windowWidth, windowHeight);
    staticBuffer.colorMode(HSB, 360, 100, 100, 255);
    drawBackgroundGradient(staticBuffer);
    botanicalSystem = new BotanicalSystem();
}

function draw() {
    // Draw static buffer (background, finished branches/leaves)
    image(staticBuffer, 0, 0, width, height);
    // Animate only growing branches
    botanicalSystem.update();
    botanicalSystem.display();
}

function mousePressed() {
    // Reset everything
    staticBuffer.clear();
    drawBackgroundGradient(staticBuffer);
    botanicalSystem = new BotanicalSystem();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    staticBuffer = createGraphics(windowWidth, windowHeight);
    staticBuffer.colorMode(HSB, 360, 100, 100, 255);
    drawBackgroundGradient(staticBuffer);
    botanicalSystem = new BotanicalSystem();
}

function drawBackgroundGradient(gfx) {
    // Soft radial gradient for lush depth
    let c1 = color(45, 10, 98);
    let c2 = color(70, 20, 85);
    for (let r = 0; r < max(width, height) * 0.7; r++) {
        let inter = map(r, 0, max(width, height) * 0.7, 0, 1);
        gfx.noStroke();
        gfx.fill(lerpColor(c1, c2, inter));
        gfx.ellipse(width/2, height*0.7, r*2, r*2);
    }
    // Draw ground ellipse
    let groundY = height * 0.93;
    gfx.noStroke();
    gfx.fill(60, 20, 70, 180);
    gfx.ellipse(width/2, groundY + 40, width * 1.2, 90);
    // Draw a subtle shadow under the plant
    gfx.fill(45, 20, 30, 60);
    gfx.ellipse(width/2, groundY + 15, 180, 32);
}

