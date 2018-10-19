import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VgControlsComponent } from './vg-controls';
import { VgFullscreenComponent } from './vg-fullscreen/vg-fullscreen';
import { VgMuteComponent } from './vg-mute/vg-mute';
import { VgVolumeComponent } from './vg-volume/vg-volume';
import { VgPlayPauseComponent } from './vg-play-pause/vg-play-pause';
import { VgPlaybackButtonComponent } from './vg-playback-button/vg-playback-button';
import { VgScrubBarComponent } from './vg-scrub-bar/vg-scrub-bar';
import { VgScrubBarBufferingTimeComponent } from './vg-scrub-bar/vg-scrub-bar-buffering-time/vg-scrub-bar-buffering-time';
import { VgScrubBarCuePointsComponent } from './vg-scrub-bar/vg-scrub-bar-cue-points/vg-scrub-bar-cue-points';
import { VgScrubBarCurrentTimeComponent } from './vg-scrub-bar/vg-scrub-bar-current-time/vg-scrub-bar-current-time';
import { VgTimeDisplayComponent, VgUtcPipe } from './vg-time-display/vg-time-display';
import { VgTrackSelectorComponent } from './vg-track-selector/vg-track-selector';
import { VgControlsHidden } from '../core/services/vg-controls-hidden';
import { VgQualitySelectorComponent } from './vg-quality-selector/vg-quality-selector';

@NgModule({
    imports: [ CommonModule ],
    declarations: [
        VgControlsComponent,
        VgFullscreenComponent,
        VgMuteComponent,
        VgVolumeComponent,
        VgPlayPauseComponent,
        VgPlaybackButtonComponent,
        VgScrubBarComponent,
        VgScrubBarBufferingTimeComponent,
        VgScrubBarCuePointsComponent,
        VgScrubBarCurrentTimeComponent,
        VgTimeDisplayComponent,
        VgUtcPipe,
        VgTrackSelectorComponent,
        VgQualitySelectorComponent
    ],
    exports: [
        VgControlsComponent,
        VgFullscreenComponent,
        VgMuteComponent,
        VgVolumeComponent,
        VgPlayPauseComponent,
        VgPlaybackButtonComponent,
        VgScrubBarComponent,
        VgScrubBarBufferingTimeComponent,
        VgScrubBarCuePointsComponent,
        VgScrubBarCurrentTimeComponent,
        VgTimeDisplayComponent,
        VgUtcPipe,
        VgTrackSelectorComponent,
        VgQualitySelectorComponent
    ],
    providers: [ VgControlsHidden ]
})
export class VgControlsModule {
}
