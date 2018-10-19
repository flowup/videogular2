import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VgDASHDirective } from './vg-dash/vg-dash';
import { VgHLSDirective } from './vg-hls/vg-hls';

export interface DRMLicenseServerModel {
    [index: string]: {
        serverURL: string;
    };
}

@NgModule({
    imports: [ CommonModule ],
    declarations: [
        VgDASHDirective, VgHLSDirective
    ],
    exports: [
        VgDASHDirective, VgHLSDirective
    ]
})
export class VgStreamingModule {}
