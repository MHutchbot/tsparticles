"use strict";

import { ClickMode } from "../Enums/ClickMode";
import { Container } from "./Container";
import { HoverMode } from "../Enums/HoverMode";
import { ICoordinates } from "../Interfaces/ICoordinates";
import { IMouseData } from "../Interfaces/IMouseData";
import { IRgb } from "../Interfaces/IRgb";
import { Particle } from "./Particle";
import { Utils } from "./Utils/Utils";

export class Particles {
    public array: Particle[];
    public pushing?: boolean;
    public lineLinkedColor?: IRgb | null;

    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
        this.array = [];
    }

    /* --------- tsParticles functions - particles ----------- */
    public create(): void {
        const container = this.container;
        const options = container.options;

        for (let i = 0; i < options.particles.number.value; i++) {
            const p = new Particle(container);

            this.array.push(p);
        }
    }

    public update(delta: number): void {
        const container = this.container;
        const options = container.options;
        const arrLength = this.array.length;

        for (let i = 0; i < arrLength; i++) {
            /* the particle */
            const p = this.array[i];
            // let d = ( dx = container.interactivity.mouse.click_pos_x - p.x ) * dx +
            //         ( dy = container.interactivity.mouse.click_pos_y - p.y ) * dy;
            // let f = -BANG_SIZE / d;
            // if ( d < BANG_SIZE ) {
            //     let t = Math.atan2( dy, dx );
            //     p.vx = f * Math.cos(t);
            //     p.vy = f * Math.sin(t);
            // }

            /* move the particle */
            p.updater.move(delta);

            /* parallax */
            p.updater.moveParallax();

            /* change opacity status */
            p.updater.updateOpacity();

            /* change size */
            p.updater.updateSize();

            /* change particle position if it is out of canvas */
            p.updater.fixOutOfCanvasPosition();

            /* out of canvas modes */
            p.updater.updateOutMode();

            const hoverMode = options.interactivity.events.onhover.mode;
            const clickMode = options.interactivity.events.onclick.mode;

            /* events */
            if (Utils.isInArray(HoverMode.grab, hoverMode)) {
                p.grabber.grab();
            }

            if (Utils.isInArray(HoverMode.bubble, hoverMode) || Utils.isInArray(ClickMode.bubble, clickMode)) {
                p.bubbler.bubble();
            }

            if (Utils.isInArray(HoverMode.repulse, hoverMode) || Utils.isInArray(ClickMode.repulse, clickMode)) {
                p.repulser.repulse();
            }

            /* interaction auto between particles */
            if (options.particles.line_linked.enable || options.particles.move.attract.enable) {
                for (let j = i + 1; j < arrLength; j++) {
                    const p2 = this.array[j];

                    /* link particles */
                    if (options.particles.line_linked.enable) {
                        p.updater.link(p2);
                    }

                    /* attract particles */
                    if (options.particles.move.attract.enable) {
                        p.updater.attract(p2);
                    }

                    /* bounce particles */
                    if (options.particles.move.bounce) {
                        p.updater.bounce(p2);
                    }
                }
            }
        }
    }

    public draw(delta: number): void {
        const container = this.container;

        /* clear canvas */
        if (container.canvas.ctx) {
            container.canvas.ctx.clearRect(0, 0, container.canvas.w, container.canvas.h);
        }

        /* update each particles param */
        container.particles.update(delta);

        /* draw each particle */
        for (const p of this.array) {
            p.drawer.draw();
        }
    }

    public empty(): void {
        this.array = [];
    }

    /* ---------- tsParticles functions - modes events ------------ */
    public push(nb: number, mousePosition?: IMouseData): void {
        const container = this.container;
        const options = container.options;

        this.pushing = true;

        let pos: ICoordinates | undefined;

        if (mousePosition) {
            pos = mousePosition.position || { x: 0, y: 0 };
        }

        for (let i = 0; i < nb; i++) {
            const p = new Particle(container, pos);

            this.array.push(p);
        }

        if (!options.particles.move.enable) {
            this.draw(0);
        }

        this.pushing = false;
    }

    public remove(nb: number): void {
        const container = this.container;
        const options = container.options;

        this.array.splice(0, nb);

        if (!options.particles.move.enable) {
            this.draw(0);
        }
    }

    public async refresh(): Promise<void> {
        const container = this.container;

        /* init all */
        if (container.checkAnimFrame) {
            container.cancelAnimation(container.checkAnimFrame);
        }

        if (container.drawAnimFrame) {
            container.cancelAnimation(container.drawAnimFrame);
        }

        container.svg.source = undefined;
        container.svg.count = 0;
        container.img.obj = undefined;

        this.empty();

        container.canvas.clear();

        delete container.particles.lineLinkedColor;

        /* restart */
        await container.start();
    }
}
