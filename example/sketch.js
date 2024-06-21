function my_kara(kara) {
    while (!kara.mushroomFront()) {
      if (kara.treeFront()) {
        kara.turnRight();
      } else {
        kara.move();
      }
    }
  }
  