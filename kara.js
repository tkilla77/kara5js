
function assert(condition, error = "Error") {
  if (!condition) {
    throw new Error(error);
  }
}

const CELL_SIZE = 25;
const GRID_SIZE = [8, 8];

/** 2D grid cell coordinates. */
class Coordinates {
  static fromXy(x, y) {
    return new Coordinates(x, y);
  }
  
  static fromCopy(coords) {
    return new Coordinates(coords.x, coords.y);
  }
  
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  
  add(coords) {
    return Coordinates.fromXy(this.x + coords.x, this.y + coords.y);
  }
  
  move(direction) {
    return direction.apply(this);
  }

  toString() {
    return `[${this.x}, ${this.y}]`;
  }
}

/** A 2D grid direction. */
class Direction {
  constructor(name, x, y, angle) {
    this.name = name;
    this.coords = Coordinates.fromXy(x, y);
    this.angle = angle;
  }
  apply(coords) {
    return coords.add(this.coords);
  }
  toString() {
    return this.name;
  }
}

function createDirections() {
  let up = new Direction("↑", 0, -1, 0);
  let down = new Direction("↓", 0, 1, Math.PI);
  let right = new Direction("→", 1, 0, Math.PI/2);
  let left = new Direction("←", -1, 0, -Math.PI/2);
  up.left = left;
  up.right = right;
  left.left = down;
  left.right = up;
  down.left = right;
  down.right = left;
  right.left = up;
  right.right = down;
  return Object.freeze({
    UP: up,
    DOWN: down,
    RIGHT: right,
    LEFT: left,
  })
}

const Directions = createDirections();


class Cell {
  static fromString(spec) {
    switch(spec) {
      case " ":
      case "_":
        return Cells.EMPTY;
      case "T":
      case "🌳":
        return Cells.TREE;
      case "B":
      case "🐞":
        return Cells.BUG;
      case "M":
      case "🍄":
        return Cells.MUSHROOM;
      case "C":
      case "🍀":
        return Cells.CLOVER;
      default:
        return new Cell(spec);
    }
  }
  constructor(display="?", type=EMPTY) {
    this.display= display;
    this.type = type;
  }
  
  draw(x, y) {
    text(this.display, x, y);
  }
  
  toString() {
    return this.type;
  }
}

const Cells = Object.freeze({
  EMPTY: new Cell(" ", "_"),
  TREE: new Cell("🌳", "T"),
  BUG: new Cell("🐞", "B"),
  MUSHROOM: new Cell("🍄", "M"),
  CLOVER: new Cell("🍀", "C"),
});

const EMPTY_GRID_SPEC =
  `TTTTTTTTT
   T       T
   T       T
   T       T
   T       T
   T       T
   T       T
   T       T
   TTTTTTTTT`;

/** A 2d Kara-like game grid. */
class Grid {
  /** Creates a new grid from another one, copying all state. */
  static copy(grid) {
    return Grid.fromStringSpec(grid.toString());
  }
  
  /** Creates a new grid from a single, multi-line text spec.
      Lines are trimmed, so they must start with a non-whitespace
      cell (or '_'). */
  static fromStringSpec(spec) {
    let lines = spec.split(/\r?\n/g);
    for (let i = 0; i < lines.length; i++) {
      lines[i] = lines[i].trim();
    }
    return Grid.fromStringArray(lines);
  }
  
  /** Creates a new grid from a list of lines, top to bottom.
      Each line must have the same number of characters as the first.
      Lines are not trimmed. */
  static fromStringArray(lines) {
    // Use iterator based string decomposition to handle all code points.
    let width = [...lines[0]].length; 
    let height = lines.length;
    let grid = new Grid([width, height]);
    let y = 0
    for (let line of lines) {
      assert([...line].length == width, `Unexpected grid spec, line ${y} has length ${[...line].length}, expected ${width} `);
      let x = 0;
      for (let cellspec of line) {
        let cell = Cell.fromString(cellspec);
        let coords = Coordinates.fromXy(x, y);
        //console.log(`inserting ${cell} for ${cellspec} at ${coords}`);
        grid.set(coords, cell);
        x++;
      }
      y++;
    }
    return grid;
  }
  
