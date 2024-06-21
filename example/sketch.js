// Define the world and install with processing:
// T: Tree
// M: Mushroom
// C: Clover leaf
// <^>v: Kara start position and direction.
// ' ' or _: Empty cell
let game = KaraWorld.create(
    `TTTTTTTTT
     T       T
     T  C    T
     T >   T T
     T       T
     M       T
     T    T  T
     T       T
     TTTTTTTTT`);

function my_kara(kara) {
    while (!kara.mushroomFront()) {
        if (kara.treeFront()) {
            kara.turnRight();
        } else {
            kara.move();
        }
    }
}
