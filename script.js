window.addEventListener('load', function () {
    //canvas setup
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1500;
    canvas.height = 500;

    class InputHandler {
        constructor(game) {
            this.game = game;
            this.game.isFiring = false; // New property to track whether the player is firing

            window.addEventListener('keydown', e => {
                if (['w', 's', 'a', 'd'].includes(e.key) &&
                    this.game.keys.indexOf(e.key) === -1) {
                    this.game.keys.push(e.key);
                }
            });

            window.addEventListener('keyup', e => {
                if (this.game.keys.indexOf(e.key) > -1) {
                    this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
                }
            });

            window.addEventListener('mousedown', e => {
                this.game.isFiring = true;
                this.fireProjectiles(e.clientX, e.clientY);
            });

            window.addEventListener('mouseup', () => {
                this.game.isFiring = false;
            });

            window.addEventListener('mousemove', e => {
                this.game.player.updateAim(e.clientX, e.clientY);
            });
        }

        fireProjectiles(mouseX, mouseY) {
            if (this.game.ammo > 0) {
                const projectileSpeed = 15;
                const canvasRect = canvas.getBoundingClientRect();
                const adjustedMouseX = mouseX - canvasRect.left;
                const adjustedMouseY = mouseY - canvasRect.top - this.game.player.height / 2;

                const angle = Math.atan2(adjustedMouseY - this.game.player.y, adjustedMouseX - this.game.player.x);
                this.game.player.projectiles.push(new Projectile(this.game, this.game.player.x + this.game.player.width / 2, this.game.player.y + this.game.player.height / 2, angle, projectileSpeed));
                this.game.ammo--;

                if (this.game.isFiring) {
                    // Calculate the new angle based on the current mouse position
                    const newAngle = Math.atan2(adjustedMouseY - this.game.player.y, adjustedMouseX - this.game.player.x);

                    // Update the angle for the last projectile (most recent one)
                    const lastProjectile = this.game.player.projectiles[this.game.player.projectiles.length - 1];
                    lastProjectile.angle = newAngle;

                    // Continue firing while the mouse button is held down
                    setTimeout(() => this.fireProjectiles(mouseX, mouseY), 100); // Adjust the firing rate if needed
                }
            }
        }
    }

    class Projectile {
        constructor(game, x, y, angle, speed) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.angle = angle; // Store the angle for later use
            this.width = 50;
            this.height = 10;
            this.speedX = Math.cos(angle) * speed;
            this.speedY = Math.sin(angle) * speed;
            this.markedForDeletion = false;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > this.game.width * 0.99 || this.y < 0 || this.y > this.game.height) {
                this.markedForDeletion = true;
            }
        }

        draw(context) {
            // Create a fiery radial gradient
            const gradient = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.width);
            gradient.addColorStop(0, 'rgba(255, 165, 0, 1)'); // Orange
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');   // Transparent red

            // Draw the projectile with the fiery gradient
            context.fillStyle = gradient;
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    class Particle { }

    class Player {
        constructor(game) {
            this.game = game;
            this.width = 50;
            this.height = 75;
            this.x = 20;
            this.y = 100;
            this.speedX = 0;
            this.speedY = 0;
            this.maxSpeed = 4;
            this.projectiles = [];
            this.gravity = 0.2;
            this.isJumping = false;
            this.jumpHeight = -10;
            this.aimDirection = 0; // New property to store the aim direction
        }

        update() {
            // Handle jumping mechanic
            if (this.game.keys.includes('w') && !this.isJumping) {
                this.speedY = this.jumpHeight;
                this.isJumping = true;
            }

            // Apply gravity
            this.speedY += this.gravity;

            // Handle left/right movement
            if (this.game.keys.includes('a')) {
                this.speedX = -this.maxSpeed;
            } else if (this.game.keys.includes('d')) {
                this.speedX = this.maxSpeed;
            } else {
                this.speedX = 0;
            }

            // Update player position
            this.x += this.speedX;
            this.y += this.speedY;

            // Ensure player stays within the canvas boundaries
            this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
            this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));

            // Check if player is on the ground to allow jumping again
            if (this.y >= canvas.height - this.height) {
                this.isJumping = false;
            }

            // Update projectiles
            this.projectiles.forEach(projectile => {
                projectile.update();
            });
            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
        }

        draw(context) {
            context.fillStyle = 'black';
            context.fillRect(this.x, this.y, this.width, this.height);

            // Render projectiles
            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            });
        }

        // New method to update player's aim direction based on mouse position
        updateAim(mouseX, mouseY) {
            this.aimDirection = Math.atan2(mouseY - this.y, mouseX - this.x);
        }

        // Modify shootTop to fire projectiles directly at the mouse cursor
        shootTop(mouseX, mouseY) {
            if (this.game.ammo > 0) {
                const projectileSpeed = 15;

                // Adjust for the canvas position on the page
                const canvasRect = canvas.getBoundingClientRect();
                const adjustedMouseX = mouseX - canvasRect.left;
                const adjustedMouseY = mouseY - canvasRect.top - this.height / 2; // Subtract half of the player's height

                const angle = Math.atan2(adjustedMouseY - this.y, adjustedMouseX - this.x);
                this.projectiles.push(new Projectile(this.game, this.x + this.width / 2, this.y + this.height / 2, angle, projectileSpeed));
                this.game.ammo--;
            }
        }
    }


    class Enemy {
        constructor(game) {
            this.game = game;
            this.x = this.game.width;
            this.speedX = Math.random() * -1.5 - 0.5;
            this.markedForDeletion = false;
            this.lives = 3;
            this.score = this.lives;
        }

        update() {
            this.x += this.speedX;
            if (this.x + this.width < 0) this.markedForDeletion = true;
        }

        draw(context) {
            context.fillStyle = 'red';
            context.fillRect(this.x, this.y, this.width, this.height);
            context.fillStyle = 'black';
            context.font = '20 Helvetica';
            context.fillText(this.lives, this.x, this.y);
        }
    }

    class Angler1 extends Enemy {
        constructor(game) {
            super(game);
            //dimensions of enemy sprite
            this.width = 228 * 0.2;
            this.height = 169 * 0.2;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
        }
    }

    class Layer { }

    class Background { }

    class UI {
        constructor(game) {
            this.game = game;
            this.fontSize = 25;
            this.fontFamily = 'Helvetica';
            this.color = 'white';
        }

        draw(context) {
            context.save();
            context.fillStyle = this.color;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.shadowColor = 'black';
            context.font = this.fontSize + 'px ' + this.fontFamily;
            //score
            context.fillText('Score: ' + this.game.score, 20, 40);
            //ammo
            for (let i = 0; i < this.game.ammo; i++) {
                context.fillRect(20 + 5 * i, 50, 3, 20);
            }
            //game over messages
            if (this.game.gameOver) {
                context.textAlign = 'center'; // Fix typo: '=' instead of '='
                let message1;
                let message2;
                if (this.game.score > this.game.winningScore) {
                    message1 = 'Victory!';
                    message2 = 'Congratulations!';
                } else {
                    message1 = 'Defeat!';
                    message2 = 'Dare to try again?';
                }
                context.font = '50px ' + this.fontFamily;
                context.fillText(message1, this.game.width * 0.5, this.game.height * 0.5 - 40);
                context.font = '25px ' + this.fontFamily;
                context.fillText(message2, this.game.width * 0.5, this.game.height * 0.5 + 40);
            }

            context.restore();
        }
    }

    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.ui = new UI(this);
            this.keys = [];
            this.enemies = [];
            this.enemyTimer = 0;
            this.enemyInterval = 1000;
            this.ammo = 20;
            this.maxAmmo = 50;
            this.ammoTimer = 0;
            this.ammoInterval = 150;
            this.gameOver = false;
            this.score = 0;
            this.winningScore = 10;
        }

        update(deltaTime) {
            this.player.update();
            if (this.ammoTimer > this.ammoInterval) {
                if (this.ammo < this.maxAmmo) this.ammo++;
                this.ammoTimer = 0;
            } else {
                this.ammoTimer += deltaTime;
            }
            this.enemies.forEach(enemy => {
                enemy.update();
                if (this.checkCollision(this.player, enemy)) {
                    enemy.markedForDeletion = true;
                }
                this.player.projectiles.forEach(projectile => {
                    if (this.checkCollision(projectile, enemy)) {
                        enemy.lives--;
                        projectile.markedForDeletion = true;
                        if (enemy.lives <= 0) {
                            enemy.markedForDeletion = true;
                            this.score += enemy.score;
                            if (this.score > this.winningScore) this.gameOver = true;
                        }
                    }
                })
            });
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
            if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }
        }

        draw(context) {
            this.player.draw(context);
            this.ui.draw(context);
            this.enemies.forEach(enemy => {
                enemy.draw(context);
            });
        }

        addEnemy() {
            this.enemies.push(new Angler1(this));
        }

        checkCollision(rect1, rect2) {
            return (
                rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.y + rect1.height > rect2.y
            );
        }
    }

    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;
    //animate loop
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update(deltaTime);
        game.draw(ctx);
        requestAnimationFrame(animate);
    }


    animate(0);
});
