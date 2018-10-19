import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VgImaAdsComponent } from './vg-ima-ads';

@NgModule({
    imports: [ CommonModule ],
    declarations: [
        VgImaAdsComponent
    ],
    exports: [
        VgImaAdsComponent
    ]
})
export class VgImaAdsModule {}
