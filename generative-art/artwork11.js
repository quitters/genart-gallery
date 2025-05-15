class Building {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.windows = [];
        this.details = [];
        this.style = random(['modern', 'classic', 'industrial']);
        this.generateDetails();
    }

    generateDetails() {
        // Generate windows
        let windowRows = floor(random(3, 8));
        let windowCols = floor(random(2, 5));
        let windowW = this.w / (windowCols * 2);
        let windowH = this.h / (windowRows * 1.5);

        for (let i = 0; i < windowRows; i++) {
            for (let j = 0; j < windowCols; j++) {
                let wx = this.x + this.w * 0.2 + j * windowW * 2;
                let wy = this.y + this.h * 0.15 + i * windowH * 1.5;
                // Window light color and on/off
                let isLit = random() > 0.18;
                let winColor = isLit ? color(random(40, 60), random(60, 100), random(220, 255)) : color(30, 10, 30, 80);
                this.windows.push({
                    x: wx,
                    y: wy,
                    w: windowW,
                    h: windowH,
                    lit: isLit,
                    col: winColor
                });
            }
        }
        // Add rooftop details
        if (random() < 0.4) {
            this.details.push({type: 'antenna', x: this.x + this.w/2, y: this.y, h: random(20, 50)});
        }
        if (random() < 0.2) {
            this.details.push({type: 'waterTower', x: this.x + random(10, this.w-10), y: this.y, r: random(8, 16)});
        }
    }

    display(parallax=0) {
        push();
        translate(this.x + parallax, this.y);
        // Building body
        fill(...currentPalette.building, 220);
        stroke(...currentPalette.detail, 60);
        rect(0, 0, this.w, this.h, 3);
        // Windows
        noStroke();
        for (let win of this.windows) {
            fill(win.lit ? color(...currentPalette.window, 210) : color(...currentPalette.building, 60));
            rect(win.x - this.x - parallax, win.y - this.y, win.w, win.h, 2);
        }
        // Rooftop details
        for (let d of this.details) {
            if (d.type === 'antenna') {
                stroke(...currentPalette.detail, 180);
                strokeWeight(2);
                line(d.x - this.x - parallax, 0, d.x - this.x - parallax, -d.h);
                strokeWeight(1);
            } else if (d.type === 'waterTower') {
                fill(...currentPalette.detail, 160);
                ellipse(d.x - this.x - parallax, 0, d.r, d.r * 1.5);
            }
        }
        pop();
    }
}

class UrbanSketch {
    constructor() {
        this.buildings = [];
        this.powerLines = [];
        this.birds = [];
        this.generateScene();
    }

    generateScene() {
        // Generate buildings
        let x = 0;
        while (x < width) {
            let w = random(50, 150);
            let h = random(100, height * 0.8);
            this.buildings.push(new Building(x, height - h, w, h));
            x += w + random(-10, 10);
        }


        // Generate evenly spaced power line poles
        let numPoles = max(4, floor(width / 180));
        let poleSpacing = width / (numPoles - 1);
        let poles = [];
        for (let i = 0; i < numPoles; i++) {
            let x = i * poleSpacing;
            let y1 = height - random(180, 260); // pole top
            poles.push({x, y1});
        }
        // Create lines between consecutive poles
        this.powerLines = [];
        for (let i = 0; i < poles.length - 1; i++) {
            let p1 = poles[i];
            let p2 = poles[i + 1];
            this.powerLines.push({
                x1: p1.x, y1: p1.y1,
                x2: p2.x, y2: p2.y1,
                droopiness: random(20, 40)
            });
        }
        // Store poles for drawing verticals
        this.powerPoles = poles;
    }

    drawPowerLine(pline) {
        // Draw vertical poles from top to bottom
        stroke(40);
        strokeWeight(3);
        line(pline.x1, pline.y1, pline.x1, height);
        line(pline.x2, pline.y2, pline.x2, height);

        // Draw wires with drooping effect between pole tops
        for (let i = 0; i < 3; i++) {
            let y_offset = i * 10;
            beginShape();
            noFill();
            for (let t = 0; t <= 1; t += 0.1) {
                let x = lerp(pline.x1, pline.x2, t);
                let y = lerp(pline.y1, pline.y2, t) + y_offset;
                // Add droop
                y += sin(t * PI) * pline.droopiness;
                // Add sketch effect
                y += random(-1, 1);
                vertex(x, y);
            }
            endShape();
        }
    }

