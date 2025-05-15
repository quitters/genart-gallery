class RainDrop {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.speed = random(5, 15);
        this.characters = [];
        this.maxLength = floor(random(5, 20));
        this.gradient = this.createGradient();
        this.glyphChangeRate = random(0.1, 0.3);
        this.offset = random(1000);
    }

    createGradient() {
        let colors = [];
        let baseHue = random(360);
        for (let i = 0; i < this.maxLength; i++) {
            let brightness = map(i, 0, this.maxLength - 1, 100, 20);
            colors.push(color(baseHue, 80, brightness, map(i, 0, this.maxLength - 1, 255, 50)));
        }
        return colors;
    }

    update() {
        this.pos.y += this.speed;
        
        // Update characters
        if (frameCount % 2 === 0) {
            if (this.characters.length < this.maxLength) {
                this.characters.push(this.getRandomGlyph());
            }
        }

        // Change random characters occasionally
        if (random() < this.glyphChangeRate) {
            let index = floor(random(this.characters.length));
            if (index > 0) { // Don't change the first character
                this.characters[index] = this.getRandomGlyph();
            }
        }

        // Reset only after tail is fully off screen
        if (this.pos.y - (this.characters.length - 1) * 20 > height) {
            this.pos.y = random(-100, 0);
            this.characters = [];
        }
    }

    getRandomGlyph() {
        // Mix of different character sets for a unique look
        let glyphs = [
            '㊅', '㊈', '㊉', '㊊', '㊋', '㊌', '㊍', '㊎',
            '⚡', '☯', '⚛', '⚕', '⚚',
            '⠋', '⠛', '⠟', '⠿', '⡿',
            '⣿', '⢿', '⣻', '⣽', '⣾',
            '漢', '字', '한', '글',
            '∞', '∑', '∆', '∇', '∏'
        ];
        return random(glyphs);
    }

    display(bloomOverride = null) {
        push();
        textSize(16);
        textAlign(CENTER);
        // Adaptive bloom
        let bloom = bloomOverride !== null ? bloomOverride : 15;
        drawingContext.shadowBlur = bloom;
        drawingContext.shadowColor = color(this.gradient[0]);
        // Draw characters with gradient
        for (let i = 0; i < this.characters.length; i++) {
            let y = this.pos.y - i * 20;
            if (y > 0 && y < height) {
                fill(this.gradient[i] || this.gradient[this.gradient.length - 1]);
                // Add wave effect
                let xOffset = sin((frameCount * 0.02) + (this.offset + i * 0.5)) * 5;
                text(this.characters[i], this.pos.x + xOffset, y);
            }
        }
        pop();
    }
}

class RainSystem {
    constructor() {
        this.drops = [];
        this.spacing = 30;
        this.maxDrops = Math.floor(width / this.spacing) + 8; // Adaptive
        this.init();
    }

    init() {
        this.drops = [];
        for (let x = this.spacing; x < width - this.spacing; x += this.spacing) {
            this.drops.push(new RainDrop(x, random(-500, 0)));
        }
    }

    update() {
        // Adaptive: reduce drops if frameRate low
        let fr = frameRate();
        if (fr < 40 && this.drops.length > Math.floor(this.maxDrops * 0.7)) {
            this.drops.splice(0, 1); // Remove oldest
        }
        // Recycle drops instead of deleting
        for (let i = 0; i < this.drops.length; i++) {
            let drop = this.drops[i];
            drop.update();
            if (drop.pos.y - (drop.characters.length * 20) > height) {
                // Recycle
                drop.pos.y = random(-100, 0);
                drop.characters = [];
                drop.maxLength = floor(random(5, 20));
                drop.gradient = drop.createGradient();
            }
        }
        // Add drops if too few
        while (this.drops.length < this.maxDrops) {
            let x = random(this.spacing, width - this.spacing);
            this.drops.push(new RainDrop(x, random(-500, 0)));
        }
    }
    }



// --- Background buffer for static drawing ---
let bgBuffer;
let rainSystem;

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 255);
    bgBuffer = createGraphics(width, height);
    bgBuffer.colorMode(HSB, 360, 100, 100, 255);
    drawBackground(bgBuffer);
    rainSystem = new RainSystem();
    frameRate(60);
}

function drawBackground(gfx) {
    // Simple vertical gradient background
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(color(200, 60, 10), color(220, 30, 35), inter);
        gfx.stroke(c);
        gfx.line(0, y, width, y);
    }
}

function draw() {
    // Profile frame rate
    if (frameCount % 120 === 0) {
        console.log('Frame rate:', nf(frameRate(), 2, 1));
    }
    // Adaptive detail
    let fr = frameRate();
    let bloom = fr < 40 ? 7 : 15;
    let maxLen = fr < 40 ? 10 : 20;
    // Draw static background
    image(bgBuffer, 0, 0, width, height);
    // Update and display rain
    background(0, 0, 0, 20);
    
    rainSystem.update();
    for (let drop of rainSystem.drops) {
        drop.maxLength = maxLen;
        drop.display(bloom);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    rainSystem = new RainSystem();
}
