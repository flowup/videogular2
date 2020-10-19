import { VgQualitySelectorComponent } from "./vg-quality-selector";
import { VgAPI } from "../../core/services/vg-api";
import { ElementRef } from "@angular/core";

describe('Quality Selector control', () => {
    
    // @ts-ignore
    let vgQualitySelector: VgQualitySelectorComponent;

    beforeEach(() => {
        const ref: ElementRef = {
            nativeElement: {
                getAttribute: (name) => {
                    return name;
                }
            }
        };
        vgQualitySelector = new VgQualitySelectorComponent(ref, new VgAPI());
    });

    describe('onPlayerReady', () => {

    });
});