    update() {
        // Update birds
        if (random() < 0.02) {
            this.birds.push({
                x: -20,
                y: random(height * 0.3, height * 0.6),
                speed: random(2, 4)
            });
        }

        for (let i = this.birds.length - 1; i >= 0; i--) {
            this.birds[i].x += this.birds[i].speed;
            if (this.birds[i].x > width + 20) {
                this.birds.splice(i, 1);
            }
        }
    }

    display() {
        // Gradient sky background
        for (let y = 0; y < height; y += 2) {
            let lerpAmt = y / height;
            let skyCol = lerpColor(color(...currentPalette.sky), color(20, 20, 40), lerpAmt * 0.5);
            stroke(skyCol);
            line(0, y, width, y);
        }

        // Draw buildings
        for (let building of this.buildings) {
            building.display();
        }

        // Draw power line vertical poles (for edge poles)
        if (this.powerPoles) {
            stroke(40);
            strokeWeight(3);
            for (let pole of this.powerPoles) {
                line(pole.x, pole.y1, pole.x, height);
            }
        }
        // Draw power lines
        for (let line of this.powerLines) {
            this.drawPowerLine(line);
        }


        // Draw birds
        for (let bird of this.birds) {
            push();
            translate(bird.x, bird.y);
            stroke(40);
            strokeWeight(1);
            // Draw simple "M" shaped birds
            for (let i = 0; i < 2; i++) {
                let offset = random(-1, 1);
                beginShape();
                vertex(-5 + offset, 0 + offset);
                vertex(0 + offset, -3 + offset);
                vertex(5 + offset, 0 + offset);
                endShape();
            }
            pop();
        }
    }
}

// === Cityscape Color Palettes ===
const CITYSCAPE_PALETTES = [
    // 1. Twilight
    { sky: [30, 34, 80], building: [30, 20, 30], window: [255, 230, 180], detail: [70, 60, 90] },
    // 2. Neon Night
    { sky: [20, 10, 50], building: [10, 10, 30], window: [0, 255, 180], detail: [255, 0, 160] },
    // 3. Dawn
    { sky: [255, 180, 140], building: [80, 80, 100], window: [255, 255, 200], detail: [200, 120, 80] },
    // 4. Blue Hour
    { sky: [30, 60, 120], building: [40, 50, 80], window: [255, 220, 140], detail: [60, 90, 140] },
    // 5. Golden Glow
    { sky: [255, 230, 120], building: [120, 100, 40], window: [255, 255, 160], detail: [200, 180, 80] },
    // 6. Rainy Evening
    { sky: [60, 80, 110], building: [30, 40, 60], window: [180, 220, 255], detail: [120, 140, 180] },
    // 7. Sunset Pop
    { sky: [255, 120, 120], building: [100, 40, 60], window: [255, 255, 180], detail: [255, 180, 80] },
    // 8. Urban Jungle
    { sky: [80, 130, 100], building: [60, 80, 60], window: [220, 255, 200], detail: [80, 140, 80] },
    // 9. Midnight
    { sky: [10, 10, 30], building: [30, 30, 60], window: [180, 220, 255], detail: [60, 80, 140] }
];
let currentPaletteIndex;
let currentPalette;

let urbanSketch;

function setup() {
    createCanvas(windowWidth, windowHeight);
    currentPaletteIndex = Math.floor(random(0, 9));
    setPalette(currentPaletteIndex);
}

function setPalette(idx) {
    currentPaletteIndex = idx;
    currentPalette = CITYSCAPE_PALETTES[currentPaletteIndex];
    urbanSketch = new UrbanSketch();
}

function draw() {
    urbanSketch.update();
    urbanSketch.display();
}

function mousePressed() {
    // Generate new scene
    setPalette(currentPaletteIndex);
}

function keyPressed() {
    if (key >= '1' && key <= '9') {
        setPalette(Number(key) - 1);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    setPalette(currentPaletteIndex);
}
