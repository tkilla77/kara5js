// Define the world:
// T: Tree
// M: Mushroom
// C: Clover leaf
// <^>v: Kara start position and direction.
// ' ' or _: Empty cell
const game = Game.fromStringSpec(
    `TTTTTTTTT
     T       T
     T  C    T
     T >   T T
     T       T
     M       T
     T    T  T
     T       T
     TTTTTTTTT`);
// Optionally: Provide a global kara variable in case client
// function misses the parameter...
const kara = game.getRecorder();
const CELL_SIZE = 50;

// Processing setup function.
function setup() {
    createCanvas(CELL_SIZE * 9, CELL_SIZE * 9);
    // Call the client-provided 'my_kara(Kara)' function and
    // execute it with a 500ms stepping delay. Both parameters
    // have these values as default.
    game.executeKara(500, my_kara);
}

// Processing single screen redraw function.
function draw() {
    // Use processing functions to translate or rotate the game.
    game.draw(CELL_SIZE);
}

/* Optional: Manual movement handler. */
function keyPressed() {
    return game.keyPressed();
}
  