import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VgOverlayPlayComponent } from './vg-overlay-play';

@NgModule({
    imports: [ CommonModule ],
    declarations: [
        VgOverlayPlayComponent
    ],
    exports: [
        VgOverlayPlayComponent
    ]
})
export class VgOverlayPlayModule {}
