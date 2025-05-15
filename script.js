const gridContainer = document.querySelector('.grid-container');
const scoreDisplay = document.getElementById('score');
let score = 0;

function init() {
    createBoard();
    generateTile();
    generateTile();
}

function createBoard() {
    for (let i = 0; i < 16; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        gridContainer.appendChild(tile);
    }
}

function generateTile() {
    const tiles = document.querySelectorAll('.tile');
    let emptyTiles = [];
    tiles.forEach((tile, index) => {
        if (!tile.innerHTML) emptyTiles.push(index);
    });
    const randomIndex = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    tiles[randomIndex].innerHTML = Math.random() < 0.9 ? 2 : 4;
}

init();