  constructor(size = GRID_SIZE) {
    assert(size[0] >= 1 && size[1] >= 1, `unexpected grid size: ${size}`);
    this.size = [...size]; // defensive clone
    let line = Array(this.size[0]).fill(Cells.EMPTY);
    this.grid = Array(this.size[1]);
    for (let y = 0; y < this.grid.length; y++) {
      this.grid[y] = Array.from(line);
    }
  }
  
  /** Returns the cell at the given coordinates. */
  at(coords) {
    return this.grid[coords.y][coords.x];
  }
  
  /** Sets the cell at the given coordinates. */
  set(coords, cell) {
    this.grid[coords.y][coords.x] = cell;
  }

  /** Clears the cell at the given coordinates. */
  clear(coords) {
    this.grid[coords.y][coords.x] = Cells.EMPTY;
  }
  
  /** Draws the grid using processing primitives, from the given 
      upper-left corner and using the given cell size, both in pixels. */
  draw(cell_size) {
    push();
    stroke('rgba(115,115,115,0.5)');
    textAlign(CENTER, CENTER);
    
    for (let y = 0; y < this.grid.length; y++) {
      let line = this.grid[y];
      for (let x = 0; x < line.length; x++) {
        let cell = this.at(Coordinates.fromXy(x, y));
        push();
        translate(x * cell_size, y* cell_size);
        square(0, 0, cell_size);
        // Processing coords grow from upper-left to lower-right.
        // We use textAlign(CENTER, CENTER), so specify midpoint.
        translate(0.5*cell_size, 0.5*cell_size);
        cell.draw(0, 0);
        pop();
      }
    }
    pop();
  }
    
  toString() {
    return this.grid.map(line => line.map(cell => cell.toString()).join("")).join("\n");
  }
}


/** The Kara lady beetle implementation on top of the grid. */
class Kara {
  constructor(grid, coords=Coordinates.fromXy(1,1), direction = Directions.RIGHT) {
    this.grid = grid;
    this.direction = direction;
    this.coords = Coordinates.fromCopy(coords);
  }
  draw(cell_size) {
    push();
    translate((this.coords.x+0.5)*cell_size, (this.coords.y+0.5)*cell_size);
    rotate(this.direction.angle);
    textAlign(CENTER, CENTER);
    text(Cells.BUG.display, 0, 0);
    pop();
  }
  _cell(coords) {
    try {
      return this.grid.at(coords);
    } catch (Exception) {
      // ignore illegal direction
      return undefined;
    }
  }
  treeFront() {
    return this._cell(this.direction.apply(this.coords)) == Cells.TREE;
  }
  treeLeft() {
    return this._cell(this.direction.left.apply(this.coords)) == Cells.TREE;    
  }
  treeRight() {
    return this._cell(this.direction.right.apply(this.coords)) == Cells.TREE;    
  }
  mushroomFront() {
    return this._cell(this.direction.apply(this.coords)) == Cells.MUSHROOM;    
  }
  onLeaf() {
    return this._cell(this.coords) == Cells.CLOVER;    
  }
  _isMoveableDestination(destination) {
    let cell = this._cell(destination);
    //console.log(`Cell at ${destination} is ${cell}`);
    return cell != undefined && cell != Cells.TREE;
  }
  _canMove(direction = undefined) {
    if (!direction) {
      direction = this.direction;
    }
    return this._isMoveableDestination(this.coords.move(direction));
  }
  move() {
    if (this._canMove()) {
      let dest = this.coords.move(this.direction);
      this.coords = dest;
    } else {
      throw new Error(`Unable to move from ${this.coords} in direction ${this.direction}!`);
    }
  }
  turnLeft() {
    this.direction = this.direction.left;
  }
  turnRight() {
    this.direction = this.direction.right;
  }
  putLeaf() {
    // shall we check for MUSHROOM or replace it?
    this.grid.set(this.coords, Cells.CLOVER);
  }
  removeLeaf() {
    if (this.grid.at(this.coords) == Cells.CLOVER) {
      this.grid.clear(this.coords);
    }
  }
}


/** A Kara decorator that delays actions (but not sensors) in order to
    allow for stepping replay. */
