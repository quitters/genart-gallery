class Cloud {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.size = random(90, 240);
        this.detail = random(0.003, 0.012);
        this.speed = random(0.2, 0.6) * (0.7 + 0.6 * abs(wind.dir));
        this.offset = random(1000);
        this.brightness = random(40, 80);
        this.alpha = random(120, 220);
        this.type = random(['puff', 'wisp', 'cumulonimbus']);
        this.tilt = random(-PI/8, PI/8);
        this.stretch = random(0.8, 1.4);
        this.lightning = {
            active: false,
            branches: [],
            timer: 0,
            sheet: false
        };
    }

    update() {
        // Wind affects cloud
        this.pos.x += this.speed * wind.dir * wind.speed * (this.type === 'wisp' ? 1.2 : 1);
        if (this.pos.x > width + this.size) {
            this.pos.x = -this.size;
        }
        if (this.pos.x < -this.size) {
            this.pos.x = width + this.size;
        }
        // Random lightning generation
        if (!this.lightning.active && random() < (this.type === 'cumulonimbus' ? 0.003 : 0.0005)) {
            this.createLightning();
        }
        if (this.lightning.active) {
            this.lightning.timer--;
            if (this.lightning.timer <= 0) {
                this.lightning.active = false;
            }
        }
    }

    createLightning() {
        this.lightning.active = true;
        this.lightning.timer = int(random(8, 16));
        this.lightning.branches = [];
        this.lightning.sheet = (random() < 0.15 && this.type === 'cumulonimbus');
        let start = createVector(this.pos.x + random(this.size), this.pos.y + this.size/3);
        let direction = createVector(random(-1, 1), 1);
        this.generateLightningBranch(start, direction, 0);
        // Forked lightning
        if (random() < 0.3 && this.type === 'cumulonimbus') {
            for (let i = 0; i < int(random(1, 3)); i++) {
                let forkDir = createVector(random(-1, 1), 1);
                this.generateLightningBranch(start, forkDir, 0);
            }
        }
    }

    generateLightningBranch(start, direction, depth) {
        if (depth > 4) return;

        let length = random(20, 50) * (1 - depth/5);
        let end = p5.Vector.add(start, p5.Vector.mult(direction, length));
        
        this.lightning.branches.push({
            start: start.copy(),
            end: end.copy(),
            alpha: random(150, 255)
        });

        // Create sub-branches
        if (random() < 0.6) {
            let newDir = direction.copy().rotate(random(-PI/4, PI/4));
            this.generateLightningBranch(end, newDir, depth + 1);
        }
    }

    display() {
        push();
        noStroke();
        // Generative cloud shapes
        for (let i = 0; i < 5; i++) {
            let size = this.size * (1 - i/5) * (this.type === 'wisp' ? this.stretch : 1);
            let alpha = this.alpha * (1 - i/5);
            let grad;
            if (this.type === 'cumulonimbus') {
                grad = lerpColor(color(210, 10, 100), color(220, 18, 30), i/5);
            } else if (this.type === 'wisp') {
                grad = lerpColor(color(210, 5, 100), color(210, 10, 70), i/5);
            } else {
                grad = lerpColor(color(210, 10, 100), color(220, 30, 60), i/5);
            }
            fill(grad, alpha);
            beginShape();
            for (let a = 0; a < TWO_PI; a += 0.1) {
                let xoff = map(cos(a), -1, 1, 0, 1) * this.detail;
                let yoff = map(sin(a), -1, 1, 0, 1) * this.detail;
                let r = size * (0.7 + noise(xoff + this.offset, yoff + this.offset, frameCount * 0.001 + i*0.1) * 0.3);
                let x = this.pos.x + cos(a + this.tilt) * r + i * 6 * sin(frameCount*0.002 + this.offset);
                let y = this.pos.y + sin(a + this.tilt) * r + i * 2 * cos(frameCount*0.001 + this.offset);
                if (this.type === 'wisp') x += 20 * sin(a) * this.stretch;
                if (this.type === 'cumulonimbus') y -= 10 * pow(sin(a), 6);
                curveVertex(x, y);
            }
            endShape(CLOSE);
            // Add inner glow
            drawingContext.shadowBlur = 30;
            drawingContext.shadowColor = color(255, alpha/2);
        }
        // Dramatic lightning
        if (this.lightning.active) {
            if (this.lightning.sheet) {
                fill(220, 230, 255, 60);
                rect(-10, -10, width+20, height+20);
            } else {
                fill(220, 230, 255, 30);
                rect(-10, -10, width+20, height+20);
            }
            drawingContext.shadowBlur = 40;
            drawingContext.shadowColor = color(200, 220, 255);
            for (let branch of this.lightning.branches) {
                stroke(200, 220, 255, branch.alpha);
                strokeWeight(this.type === 'cumulonimbus' ? 3 : 2);
                line(branch.start.x, branch.start.y, branch.end.x, branch.end.y);
            }
        }
        pop();
    }
}

