class Crono {
    constructor(display) {
        this.display = display;
        this.cent = 0;
        this.seg = 0;
        this.min = 0;
        this.timer = null;
    }

    tic() {
        this.cent++;

        if (this.cent === 100) {
            this.seg++;
            this.cent = 0;
        }

        if (this.seg === 60) {
            this.min++;
            this.seg = 0;
        }

        this.display.innerHTML = this.min + ":" + this.seg + ":" + this.cent;
    }

    start() {
        if (!this.timer) {
            this.timer = setInterval(() => this.tic(), 10);
        }
    }

    stop() {
        clearInterval(this.timer);
        this.timer = null;
    }

    reset() {
        this.stop();
        this.cent = 0;
        this.seg = 0;
        this.min = 0;
        this.display.innerHTML = "0:0:0";
    }
}