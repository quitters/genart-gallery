class Tile {
    constructor(x, y, size, options) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.options = options;
        this.collapsed = false;
        this.value = null;
        this.entropy = options.length;
    }

    collapse() {
        if (this.options.length > 0) {
            this.value = random(this.options);
            this.collapsed = true;
            this.options = [this.value];
            this.entropy = 0;
        }
    }

    display() {
        push();
        translate(this.x * this.size, this.y * this.size);
        
        if (this.collapsed) {
            this.drawPattern(this.value);
        } else {
            // Draw uncollapsed state
            noFill();
            stroke(200, this.entropy * 30);
            rect(0, 0, this.size, this.size);
        }
        pop();
    }

    drawPattern(pattern) {
        let padding = this.size * 0.1;
        let innerSize = this.size - padding * 2;
        
        switch(pattern) {
            case 'empty':
                noStroke();
                fill(240);
                rect(0, 0, this.size, this.size);
                break;
                
            case 'dot':
                fill(40);
                noStroke();
                circle(this.size/2, this.size/2, innerSize/2);
                break;
                
            case 'line':
                stroke(40);
                strokeWeight(3);
                line(padding, this.size/2, this.size-padding, this.size/2);
                break;
                
            case 'corner':
                stroke(40);
                strokeWeight(3);
                noFill();
                beginShape();
                vertex(padding, this.size/2);
                vertex(padding, padding);
                vertex(this.size/2, padding);
                endShape();
                break;
                
            case 'cross':
                stroke(40);
                strokeWeight(3);
                line(this.size/2, padding, this.size/2, this.size-padding);
                line(padding, this.size/2, this.size-padding, this.size/2);
                break;
                
            case 'curve':
                stroke(40);
                strokeWeight(3);
                noFill();
                arc(padding, padding, innerSize, innerSize, 0, HALF_PI);
                break;
        }
    }
}

class WaveFunctionCollapse {
    constructor() {
        this.tileSize = 40;
        this.cols = floor(width / this.tileSize);
        this.rows = floor(height / this.tileSize);
        this.patterns = ['empty', 'dot', 'line', 'corner', 'cross', 'curve'];
        this.grid = [];
        this.rules = this.createRules();
        this.stack = [];
        this.init();
    }

    createRules() {
        return {
            'empty': ['dot', 'line', 'corner', 'cross', 'curve'],
            'dot': ['empty', 'line', 'corner'],
            'line': ['empty', 'dot', 'cross'],
            'corner': ['empty', 'dot', 'cross'],
            'cross': ['empty', 'line', 'corner'],
            'curve': ['empty', 'line', 'corner']
        };
    }

    init() {
        // Initialize grid
        for (let i = 0; i < this.cols; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.rows; j++) {
                this.grid[i][j] = new Tile(
                    i, j, this.tileSize,
                    [...this.patterns]
                );
            }
        }

        // Collapse first tile
        let startX = floor(random(this.cols));
        let startY = floor(random(this.rows));
        this.grid[startX][startY].collapse();
        this.propagate(startX, startY);
    }

    getNeighbors(x, y) {
        let neighbors = [];
        if (x > 0) neighbors.push({x: x-1, y: y, dir: 'left'});
        if (x < this.cols-1) neighbors.push({x: x+1, y: y, dir: 'right'});
        if (y > 0) neighbors.push({x: x, y: y-1, dir: 'up'});
        if (y < this.rows-1) neighbors.push({x: x, y: y+1, dir: 'down'});
        return neighbors;
    }

    propagate(x, y) {
        let neighbors = this.getNeighbors(x, y);
        for (let n of neighbors) {
            let tile = this.grid[n.x][n.y];
            if (!tile.collapsed) {
                let validOptions = [];
                let centerTile = this.grid[x][y];
                // Fix: skip if center tile is not collapsed or has no value
                if (!centerTile.collapsed || centerTile.value === undefined) continue;
                for (let option of tile.options) {
                    if (this.rules[centerTile.value].includes(option)) {
                        validOptions.push(option);
                    }
                }
                
                if (validOptions.length < tile.options.length) {
                    tile.options = validOptions;
                    tile.entropy = validOptions.length;
                    this.stack.push({x: n.x, y: n.y});
                }
            }
        }
    }

    findLowestEntropy() {
        let minEntropy = Infinity;
        let candidates = [];

        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                let tile = this.grid[i][j];
                if (!tile.collapsed && tile.entropy > 0) {
                    if (tile.entropy < minEntropy) {
                        minEntropy = tile.entropy;
                        candidates = [{x: i, y: j}];
                    } else if (tile.entropy === minEntropy) {
                        candidates.push({x: i, y: j});
                    }
                }
            }
        }

        if (candidates.length > 0) {
            return random(candidates);
        }
        return null;
    }

    update() {
        // Process propagation stack
        while (this.stack.length > 0) {
            let pos = this.stack.pop();
            this.propagate(pos.x, pos.y);
        }

        // Find and collapse lowest entropy tile
        let nextTile = this.findLowestEntropy();
        if (nextTile) {
            this.grid[nextTile.x][nextTile.y].collapse();
            this.propagate(nextTile.x, nextTile.y);
        }
    }

    display() {
        background(255);
        
        // Draw grid
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                this.grid[i][j].display();
            }
        }
    }

    isComplete() {
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (!this.grid[i][j].collapsed) return false;
            }
        }
        return true;
    }
}

let wfc;
let isGenerating = true;

function setup() {
    createCanvas(windowWidth, windowHeight);
    wfc = new WaveFunctionCollapse();
}

function draw() {
    if (isGenerating && !wfc.isComplete()) {
        for (let i = 0; i < 5; i++) { // Process multiple steps per frame
            wfc.update();
        }
    }
    wfc.display();
}

function mousePressed() {
    // Start new pattern
    wfc = new WaveFunctionCollapse();
    isGenerating = true;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    wfc = new WaveFunctionCollapse();
}
