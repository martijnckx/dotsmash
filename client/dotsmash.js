class Util {
    /**
     * Normalizes a vector.
     * @param {number[]} v 2D vector.
     * @returns {number[]} Normalized vector.
     */
    static Normalize(v) {
        let magnitude = Util.Magnitude(v);
        let norm = [v[0] / magnitude, v[1] / magnitude];
        return norm;
    }

    /**
     * Get magnitude of vector.
     * @param {number[]} v 2D vector.
     * @return {number} Magnitude of vector.
     */
    static Magnitude(v) {
        let magnitude = Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
        return magnitude;
    }

    /**
     * Multiply a vector by a certain value.
     * @param {number[]} v 2D vector.
     * @param {number} i Multiply by value.
     * @return {number[]} Multiplication of v by i.
     */
    static Multiply(v, i) {
        return [v[0] * i, v[1] * i];
    }

    /**
     * Add two vectors
     * @param {number[]} v1 2D vector.
     * @param {number[]} v2 2D vector.
     * @return {number[]} Summation of v1 and v2. 
     */
    static Sum(v1, v2) {
        return [v1[0] + v2[0], v1[1] + v2[1]];
    }
}


class Player {
    constructor(pos) {
        this.shape = new p2.Circle({ radius: 0.2 });
        this.body = new p2.Body({ mass: 1, position: pos });
        this.body.addShape(this.shape);

        this.acceleration = 50;
    }

    /**
     *
     * @param {CanvasRenderingContext2D} context Context used for drawing.
     */
    Draw(context) {
        context.beginPath();
        var x = this.body.position[0],
            y = this.body.position[1],
            radius = this.shape.radius;
        context.arc(x, y, radius, 0, 2 * Math.PI);
        context.fillStyle = this.color;
        context.fill();
        context.stroke();
    }

    Move() {
        var force = [this.direction[0] * this.acceleration, this.direction[1] * this.acceleration];
        this.body.applyForce(force);
        var friction = [- this.body.velocity[0] * 0.95, - this.body.velocity[1] * 0.95];
        this.body.applyForce(friction);
    }

    Die() {
        this.body.sleep();
    }
}

class OtherPlayer extends Player {
    constructor(pos) {
        super(pos);
        this.color = "blue";
    }

    /**
     * 
     * @param {number[]} dir Normalised direction vector.
     */
    SetDirection(dir) {
        this.direction = dir;
    }
}

class ThisPlayer extends Player {
    constructor(pos) {
        super(pos);
        this.color = "red";
        var thisobj = this;
        window.addEventListener("deviceorientation", function (e) { thisobj.StoreDirection(e); }, false);
        //window.addEventListener("touchstart", function () { thisobj.Boost(); }, false);
    }

    StoreDirection(e) {
        // Store the Euleur rotation values
        // Event has aplha, beta and gamma angles
        // Gamma is left and right tilt,
        // Beta is up and down tilt
        this.direction = [e.gamma / 90, -e.beta / 90];

        //this.orientation = {
        //    'x': e.gamma/90,
        //    'y': e.beta/90
        //};
    }

    //Boost() {
    //    let directionNorm = Util.Normalize(this.direction);
    //    let magnitude = Util.Magnitude(this.body.velocity);
    //    let boostVelocity = Util.Multiply(directionNorm, magnitude);
    //    this.body.velocity = Util.Sum(this.body.velocity, boostVelocity);
    //}
}

class CircleOfDeath {
    constructor(radius) {
        this.radius = radius;
    }

    Draw(context) {
        context.beginPath();
        context.arc(0, 0, this.radius, 0, 2 * Math.PI);
        context.stroke();
    }

    Shrink() {
        if (this.radius > 0.25) {
            this.radius = this.radius - 0.001;
        }
    }

    /**
     * Checks whether a player is inside the circle of death.
     * @param {Player} player Player.
     * @returns {boolean} Whether a player is inside the circle of death.
     */
    IsInside(player) {
        if (Util.Magnitude(player.body.position) > this.radius + player.shape.radius) return false;
        return true;
    }
}

class World {
    constructor() {
        this.InitCanvas();
        this.InitWorld();
    }

    InitCanvas() {
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.context.lineWidth = 0.025;

        document.body.appendChild(this.canvas);
    }

    InitWorld() {
        this.p2World = new p2.World({ gravity: [0, 0] });
        this.players = {};

        var thisObj = this;
        this.circleOfDeath = new CircleOfDeath(6.5);
        this.p2World.on("postStep", function () { thisObj.PostStep(); });
    }

    AddMyPlayer(myId) {
        this.myId = myId;
        let p = new ThisPlayer([0, 0]);
        this.players[myId] = p;
        this.p2World.addBody(p.body);
    }

    AddOtherPlayer(playerId) {
        let p = new ThisPlayer([0, 0]);
        this.players[playerId] = p;
        this.p2World.addBody(p.body);
    }

    Render() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.save();

        this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.context.translate(this.players[this.myId].body.position[0] * -50, this.players[this.myId].body.position[1] * 50);
        this.context.scale(50, -50);

        for (let i in this.players) {
            this.players[i].Draw(this.context);
        }

        this.circleOfDeath.Draw(this.context);

        this.context.restore();
    }

    PostStep() {
        for (let i in this.players) {
            this.players[i].Move();
        }

        for (let i in this.players) {
            if (!this.circleOfDeath.IsInside(this.players[i])) {
                this.players[i].Die();
            }
        }

        this.circleOfDeath.Shrink();
    }
}

class GameRoom {
    constructor() {
        this.world = new World();
        this.socket = io();

        var thisobj = this;
        this.socket.on('connect', function () {
            thisobj.world.AddMyPlayer(thisobj.socket.id);
        });
        this.socket.on('position-update', thisobj.SetPositions);

        this.Animate();

    }

    Animate() {
        var fixedTimeStep = 1 / 60; // seconds
        var maxSubSteps = 10; // Max sub steps to catch up with the wall clock
        var lastTime;

        var thisobj = this;
        var animate = function () {
            requestAnimationFrame(animate);

            var deltaTime = lastTime ? (time - lastTime) / 1000 : 0;
            thisobj.world.p2World.step(fixedTimeStep, deltaTime, maxSubSteps);

            thisobj.SendPosition();
            thisobj.world.Render();
        };
        animate();
    }

    SendPosition() {
        var thisobj = this;
        this.socket.emit('position-update', {
            'id': thisobj.world.myId,
            'position': thisobj.world.players[thisobj.world.myId].body.position,
            'direction': thisobj.world.players[thisobj.world.myId].direction
        });
    }

    SetPositions(positions) {

    }
}

window.onload = function () {
    new GameRoom();
};