class WeatherSystem {
    constructor() {
        this.clouds = [];
        this.raindrops = [];
        this.weatherType = 'clear';
        this.transitionProgress = 0;
        this.init();
    }

    init() {
        this.clouds = [];
        for (let i = 0; i < 8; i++) {
            let y = random(height/4, height/2);
            if (i % 4 === 0) y -= 40; // Some higher clouds
            this.clouds.push(new Cloud(
                random(width),
                y
            ));
        }
    }

    update() {
        // Update clouds
        for (let cloud of this.clouds) {
            cloud.update();
        }
        // Update raindrops
        if (this.weatherType === 'rain') {
            if (this.raindrops.length < this.maxRaindrops && random() < 0.4) {
                this.addRaindrop();
            }
        }
        for (let i = this.raindrops.length - 1; i >= 0; i--) {
            let drop = this.raindrops[i];
            drop.x += drop.windX;
            drop.y += drop.speed;
            // Ripple/splash
            if (!drop.splashed && drop.y + drop.length > height - 36) {
                drop.splashed = true;
                drop.ripples = int(random(2, 5));
                drop.rippleRadius = 0;
            }
            if (drop.splashed) {
                drop.rippleRadius += 1.7;
                if (drop.rippleRadius > 30) {
                    this.raindrops.splice(i, 1);
                }
            } else if (drop.y > height + 10) {
                this.raindrops.splice(i, 1);
            }
        }
    }

    addRaindrop() {
        let angle = random(-PI/16, PI/16) + wind.dir * wind.speed * 0.12;
        let len = random(10, 22);
        this.raindrops.push({
            x: random(width),
            y: random(height/2, height/2 + 100),
            length: len,
            speed: random(8, 16) + wind.speed * 0.7,
            alpha: random(100, 200),
            windX: tan(angle) * (len * 0.7),
            splashed: false,
            ripples: 0,
            rippleRadius: 0
        });
    }

    display() {
        // Draw raindrops
        if (this.weatherType === 'rain') {
            for (let drop of this.raindrops) {
                if (!drop.splashed) {
                    strokeWeight(1.4);
                    stroke(200, 220, 255, drop.alpha);
                    line(drop.x, drop.y, 
                         drop.x + drop.windX, drop.y + drop.length);
                } else {
                    noFill();
                    stroke(200, 220, 255, 80);
                    for (let j = 0; j < drop.ripples; j++) {
                        ellipse(drop.x + drop.windX, height - 36, drop.rippleRadius + j * 5, 7 + j * 2);
                    }
                }
            }
        }
        // Draw clouds
        for (let cloud of this.clouds) {
            cloud.display();
        }
    }

    setWeather(type) {
        this.weatherType = type;
    }
}

let skyBuffer;
let weatherSystem;
let lastMouseY;
let skyPhase = 0; // For animated sky gradient
let wind = { speed: 1, dir: 1 };
let timeOfDay = 0; // 0 = morning, PI = night, 2PI = next morning

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 255);
    skyBuffer = createGraphics(width, height);
    skyBuffer.colorMode(HSB, 360, 100, 100, 255);
    drawSkyGradient(skyBuffer, 0, 'clear');
    weatherSystem = new WeatherSystem();
    lastMouseY = mouseY;
    frameRate(60);
}

