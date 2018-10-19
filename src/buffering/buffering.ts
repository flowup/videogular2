import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VgBufferingComponent } from './vg-buffering';

@NgModule({
    imports: [ CommonModule ],
    declarations: [
        VgBufferingComponent
    ],
    exports: [
        VgBufferingComponent
    ]
})
export class VgBufferingModule {
}
