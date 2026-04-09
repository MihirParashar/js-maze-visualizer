//Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
window.onload = () => {
    const canvas = document.getElementById("canvas")
    const ctx = canvas.getContext("2d")
    const canvasWidth = 600
    const canvasHeight = 600

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
    const algorithmSelect = document.getElementById("algorithm")
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

            ctx.strokeStyle = "#222222"
            ctx.lineWidth = 2

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

    // Initialize grid with all walls removed (open grid) for recursive division
    function initializeOpenGrid(width, height) {
        grid = []
        for (let x = 0; x < width; x++) {
            grid.push([])
            for (let y = 0; y < height; y++) {
                let cell = new Cell(x, y);
                cell.state = [false, false, false, false]
                grid[x].push(cell);
            }
        }

        // Add border walls
        for (let x = 0; x < width; x++) {
            grid[x][0].set(Direction.TOP, true)
            grid[x][height-1].set(Direction.BOTTOM, true)
        }
        for (let y = 0; y < height; y++) {
            grid[0][y].set(Direction.LEFT, true)
            grid[width-1][y].set(Direction.RIGHT, true)
        }

        // Entrance and exit
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

    function getAllNeighbors(x, y, width, height) {
        let neighbors = [null, null, null, null]
        if (x > 0) neighbors[Direction.LEFT] = grid[x-1][y]
        if (x < width - 1) neighbors[Direction.RIGHT] = grid[x+1][y]
        if (y > 0) neighbors[Direction.TOP] = grid[x][y-1]
        if (y < height - 1) neighbors[Direction.BOTTOM] = grid[x][y+1]
        return neighbors
    }

    function stopSimulation() {
        if (mazeBuildingSimulation) {
            clearInterval(mazeBuildingSimulation)
            mazeBuildingSimulation = null
        }
    }

    function resetCellColors() {
        if (!grid) return
        for (let x = 0; x < grid.length; x++) {
            for (let y = 0; y < grid[0].length; y++) {
                grid[x][y].color = grid[x][y].visited ? "#90ee90" : "white"
            }
        }
    }

    function drawMazeRecursiveBacktracking(width, height, frameTime) {
        initializeGrid(width, height)

        // Start with top-left cell
        let current = grid[0][0]
        current.visited = true;
        current.color = "#90ee90"
        let path = [current]

        mazeBuildingSimulation = setInterval(function () {
            current.color = "#90ee90"
            let current2 = path.pop()

            // If unvisited neighbors exist, pick a random one and carve a passage
            let neighbors = getUnvisitedNeighbors(current2.x, current2.y, width, height)
            if (neighbors) {
                let neighbor, rand
                do {
                    rand = Math.floor(Math.random() * 4)
                    neighbor = neighbors[rand]
                } while (!neighbor)

                current2.set(rand, false)
                neighbor.set(getOppositeDirection(rand), false)
                neighbor.visited = true
                neighbor.color = "#90ee90"
                path.push(current2)
                path.push(neighbor)
            }

            // If the stack is empty, the maze is fully generated
            if (path.length === 0) {
                resetCellColors()
                stopSimulation()
                return
            }

            // Color coding
            current = path[path.length - 1]
            current.color = "#ff6b6b"
            if (path.length > 1) path[path.length - 2].color = "#90ee90"

        }, frameTime);
    }

    function drawMazePrims(width, height, frameTime) {
        initializeGrid(width, height)

        // Start from a random cell
        let startX = Math.floor(Math.random() * width)
        let startY = Math.floor(Math.random() * height)
        grid[startX][startY].visited = true
        grid[startX][startY].color = "#90ee90"

        // Collect frontier walls: {cell, neighbor, direction}
        let walls = []
        function addWalls(x, y) {
            let neighbors = getAllNeighbors(x, y, width, height)
            for (let dir = 0; dir < 4; dir++) {
                if (neighbors[dir] && !neighbors[dir].visited) {
                    walls.push({ cell: grid[x][y], neighbor: neighbors[dir], direction: dir })
                }
            }
        }

        addWalls(startX, startY)

        mazeBuildingSimulation = setInterval(function () {
            if (walls.length === 0) {
                resetCellColors()
                stopSimulation()
                return
            }

            // Pick a random wall from the list
            let idx = Math.floor(Math.random() * walls.length)
            let wall = walls[idx]
            walls.splice(idx, 1)

            // If the neighbor hasn't been visited, carve a passage
            if (!wall.neighbor.visited) {
                wall.cell.set(wall.direction, false)
                wall.neighbor.set(getOppositeDirection(wall.direction), false)
                wall.neighbor.visited = true

                wall.cell.color = "#90ee90"
                wall.neighbor.color = "#ff6b6b"

                addWalls(wall.neighbor.x, wall.neighbor.y)
            }

            // Color frontier cells
            for (let w of walls) {
                if (!w.neighbor.visited) {
                    w.neighbor.color = "#c8f7c8"
                }
            }

        }, frameTime)
    }

    function drawMazeKruskals(width, height, frameTime) {
        initializeGrid(width, height)

        // Union-Find data structure
        let parent = []
        let rank = []
        let totalCells = width * height

        function cellId(x, y) { return x * height + y }

        for (let i = 0; i < totalCells; i++) {
            parent[i] = i
            rank[i] = 0
        }

        function find(i) {
            while (parent[i] !== i) {
                parent[i] = parent[parent[i]]
                i = parent[i]
            }
            return i
        }

        function union(a, b) {
            let rootA = find(a)
            let rootB = find(b)
            if (rootA === rootB) return false
            if (rank[rootA] < rank[rootB]) { let t = rootA; rootA = rootB; rootB = t }
            parent[rootB] = rootA
            if (rank[rootA] === rank[rootB]) rank[rootA]++
            return true
        }

        // Build list of all internal walls and shuffle
        let edges = []
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (x < width - 1) edges.push({ x1: x, y1: y, x2: x+1, y2: y, dir: Direction.RIGHT })
                if (y < height - 1) edges.push({ x1: x, y1: y, x2: x, y2: y+1, dir: Direction.BOTTOM })
            }
        }

        // Fisher-Yates shuffle
        for (let i = edges.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [edges[i], edges[j]] = [edges[j], edges[i]]
        }

        let edgeIndex = 0

        mazeBuildingSimulation = setInterval(function () {
            if (edgeIndex >= edges.length) {
                resetCellColors()
                stopSimulation()
                return
            }

            let edge = edges[edgeIndex++]
            let idA = cellId(edge.x1, edge.y1)
            let idB = cellId(edge.x2, edge.y2)

            if (union(idA, idB)) {
                grid[edge.x1][edge.y1].set(edge.dir, false)
                grid[edge.x2][edge.y2].set(getOppositeDirection(edge.dir), false)

                grid[edge.x1][edge.y1].color = "#90ee90"
                grid[edge.x2][edge.y2].color = "#ff6b6b"
            } else {
                grid[edge.x1][edge.y1].color = "#c8f7c8"
                grid[edge.x2][edge.y2].color = "#c8f7c8"
            }

        }, frameTime)
    }

    function drawMazeAldousBroder(width, height, frameTime) {
        initializeGrid(width, height)

        let totalCells = width * height
        let visitedCount = 1
        let current = grid[Math.floor(Math.random() * width)][Math.floor(Math.random() * height)]
        current.visited = true
        current.color = "#90ee90"

        mazeBuildingSimulation = setInterval(function () {
            if (visitedCount >= totalCells) {
                resetCellColors()
                stopSimulation()
                return
            }

            current.color = current.visited ? "#90ee90" : "white"

            // Pick a random neighbor (any direction)
            let neighbors = getAllNeighbors(current.x, current.y, width, height)
            let validDirs = []
            for (let dir = 0; dir < 4; dir++) {
                if (neighbors[dir]) validDirs.push(dir)
            }
            let dir = validDirs[Math.floor(Math.random() * validDirs.length)]
            let neighbor = neighbors[dir]

            // If neighbor hasn't been visited, carve a passage
            if (!neighbor.visited) {
                current.set(dir, false)
                neighbor.set(getOppositeDirection(dir), false)
                neighbor.visited = true
                visitedCount++
                neighbor.color = "#90ee90"
            }

            current = neighbor
            current.color = "#ff6b6b"

        }, frameTime)
    }

    function drawMazeRecursiveDivision(width, height, frameTime) {
        initializeOpenGrid(width, height)

        // Build a queue of division operations
        let operations = []

        function enqueueDivisions(minX, maxX, minY, maxY) {
            let w = maxX - minX + 1
            let h = maxY - minY + 1
            if (w < 2 && h < 2) return

            // Choose orientation: divide along the longer axis
            let horizontal
            if (w < 2) horizontal = true
            else if (h < 2) horizontal = false
            else horizontal = h >= w

            if (horizontal) {
                // Build a horizontal wall at a random y position
                if (h < 2) return
                let wallY = minY + Math.floor(Math.random() * (h - 1))  // wallY is the row above the wall line
                let passageX = minX + Math.floor(Math.random() * w)

                operations.push({ type: "hwall", minX, maxX, wallY, passageX })

                // Recurse on top and bottom halves
                enqueueDivisions(minX, maxX, minY, wallY)
                enqueueDivisions(minX, maxX, wallY + 1, maxY)
            } else {
                // Build a vertical wall at a random x position
                if (w < 2) return
                let wallX = minX + Math.floor(Math.random() * (w - 1))
                let passageY = minY + Math.floor(Math.random() * h)

                operations.push({ type: "vwall", minY, maxY, wallX, passageY })

                // Recurse on left and right halves
                enqueueDivisions(minX, wallX, minY, maxY)
                enqueueDivisions(wallX + 1, maxX, minY, maxY)
            }
        }

        enqueueDivisions(0, width - 1, 0, height - 1)

        let opIndex = 0

        mazeBuildingSimulation = setInterval(function () {
            if (opIndex >= operations.length) {
                resetCellColors()
                stopSimulation()
                return
            }

            let op = operations[opIndex++]

            if (op.type === "hwall") {
                // Add horizontal wall between row wallY and wallY+1
                for (let x = op.minX; x <= op.maxX; x++) {
                    if (x !== op.passageX) {
                        grid[x][op.wallY].set(Direction.BOTTOM, true)
                        grid[x][op.wallY + 1].set(Direction.TOP, true)
                        grid[x][op.wallY].color = "#c8f7c8"
                        grid[x][op.wallY + 1].color = "#c8f7c8"
                    } else {
                        grid[x][op.wallY].color = "#ff6b6b"
                        grid[x][op.wallY + 1].color = "#ff6b6b"
                    }
                }
            } else {
                // Add vertical wall between column wallX and wallX+1
                for (let y = op.minY; y <= op.maxY; y++) {
                    if (y !== op.passageY) {
                        grid[op.wallX][y].set(Direction.RIGHT, true)
                        grid[op.wallX + 1][y].set(Direction.LEFT, true)
                        grid[op.wallX][y].color = "#c8f7c8"
                        grid[op.wallX + 1][y].color = "#c8f7c8"
                    } else {
                        grid[op.wallX][y].color = "#ff6b6b"
                        grid[op.wallX + 1][y].color = "#ff6b6b"
                    }
                }
            }

        }, frameTime)
    }

    function drawMaze(width, height, frameTime, algorithm) {
        stopSimulation()

        switch (algorithm) {
            case "recursiveBacktracking":
                drawMazeRecursiveBacktracking(width, height, frameTime)
                break
            case "prims":
                drawMazePrims(width, height, frameTime)
                break
            case "kruskals":
                drawMazeKruskals(width, height, frameTime)
                break
            case "aldousBroder":
                drawMazeAldousBroder(width, height, frameTime)
                break
            case "recursiveDivision":
                drawMazeRecursiveDivision(width, height, frameTime)
                break
        }
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
    function getCursorPosition(canvas, event) {
        const rect = canvas.getBoundingClientRect()
        let xCoord = Math.round(event.clientX - rect.left)
        let yCoord = Math.round(event.clientY - rect.top)
        document.getElementById("coordinateValues").innerHTML = `x: ${xCoord}, y: ${yCoord}`
    }

    canvas.addEventListener('mousemove', function(e) { getCursorPosition(canvas, e) })

    drawButton.addEventListener('click', () => {
         drawMaze(widthSlider.value, heightSlider.value, frameTimeText.value, algorithmSelect.value);
    });

    widthSlider.addEventListener("input", (event) => {
        updateText(widthSlider, 'widthText')
    });

    heightSlider.addEventListener("input", (event) => {
        updateText(heightSlider, 'heightText')
    });

    window.requestAnimationFrame(gameLoop)
}