class KaraStepper {
  constructor(kara, delay_ms=500) {
    this.kara = kara;
    this.delay = delay_ms;
  }
  
  sleeper() {
    return new Promise(resolve => setTimeout(() => resolve(), this.delay));
  }
  
  treeFront() {
    return this.kara.treeFront();
  }
  treeLeft() {
    return this.kara.treeLeft();
  }
  treeRight() {
    return this.kara.treeRight();    
  }
  mushroomFront() {
    return this.kara.mushroomFront();    
  }
  onLeaf() {
    return this.kara.onLeaf();    
  }
  async move() {
    await this.sleeper();
    this.kara.move();  
  }
  async turnLeft() {
    await this.sleeper();
    this.kara.turnLeft();
  }
  async turnRight() {
    await this.sleeper();
    this.kara.turnRight();
  }
  async putLeaf() {
    await this.sleeper();
    this.kara.putLeaf();
  }
  async removeLeaf() {
    await this.sleeper();
    this.kara.removeLeaf();
  }
}

/** A Kara decorator that records actions (but not sensor requests) in
    addition to executing them, for later replay, for example using an
    async KaraStepper. */
class KaraRecorder {
  constructor(target) {
    this.kara = target;
    this.commands = Array();
  }
  async replay(target) {
    for (let command of this.commands) {
      await target[command]();
    }
  }

  treeFront() {
    return this.kara.treeFront();
  }
  treeLeft() {
    return this.kara.treeLeft();
  }
  treeRight() {
    return this.kara.treeRight();    
  }
  mushroomFront() {
    return this.kara.mushroomFront();    
  }
  onLeaf() {
    return this.kara.onLeaf();    
  }
  move() {
    this.kara.move();
    this.commands.push(this.move.name);
  }
  turnLeft() {
    this.kara.turnLeft();
    this.commands.push(this.turnLeft.name);
  }
  turnRight() {
    this.kara.turnRight();
    this.commands.push(this.turnRight.name);
  }
  putLeaf() {
    this.kara.putLeaf();
    this.commands.push(this.putLeaf.name);
  }
  removeLeaf() {
    this.kara.removeLeaf();
    this.commands.push(this.removeLeaf.name);
  }
}

/** A Kara game including a game grid and one Kara beetle. */
class Game {
  static fromStringSpec(kara_coords=Coordinates.fromXy(1,1), kara_direction=Directions.RIGHT, gridspec=EMPTY_GRID_SPEC) {
    let grid = Grid.fromStringSpec(gridspec);
    let kara = new Kara(grid, kara_coords, kara_direction);
    return new Game(grid, kara);
  }
  constructor(grid, kara) {
    this.grid = grid;
    this.kara = kara;
  }
  draw(cell_size) {
    push();
    textSize(cell_size*0.8);
    this.grid.draw(cell_size)
    this.kara.draw(cell_size);
    pop();    
  }
  
  createRecorder() {
    let gridCopy = Grid.copy(this.grid);
    let karaCopy = Object.create(this.kara);
    karaCopy.grid = gridCopy;
    let recorder = new KaraRecorder(karaCopy);
    return recorder;
  }
  
  /** Executes the well-known client-side 'my_kara(Kara)' function and 
      record its actions, then replay in async, delayed mode using
      KaraStepper.
      <p>This function assumes a deterministic world where each set of
      commands executed in the same order results in the same outcome. */
  async executeKara(recorder, delay_ms, client_function=my_kara) {
    // TODO check if my_kara is defined.
    client_function(recorder); // call well-known function in client-code
    let stepper = new KaraStepper(this.kara, delay_ms); 
    return recorder.replay(stepper);
  }
  
  /** A key-handler for manual Kara movement. */
  keyPressed() {
    if (keyCode == UP_ARROW) {
      this.kara.move();
      return false;
    } else if (keyCode == LEFT_ARROW) {
      this.kara.turnLeft();
      return false;
    } else if (keyCode == RIGHT_ARROW) {
      this.kara.turnRight();
      return false;
    } else if (keyCode == DOWN_ARROW) {
      if (this.kara.onLeaf()) {
        this.kara.removeLeaf();
      } else {
        this.kara.putLeaf();
      }
      return false;
    }
  }  
}
