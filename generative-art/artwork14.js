class OrigamiTile {
    constructor(x, y, size, pattern) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.pattern = pattern;
        this.foldAmount = 0;
        this.targetFold = 1;
        this.foldSpeed = random(0.02, 0.04);
        this.rotationOffset = random(TWO_PI);
        this.depth = 0;
    }

    update() {
        // Smooth folding animation
        this.foldAmount = lerp(this.foldAmount, this.targetFold, this.foldSpeed);
    }

    display() {
        push();
        translate(this.x, this.y);
        rotate(this.rotationOffset);

        // Apply different folding patterns
        switch(this.pattern) {
            case 'valley':
                this.drawValleyFold();
                break;
            case 'mountain':
                this.drawMountainFold();
                break;
            case 'waterbomb':
                this.drawWaterbombFold();
                break;
            case 'twist':
                this.drawTwistFold();
                break;
        }
        pop();
    }

    drawValleyFold() {
        let half = this.size / 2;
        // Colors for valley fold
        let leftCol = lerpColor(color('#5ee7df'), color('#b490ca'), this.foldAmount);
        let rightCol = lerpColor(color('#b490ca'), color('#f3e7e9'), this.foldAmount);
        let shadowCol = color(60, 80, 120, 50);

        // Calculate fold heights
        let h1 = map(this.foldAmount, 0, 1, 0, half);
        let h2 = map(this.foldAmount, 0, 1, 0, -half);

        // Drop shadow
        noStroke();
        fill(shadowCol);
        ellipse(0, half * 0.9, this.size * 0.85, this.size * 0.25);

        // Left side
        fill(leftCol);
        beginShape();
        vertex(-half, -half);
        vertex(0, -half + h1);
        vertex(0, half + h2);
        vertex(-half, half);
        endShape(CLOSE);

        // Right side (with highlight)
        fill(rightCol);
        beginShape();
        vertex(0, -half + h1);
        vertex(half, -half);
        vertex(half, half);
        vertex(0, half + h2);
        endShape(CLOSE);

        // Glow edge
        stroke(255, 180);
        strokeWeight(2);
        line(0, -half + h1, 0, half + h2);
    }

    drawMountainFold() {
        let half = this.size / 2;
        let peakHeight = map(this.foldAmount, 0, 1, 0, half);
        // Colors for mountain fold
        let leftCol = lerpColor(color('#f7971e'), color('#ffd200'), this.foldAmount);
        let rightCol = lerpColor(color('#ffd200'), color('#f7971e'), this.foldAmount);
        let shadowCol = color(120, 80, 40, 60);

        // Drop shadow
        noStroke();
        fill(shadowCol);
        ellipse(0, half * 0.9, this.size * 0.85, this.size * 0.25);

        // Left side
        fill(leftCol);
        beginShape();
        vertex(-half, -half);
        vertex(0, -half);
        vertex(0, 0);
        vertex(-half, half);
        endShape(CLOSE);

        // Right side
        fill(rightCol);
        beginShape();
        vertex(half, -half);
        vertex(0, -half);
        vertex(0, 0);
        vertex(half, half);
        endShape(CLOSE);

        // Center peak highlight
        fill(255, 180);
        ellipse(0, peakHeight * 0.8, 8, 8);
    }

    drawWaterbombFold() {
        let half = this.size / 2;
        let center = map(this.foldAmount, 0, 1, 0, -half/2);
        // Colors for waterbomb fold
        let colors = [color('#43cea2'), color('#185a9d'), color('#ffaf7b'), color('#ffd452')];
        let shadowCol = color(30, 60, 40, 50);

        // Drop shadow
        noStroke();
        fill(shadowCol);
        ellipse(0, half * 0.9, this.size * 0.85, this.size * 0.25);

        // Draw four triangular sections with gradient
        for (let i = 0; i < 4; i++) {
            push();
            rotate(i * HALF_PI);
            fill(lerpColor(colors[i], colors[(i+1)%4], this.foldAmount));
            beginShape();
            vertex(0, 0);
            vertex(half, 0);
            vertex(0, center);
            endShape(CLOSE);
            pop();
        }

        // Center point highlight
        fill(255, 220);
        circle(0, center, 8);
    }

    drawTwistFold() {
        let half = this.size / 2;
        let twist = map(this.foldAmount, 0, 1, 0, PI/3);
        // Colors for twist fold
        let spiralCol = lerpColor(color('#ff61a6'), color('#6dd5ed'), this.foldAmount);
        let shadowCol = color(60, 0, 60, 40);

        // Drop shadow
        noStroke();
        fill(shadowCol);
        ellipse(0, half * 0.9, this.size * 0.85, this.size * 0.25);

        // Draw spiral fold pattern
        noFill();
        stroke(spiralCol);
        strokeWeight(2.5);
        beginShape();
        for (let a = 0; a < TWO_PI * 2; a += 0.1) {
            let r = map(a, 0, TWO_PI * 2, 0, half);
            let x = cos(a + twist * this.foldAmount) * r;
            let y = sin(a + twist * this.foldAmount) * r;
            vertex(x, y);
        }
        endShape();

        // Glow effect
        stroke(255, 80);
        strokeWeight(6);
        point(0, 0);
    }
}

