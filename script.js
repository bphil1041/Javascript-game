window.addEventListener('load', function () {
    //canvas setup
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1500;
    canvas.height = 500;

    class InputHandler {

    }
    class Projectile {

    }
    class Particle {

    }
    class Player {
        constructor(game) {
            this.game = this.game;
            this.width = 120;
            this.height = 190;
            this.x = 20;
            this.y = 100;
            this.y += this.speedY;
        }
        update() {
            this.y += this.speedY;
        }
        draw(context) {
            context.fillRect(this.x, this.y, this.width, this.height);
        }


    }
    class Enemy {

    }
    class Layer {

    }
    class Background {

    }
    class UI {

    }
    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.player = new Player(this);
        }
        update() {
            this.player.update();
        }
        draw() {
            this.player.draw(context);
        }
    }

    const game = new Game(canvas.width, canvas.height);

});