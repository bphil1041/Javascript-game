window.addEventListener('load', function () {
    // Canvas setup
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 2000;
    canvas.height = 900;

    class InputHandler {
        constructor(game) {
            this.game = game;
            this.game.isFiring = false;
            this.continuousFireInterval = null;
            this.isJumping = false;
            this.cannonMode = false; // New property to track cannon mode

            window.addEventListener('keydown', e => {
                if (e.key === 'w') {
                    if (!this.isJumping) {
                        this.handleJump();
                    } else {
                        this.handleDecreaseGravity(true);
                    }
                } else if (e.key === '1') {
                    this.toggleCannonMode();
                } else if (['s', 'a', 'd'].includes(e.key) && this.game.keys.indexOf(e.key) === -1) {
                    this.game.keys.push(e.key);
                }
            });

            window.addEventListener('keyup', e => {
                if (e.key === 'w') {
                    this.isJumping = false;
                    this.handleRestoreGravity();
                } else if (this.game.keys.indexOf(e.key) > -1) {
                    this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
                }
            });

            window.addEventListener('mousedown', e => {
                this.game.isFiring = true;
                this.fireProjectiles(e.clientX, e.clientY);
                this.continuousFire();
            });

            window.addEventListener('mouseup', () => {
                this.game.isFiring = false;
                clearInterval(this.continuousFireInterval);
            });

            window.addEventListener('mousemove', e => {
                this.game.player.updateAim(e.clientX, e.clientY);
                this.game.input.mouseX = e.clientX;
                this.game.input.mouseY = e.clientY;
            });
        }

        fireProjectiles(mouseX, mouseY) {
            const numProjectiles = this.cannonMode ? 3 : 1;

            for (let i = 0; i < numProjectiles; i++) {
                if (this.game.ammo > 0 && this.game.isFiring) {
                    const projectileSpeed = 15;
                    const canvasRect = canvas.getBoundingClientRect();
                    const adjustedMouseX = mouseX - canvasRect.left;
                    const adjustedMouseY = mouseY - canvasRect.top - this.game.player.height / 2;

                    let angle = Math.atan2(adjustedMouseY - this.game.player.y, adjustedMouseX - this.game.player.x);

                    if (this.cannonMode) {
                        // Apply angle offset only in cannon mode
                        const angleOffset = (i - 1) * 0.1;  // Adjust the offset as needed
                        angle += angleOffset;
                    }

                    this.game.player.projectiles.push(new Projectile(this.game, this.game.player.x + this.game.player.width / 1.5, this.game.player.y + this.game.player.height / 2.2, angle, projectileSpeed));
                    this.game.ammo--;

                    if (this.game.player.y >= canvas.height - this.game.player.height) {
                        this.game.player.remainingJumps = this.game.player.maxJumps;
                    }
                }
            }
        }



        continuousFire() {
            // Clear any existing continuous fire interval
            clearInterval(this.continuousFireInterval);

            // Continuous firing at a fixed rate
            this.continuousFireInterval = setInterval(() => {
                this.fireProjectiles(this.game.input.mouseX, this.game.input.mouseY);
            }, this.cannonMode ? 30 : 50);  // Adjust firing rate for cannon mode
        }

        handleJump() {
            if (this.game.player.remainingJumps > 0) {
                this.game.player.speedY = this.game.player.jumpHeight;
                this.isJumping = true;
                this.game.player.remainingJumps--;

                if (this.game.player.y >= canvas.height - this.game.player.height) {
                    this.game.player.remainingJumps = this.game.player.maxJumps;
                }
            }
        }

        handleDecreaseGravity(wKeyPressed) {
            if (wKeyPressed) {
                this.game.player.gravity = 0.05;
            } else {
                this.game.player.gravity = 0.2;
            }
        }

        handleRestoreGravity() {
            this.game.player.gravity = 0.2;
        }

        toggleCannonMode() {
            this.cannonMode = !this.cannonMode;
            if (this.cannonMode) {
                this.displayCannonModeMessage(true);
            } else {
                this.displayCannonModeMessage(false);
            }
        }

        displayCannonModeMessage(active) {
            const cannonModeMessage = document.getElementById('cannonModeMessage');
            if (active) {
                cannonModeMessage.innerText = 'Cannon Mode Active';
            } else {
                cannonModeMessage.innerText = '';
            }
        }
    }





    class Projectile {
        constructor(game, x, y, angle, speed) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.angle = angle;
            this.width = 100;
            this.height = 75;
            this.speedX = Math.cos(angle) * speed;
            this.speedY = Math.sin(angle) * speed;
            this.markedForDeletion = false;
            this.image = document.getElementById('firebolt');
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > this.game.width * 0.99 || this.y < 0 || this.y > this.game.height) {
                this.markedForDeletion = true;
            }
        }

        draw(context) {
            context.save();
            context.translate(this.x, this.y);
            context.rotate(this.angle);
            context.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
            context.restore();
        }
    }


    class Particle { }

    class Player {
        constructor(game) {
            this.game = game;
            this.width = 96;
            this.height = 100;
            this.x = 64;
            this.y = 64;
            this.frameX = 0;
            this.frameY = 0; // Change to 0 initially
            this.maxFrame = 7;
            this.speedX = 0;
            this.speedY = 0;
            this.maxSpeed = 4;
            this.projectiles = [];
            this.gravity = 0.2;
            this.isJumping = false;
            this.jumpHeight = -10;
            this.aimDirection = 0;
            this.maxJumps = Infinity;
            this.remainingJumps = this.maxJumps; // New property for double jump
            this.facingLeft = false; // New property to track facing direction
            this.image = document.getElementById('player');
            this.animationCounter = 0;  // Counter for animation speed control
            this.animationSpeed = 7;   // Adjust this value for slower or faster animation
        }

        update() {
            // Handle jumping mechanic
            if (this.game.keys.includes('w')) {
                if (this.remainingJumps > 0 && !this.isJumping) {
                    this.speedY = this.jumpHeight;
                    this.isJumping = true;
                    this.remainingJumps--;
                }
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
            this.x = Math.max(0, Math.min(this.game.canvas.width - this.width, this.x));
            this.y = Math.max(0, Math.min(this.game.canvas.height - this.height, this.y));

            // Check if player is on the ground to allow jumping again
            if (this.y >= this.game.canvas.height - this.height) {
                this.isJumping = false;
                this.resetDoubleJump();
            }

            // Update projectiles
            this.projectiles.forEach(projectile => {
                projectile.update();
            });
            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

            // Sprite animation
            this.animationCounter++;
            if (this.animationCounter >= this.animationSpeed) {
                if (this.frameX < this.maxFrame) {
                    this.frameX++;
                } else {
                    this.frameX = 0;
                }
                this.animationCounter = 0;  // Reset the counter
            }

            // Update facing direction and frameY for animation
            this.updateFacingDirection();
        }

        draw(context) {
            const flipHorizontal = this.facingLeft || this.game.keys.includes('a');

            context.save();

            if (flipHorizontal) {
                context.scale(-1, 1);
            }

            context.drawImage(
                this.image,
                this.frameX * this.width,
                this.frameY * this.height,
                this.width,
                this.height,
                flipHorizontal ? -this.x - this.width : this.x,
                this.y,
                this.width,
                this.height
            );

            context.restore();

            // Render projectiles
            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            });
        }

        updateAim(mouseX, mouseY) {
            this.aimDirection = Math.atan2(mouseY - (this.y + this.height / 2), mouseX - (this.x + this.width / 2));
        }

        resetDoubleJump() {
            this.remainingJumps = this.maxJumps;
        }

        updateFacingDirection() {
            // Update facing direction and frameY based on horizontal movement
            if (this.game.keys.includes('a') || this.game.keys.includes('d')) {
                this.facingLeft = this.game.keys.includes('a');
                this.frameY = 1; // Set frameY to 1 for the second row of animation
            } else {
                this.frameY = 0; // Set frameY to 0 when not moving horizontally
            }
        }
    }










    class Enemy {
        constructor(game) {
            this.game = game;
            this.x = this.game.width;
            this.speedX = Math.random() * -1.5 - 0.5;
            this.markedForDeletion = false;
            this.lives = 10;
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

    class AnglerProjectile {
        constructor(game, x, y, angle, speed) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.angle = angle;
            this.width = 10;
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
            context.fillStyle = '#00ff22';
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    class Angler1 extends Enemy {
        constructor(game) {
            super(game);
            this.width = 228 * 0.2;
            this.height = 169 * 0.2;
            this.y = Math.random() * (this.game.height * 0.9 - this.height);
            this.projectiles = [];
            this.fireRate = 2000; // Time interval between shots in milliseconds
            this.lastFireTime = 0;
        }

        update() {
            super.update();

            // Check if it's time to fire a projectile
            const currentTime = Date.now();
            if (currentTime - this.lastFireTime > this.fireRate) {
                this.fireProjectile();
                this.lastFireTime = currentTime;
            }

            // Update projectiles
            this.projectiles.forEach(projectile => {
                projectile.update();
                if (this.game.checkCollision(projectile, this.game.player)) {
                    projectile.markedForDeletion = true;
                    // Handle damage to the player if needed
                    // Example: this.game.player.takeDamage();
                }
            });

            // Remove projectiles marked for deletion
            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
        }

        draw(context) {
            super.draw(context);

            // Render projectiles
            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            });
        }

        fireProjectile() {
            const projectileSpeed = 5; // Adjust the speed as needed
            const angle = Math.atan2(this.game.player.y - this.y, this.game.player.x - this.x);
            const offsetX = this.width / 2;
            const offsetY = this.height / 2;

            this.projectiles.push(new AnglerProjectile(this.game, this.x + offsetX, this.y + offsetY, angle, projectileSpeed));
        }
    }


    class Layer {
        constructor(game, image, speedModifier) {
            this.game = game;
            this.image = image;
            this.speedModifier = speedModifier;
            this.width = game.width;  // Set width to match the canvas width
            this.height = game.height; // Set height to match the canvas height
            this.x = 0;
            this.y = 0;
        }

        update() {
            if (this.x <= -this.width) this.x = 0;
            this.x -= this.game.speed * this.speedModifier;
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);  // Draw with specified width and height
            context.drawImage(this.image, this.x + this.width, this.y, this.width, this.height);
        }

    }

    class Background {
        constructor(game) {
            this.game = game;
            this.image1 = document.getElementById('layer1');
            this.image2 = document.getElementById('layer2');
            this.image3 = document.getElementById('layer3');
            this.layer1 = new Layer(this.game, this.image1, 0.15);
            this.layer2 = new Layer(this.game, this.image2, 0.5);
            this.layer3 = new Layer(this.game, this.image3, 1.3);
            this.layers = [this.layer1, this.layer2, this.layer3];
        }
        update() {
            this.layers.forEach(layer => layer.update());

        }
        draw(context) {
            this.layers.forEach(layer => layer.draw(context));
        }
    }

    class UI {
        constructor(game) {
            this.game = game;
            this.fontSize = 25;
            this.fontFamily = 'Helvetica';
            this.color = 'white';
            this.cannonModeMessage = '';
        }

        draw(context) {
            context.save();
            context.fillStyle = this.color;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.shadowColor = 'black';
            context.font = this.fontSize + 'px ' + this.fontFamily;

            context.fillText('Score: ' + this.game.score, 20, 40);

            for (let i = 0; i < this.game.ammo; i++) {
                context.fillRect(20 + 5 * i, 50, 3, 20);
            }

            // Timer 
            const formattedTime = (this.game.gameTime * 0.001).toFixed(1);
            context.fillText('Timer: ' + formattedTime + 's', 20, 100);

            // Display Cannon Mode Message beneath the timer
            if (this.game.input.cannonMode) {
                context.fillText('Cannon Mode Active', 20, 130); // Adjusted Y-coordinate
            }

            // Game over messages
            if (this.game.gameOver) {
                context.textAlign = 'center';
                let message1;
                let message2;
                if (this.game.score > this.game.winningScore) {
                    message1 = 'Victory!';
                    message2 = 'Congratulations!';
                } else {
                    message1 = 'Defeat!';
                    message2 = 'Try again?';
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
            this.canvas = document.getElementById('canvas1');
            this.background = new Background(this);
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.ui = new UI(this);
            this.keys = [];
            this.enemies = [];
            this.enemyTimer = 0;
            this.enemyInterval = 2000;
            this.ammo = 50;
            this.maxAmmo = 100;
            this.ammoTimer = 0;
            this.ammoInterval = 25;
            this.gameOver = false;
            this.score = 0;
            this.winningScore = 500;
            this.gameTime = 0;
            this.timeLimit = 50000000000000000000000000000000000000000;
            this.speed = 1;

        }

        update(deltaTime) {
            if (!this.gameOver) this.gameTime += deltaTime;
            if (this.gameTime > this.timeLimit) this.gameOver = true;
            this.background.update();
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
                            this.score += enemy.score;  // Remove the this.gameOver check
                            if (this.score > this.winningScore) this.gameOver = true;
                        }

                    }
                });
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
            this.background.draw(context);
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