class OrigamiTessellation {
    constructor() {
        this.tileSize = 80;
        this.cols = ceil(width / this.tileSize) + 1;
        this.rows = ceil(height / this.tileSize) + 1;
        this.tiles = [];
        this.patterns = ['valley', 'mountain', 'waterbomb', 'twist'];
        this.offset = 0;
        this.init();
    }

    init() {
        // Create tessellating pattern
        for (let i = 0; i < this.cols; i++) {
            this.tiles[i] = [];
            for (let j = 0; j < this.rows; j++) {
                let pattern = this.patterns[floor(noise(i * 0.5, j * 0.5) * this.patterns.length)];
                this.tiles[i][j] = new OrigamiTile(
                    i * this.tileSize,
                    j * this.tileSize,
                    this.tileSize,
                    pattern
                );
            }
        }
    }

    update() {
        // Update all tiles
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                this.tiles[i][j].update();
            }
        }
        
        // Animate offset for smooth scrolling
        this.offset += 0.5;
        if (this.offset > this.tileSize) {
            this.offset = 0;
            
            // Shift tiles and create new ones
            for (let i = 0; i < this.cols; i++) {
                this.tiles[i].shift();
                let pattern = this.patterns[floor(noise(i * 0.5, frameCount * 0.1) * this.patterns.length)];
                this.tiles[i].push(new OrigamiTile(
                    i * this.tileSize,
                    (this.rows - 1) * this.tileSize,
                    this.tileSize,
                    pattern
                ));
            }
        }
    }

    display() {
        push();
        translate(-this.offset, -this.offset);
        
        // Draw all tiles
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                this.tiles[i][j].display();
            }
        }
        pop();
    }
}

let tessellation;
let lightAngle;

function setup() {
    createCanvas(windowWidth, windowHeight);
    tessellation = new OrigamiTessellation();
    lightAngle = 0;
}

function draw() {
    // Animated background gradient
    let t = millis() * 0.0002;
    for (let y = 0; y < height; y++) {
        let lerpAmt = y / height;
        let c1 = color(140 + 80 * sin(t), 180 + 40 * cos(t), 255 - 40 * sin(t));
        let c2 = color(255 - 20 * cos(t), 210 + 30 * sin(t), 180 + 40 * cos(t));
        let c = lerpColor(c1, c2, lerpAmt);
        stroke(c);
        line(0, y, width, y);
    }
    // Soft overlay for depth
    noStroke();
    fill(255, 40);
    rect(0, 0, width, height);

    // Update light angle for dynamic shadows
    lightAngle += 0.01;

    tessellation.update();
    tessellation.display();
}

function mousePressed() {
    // Reinitialize with new pattern
    tessellation = new OrigamiTessellation();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    tessellation = new OrigamiTessellation();
}
