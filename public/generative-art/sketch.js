const artworks = [
    { title: "Fluid Dynamics", path: "artwork1.html" },
    { title: "Crystalline Growth", path: "artwork2.html" },
    { title: "Harmonic Waves", path: "artwork3.html" },
    { title: "Botanical Dreams", path: "artwork4.html" },
    { title: "Digital Rain", path: "artwork5.html" },
    { title: "Fractal Clouds", path: "artwork6.html" },
    { title: "Circuit Poetry", path: "artwork7.html" },
    { title: "Chromatic Symphony", path: "artwork8.html" },
    { title: "Sacred Geometry", path: "artwork9.html" },
    { title: "Cosmic Nebula", path: "artwork10.html" },
    { title: "Urban Sketches", path: "artwork11.html" },
    { title: "Emergent Patterns", path: "artwork12.html" },
    { title: "Quantum Entanglement", path: "artwork13.html" },
    { title: "Geometric Tessellations", path: "artwork14.html" },
    { title: "StringArt Portraits", path: "artwork15.html" },
    { title: "Prismatic Crystals", path: "artwork16.html" }
];

let canvas;

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.style('z-index', '-1');
    colorMode(HSB, 360, 100, 100, 1);
    
    const grid = createGrid();
    setupInteraction(grid);
}

function createGrid() {
    const margin = 40;
    const cols = 4;
    const rows = 4;
    const gridWidth = width - margin * 2;
    const gridHeight = height - margin * 2;
    const cellWidth = gridWidth / cols;
    const cellHeight = gridHeight / rows;
    
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = margin + 'px';
    container.style.top = margin + 'px';
    container.style.width = gridWidth + 'px';
    container.style.height = gridHeight + 'px';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    container.style.gap = '20px';
    container.style.zIndex = '1';
    document.body.appendChild(container);
    
    return artworks.map((artwork, i) => {
        const button = document.createElement('div');
        button.className = 'artwork-tile';
        
        const title = document.createElement('div');
        title.className = 'artwork-title';
        title.textContent = artwork.title;
        
        button.appendChild(title);
        container.appendChild(button);
        
        return { button, title, index: i };
    });
}

function setupInteraction(grid) {
    const style = document.createElement('style');
    style.textContent = `
        .artwork-tile {
            position: relative;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            overflow: hidden;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .artwork-tile::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at var(--mouse-x) var(--mouse-y),
                                      rgba(255, 255, 255, 0.2),
                                      transparent 80%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .artwork-tile:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .artwork-tile:hover::before {
            opacity: 1;
        }
        
        .artwork-title {
            position: absolute;
            bottom: 20px;
            left: 20px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 16px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .artwork-tile:hover .artwork-title {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
    
    grid.forEach(({ button, title, index }) => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100 + '%';
            const y = ((e.clientY - rect.top) / rect.height) * 100 + '%';
            button.style.setProperty('--mouse-x', x);
            button.style.setProperty('--mouse-y', y);
        });
        
        button.addEventListener('click', () => {
            window.location.href = artworks[index].path;
        });
    });
}

function draw() {
    // Create animated background
    background(0, 0.1);
    
    // Draw flowing particles
    for (let i = 0; i < 5; i++) {
        let x = random(width);
        let y = random(height);
        let size = random(2, 5);
        let hue = (frameCount + x + y) % 360;
        
        noStroke();
        fill(hue, 80, 100, 0.5);
        circle(x, y, size);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // Remove existing grid
    document.body.innerHTML = '';
    // Recreate grid
    const grid = createGrid();
    setupInteraction(grid);
}
