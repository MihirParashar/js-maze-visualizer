//Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
window.onload = () => {
    const canvas = document.getElementById("canvas")
    const ctx = canvas.getContext("2d")
    const canvasWidth = 600
    const canvasHeight = 600
    const gameLengthSeconds = 30

    canvas.width = canvasWidth
    canvas.height = canvasHeight
    ctx.font = "30px Arial"

    let prevTimeStamp = 0
    let score = 0
    let grid
    let mazeBuildingSimulation
    const widthSlider = document.getElementById("width")
    const heightSlider = document.getElementById("height")
    const frameTimeText = document.getElementById("frameTime")
    const drawButton = document.getElementById("drawButton")
    const size = 30
    const Direction = {
        LEFT: 0,
        RIGHT: 1,
        TOP: 2,
        BOTTOM: 3
    }

    class Cell {
        x
        y
        state = [true, true, true, true]
        color = "white"
        visited = false

        constructor(x, y) {
            this.x = x
            this.y = y
        }

        set(direction, state) {
            this.state[direction] = state;
        }

        draw(size, offsetX, offsetY) {
            let x = this.x * size + offsetX;
            let y = this.y * size + offsetY;

            ctx.fillStyle = this.color
            ctx.fillRect(x, y, size, size)

            if (this.state[Direction.LEFT]) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + size);
                ctx.stroke();
                ctx.closePath();
            }

            if (this.state[Direction.RIGHT]) {
                ctx.beginPath();
                ctx.moveTo(x + size, y);
                ctx.lineTo(x + size, y + size);
                ctx.stroke();
                ctx.closePath();
            }

            if (this.state[Direction.TOP]) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + size, y);
                ctx.stroke();
                ctx.closePath();
            }

            if (this.state[Direction.BOTTOM]) {
                ctx.beginPath();
                ctx.moveTo(x, y + size);
                ctx.lineTo(x + size, y + size);
                ctx.stroke();
                ctx.closePath();
            }
        }
    }

    function initializeGrid(width, height) {
        grid = []
        for (let x = 0; x < width; x++) {
            grid.push([])
            for (let y = 0; y < height; y++) {
                let cell = new Cell(x, y);
                grid[x].push(cell);
            }
        }

        grid[0][0].set(Direction.LEFT, false)
        grid[width-1][height-1].set(Direction.RIGHT, false)
    }

    function getOppositeDirection(direction) {
        switch (direction) {
            case Direction.LEFT:
                return Direction.RIGHT
            case Direction.RIGHT:
                return Direction.LEFT
            case Direction.TOP:
                return Direction.BOTTOM
            case Direction.BOTTOM:
                return Direction.TOP
        }
    }

    function updateText(element, id) {
        document.getElementById(id).innerHTML = element.value;
    }

    function getUnvisitedNeighbors(x, y, width, height) {
        let neighbors = [null, null, null, null]
        if (x > 0 && !grid[x-1][y].visited) {
            neighbors[Direction.LEFT] = grid[x-1][y];
        }
        if (x < width - 1 && !grid[x+1][y].visited) {
            neighbors[Direction.RIGHT] = grid[x+1][y];
        }
        if (y > 0 && !grid[x][y-1].visited) {
            neighbors[Direction.TOP] = grid[x][y-1];
        }
        if (y < height - 1 && !grid[x][y+1].visited) {
            neighbors[Direction.BOTTOM] = grid[x][y+1];
        }

        let hasNeighbors = false
        for (let neighbor of neighbors) {
            if (neighbor != null) {
                hasNeighbors = true
            }
        }

        return !hasNeighbors ? false : neighbors;
    }

    function drawMaze(width, height, frameTime) {
        console.log(width + " " + height)
        initializeGrid(width, height)
        if (mazeBuildingSimulation) {
            clearTimeout(mazeBuildingSimulation);
        }

        let current = grid[0][0]
        current.visited = true;
        let path = [current]

        // Pick random adjacent cell
        mazeBuildingSimulation = setInterval(function () {
            let current = path.pop()

            // If unvisited neighbors, pick a random neighbor and add it to the stack
            let neighbors = getUnvisitedNeighbors(current.x, current.y, width, height)
            if (neighbors) {
                let neighbor, rand
                do {
                    rand = Math.floor(Math.random() * 4)
                    neighbor = neighbors[rand]
                } while (!neighbor)

                current.set(rand, false)
                neighbor.set(getOppositeDirection(rand), false)
                neighbor.visited = true
                path.push(current)
                path.push(neighbor)
            }

            if (path.length === 0) {
                clearTimeout(mazeBuildingSimulation)
                console.log(grid)
                return
            }

            current.color = "lime"
            path[path.length - 1].color = "red"

        }, frameTime);
    }

    function gameLoop(currentTimeStamp) {
        let timeSinceLastFrame = (currentTimeStamp - prevTimeStamp) / 1000
        document.getElementById("fps").innerHTML = `FPS: ${Math.round(1 / timeSinceLastFrame)}`
        prevTimeStamp = currentTimeStamp

        // Clear previous frame
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)

        if (grid) {
            let width = grid.length;
            let height = grid[0].length;
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    grid[x][y].draw(size, (canvasWidth - width * size) / 2, (canvasHeight - height * size) / 2)
                }
            }
        }

        window.requestAnimationFrame(gameLoop)
    }


    //Mouse Input Coordinates
    let xCoord = 0
    let yCoord = 0
    function getCursorPosition(canvas, event) {
        const rect = canvas.getBoundingClientRect()
        xCoord = event.clientX - rect.left
        yCoord = event.clientY - rect.top
        document.getElementById("coordinateValues").innerHTML = "Coordinates - x: "+xCoord+", y: "+yCoord
    }

    canvas.addEventListener('mousemove', function(e) { getCursorPosition(canvas, e)})

    drawButton.addEventListener('click', () => {
         drawMaze(widthSlider.value, heightSlider.value, frameTimeText.value);
    });

    widthSlider.addEventListener("input", (event) => {
        updateText(widthSlider, 'widthText')
    });

    heightSlider.addEventListener("input", (event) => {
        updateText(heightSlider, 'heightText')
    });

    window.requestAnimationFrame(gameLoop)
}