function drawSkyGradient(gfx, phase = 0, type = 'clear', tod = 0) {
    // Animate sky color based on phase, weather, and time of day
    let top, bottom;
    let dayAmt = constrain(map(cos(tod), -1, 1, 0, 1), 0, 1);
    if (type === 'storm') {
        top = lerpColor(color(220, 40, 18 + 12 * sin(phase)), color(210, 40, 10), 1 - dayAmt);
        bottom = lerpColor(color(220, 30, 35 + 10 * sin(phase)), color(210, 20, 30), 1 - dayAmt);
    } else if (type === 'night' || dayAmt < 0.15) {
        top = color(240, 30, 8 + 8 * sin(phase));
        bottom = color(220, 20, 18 + 6 * sin(phase));
    } else {
        top = color(200, 40, 90 + 8 * sin(phase));
        bottom = color(210, 20, 60 + 10 * sin(phase));
    }
    for (let y = 0; y < gfx.height; y++) {
        let inter = map(y, 0, gfx.height, 0, 1);
        let c = lerpColor(top, bottom, inter);
        gfx.stroke(c);
        gfx.line(0, y, gfx.width, y);
    }
}

function drawSunMoon(tod) {
    let amt = constrain(map(cos(tod), -1, 1, 0, 1), 0, 1);
    let sunX = lerp(width * 0.12, width * 0.88, amt);
    let sunY = height * 0.18 - 0.13 * height * cos(tod);
    let moonX = lerp(width * 0.88, width * 0.12, amt);
    let moonY = height * 0.18 + 0.13 * height * cos(tod);
    // Sun
    if (amt > 0.15) {
        noStroke();
        fill(55, 100, 100, 170);
        ellipse(sunX, sunY, 80, 80);
        fill(55, 60, 100, 120);
        ellipse(sunX, sunY, 140, 140);
    }
    // Moon
    if (amt < 0.85) {
        noStroke();
        fill(210, 10, 100, 120);
        ellipse(moonX, moonY, 60, 60);
        fill(210, 5, 100, 80);
        ellipse(moonX, moonY, 100, 100);
    }
}

function drawStars() {
    randomSeed(42); // Consistent stars
    for (let i = 0; i < 120; i++) {
        let x = random(width);
        let y = random(height * 0.7);
        let s = random(1, 2.6);
        fill(220, 10, 100, random(120, 200));
        noStroke();
        ellipse(x, y, s, s);
    }
}

function drawForeground() {
    // Simple rolling hills silhouette
    noStroke();
    fill(140, 30, 15, 250);
    beginShape();
    vertex(0, height);
    for (let x = 0; x <= width; x += 18) {
        let y = height - 40 - 28 * noise(x * 0.012, frameCount * 0.004);
        vertex(x, y);
    }
    vertex(width, height);
    endShape(CLOSE);
}

function draw() {
    // Animate sky phase & time of day
    skyPhase += 0.005;
    timeOfDay += 0.0007; // Slow day/night cycle
    if (timeOfDay > TWO_PI) timeOfDay -= TWO_PI;
    let weatherType = weatherSystem.weatherType;
    drawSkyGradient(skyBuffer, skyPhase, weatherType, timeOfDay);
    image(skyBuffer, 0, 0, width, height);

    // Sun/moon
    drawSunMoon(timeOfDay);
    // Stars at night
    if (cos(timeOfDay) < -0.2) drawStars();

    // Update wind
    wind.speed = lerp(wind.speed, 1 + noise(frameCount * 0.002) * 3, 0.02);
    wind.dir = lerp(wind.dir, sin(timeOfDay + noise(frameCount * 0.001)) > 0 ? 1 : -1, 0.01);

    // Update weather based on mouse movement
    let mouseSpeed = abs(mouseY - lastMouseY);
    if (mouseSpeed > 5) {
        weatherSystem.setWeather('rain');
    } else {
        weatherSystem.setWeather('clear');
    }
    lastMouseY = mouseY;

    // Adaptive detail
    let fr = frameRate();
    weatherSystem.maxClouds = fr < 40 ? 4 : 9;
    weatherSystem.maxRaindrops = fr < 40 ? 120 : 300;

    weatherSystem.update();
    weatherSystem.display();
    // Foreground silhouettes
    drawForeground();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    weatherSystem = new WeatherSystem();
}
