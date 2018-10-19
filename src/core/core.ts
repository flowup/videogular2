import { NgModule, Provider } from '@angular/core';
import { VgPlayer } from './vg-player/vg-player';
import { VgMediaDirective } from './vg-media/vg-media';
import { VgCuePointsDirective } from './vg-cue-points/vg-cue-points';
import { VgAPI } from './services/vg-api';
import { VgFullscreenAPI } from './services/vg-fullscreen-api';
import { VgUtils } from './services/vg-utils';
import { VgControlsHidden } from './services/vg-controls-hidden';


// components
export * from './vg-player/vg-player';
export * from './vg-media/vg-media';
export * from './vg-cue-points/vg-cue-points';

// services
export * from './services/vg-api';
export * from './services/vg-fullscreen-api';
export * from './services/vg-utils';
export * from './services/vg-controls-hidden';

// types
export * from './events/vg-events';
export * from './states/vg-states';

// interfaces
export * from './vg-media/i-media-element';

export interface BitrateOption {
    qualityIndex: number;
    width: number;
    height: number;
    bitrate: number;
    mediaType: string;
    label?: string;
}

/**
 * @internal
 */
export function coreDirectives(): any[] {
    return [
        VgPlayer, VgMediaDirective, VgCuePointsDirective
    ];
}

export function coreServices(): Provider[] {
    return [
        VgAPI, VgFullscreenAPI, VgUtils, VgControlsHidden
    ];
}

@NgModule({
    declarations: coreDirectives(),
    exports: coreDirectives(),
    providers: coreServices()
})
export class VgCoreModule {
}
