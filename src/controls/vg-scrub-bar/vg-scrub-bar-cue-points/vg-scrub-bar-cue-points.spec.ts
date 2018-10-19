import { VgScrubBarCuePointsComponent } from './vg-scrub-bar-cue-points';
import { VgAPI } from '../../../core/services/vg-api';
import { ElementRef, SimpleChange } from '@angular/core';

describe('Scrub bar current time', () => {
    let scrubBarCuePoints: VgScrubBarCuePointsComponent;
    let ref: ElementRef;
    let api: VgAPI;

    beforeEach(() => {
        ref = {
            nativeElement: {
                getAttribute: (name) =>
                    name,
                subscriptions: {
                    loadedMetadata: {
                        subscribe: () => undefined
                    }
                }
            }
        };

        api = new VgAPI();

        scrubBarCuePoints = new VgScrubBarCuePointsComponent(ref, api);
    });

    it('Should create cue points when metadata is loaded', () => {
        const cps: {} = {
            length: 3
        };
        const cp1: TextTrackCue = (<TextTrackCue>{ startTime: 1 });
        const cp2: TextTrackCue = (<TextTrackCue>{ startTime: 5, endTime: 10 });
        const cp3: TextTrackCue = (<TextTrackCue>{ startTime: 15, endTime: 20, text: '{value: \'custom params\'}' });

        cps[ 0 ] = cp1;
        cps[ 1 ] = cp2;
        cps[ 2 ] = cp3;

        scrubBarCuePoints.vgCuePoints = (<TextTrackCueList>cps);

        scrubBarCuePoints.target = {
            time: {
                total: 100000
            }
        };

        scrubBarCuePoints.ngOnChanges({ vgCuePoints: (<SimpleChange>{ currentValue: cps }) });

        expect((<any>scrubBarCuePoints.vgCuePoints[ 0 ]).$$style).toEqual({ width: '1%', left: '1%' });
        expect((<any>scrubBarCuePoints.vgCuePoints[ 1 ]).$$style).toEqual({ width: '5%', left: '5%' });
        expect((<any>scrubBarCuePoints.vgCuePoints[ 2 ]).$$style).toEqual({ width: '5%', left: '15%' });
    });

    it('Should not calculate style position if there is not duration on media', () => {
        const cps: {} = {
            length: 3
        };
        const cp1: TextTrackCue = (<TextTrackCue>{ startTime: 1 });
        const cp2: TextTrackCue = (<TextTrackCue>{ startTime: 5, endTime: 10 });
        const cp3: TextTrackCue = (<TextTrackCue>{ startTime: 15, endTime: 20, text: '{value: \'custom params\'}' });

        cps[ 0 ] = cp1;
        cps[ 1 ] = cp2;
        cps[ 2 ] = cp3;

        scrubBarCuePoints.vgCuePoints = (<TextTrackCueList>cps);

        scrubBarCuePoints.target = {
            time: {
                total: 0
            }
        };

        scrubBarCuePoints.ngOnChanges({ vgCuePoints: (<SimpleChange>{ currentValue: cps }) });

        expect((<any>scrubBarCuePoints.vgCuePoints[ 0 ]).$$style).toEqual({ width: '0', left: '0' });
        expect((<any>scrubBarCuePoints.vgCuePoints[ 1 ]).$$style).toEqual({ width: '0', left: '0' });
        expect((<any>scrubBarCuePoints.vgCuePoints[ 2 ]).$$style).toEqual({ width: '0', left: '0' });
    });

    it('Should do nothing if there are no cue points', () => {
        scrubBarCuePoints.vgCuePoints = null;
        scrubBarCuePoints.onLoadedMetadata();
        scrubBarCuePoints.ngOnChanges({ vgCuePoints: (<SimpleChange>{ currentValue: null }) });
    });

    it('Should handle after view init event', () => {
        spyOn(scrubBarCuePoints.API, 'getMediaById').and.callFake(
            () =>
                ref.nativeElement
        );

        spyOn(ref.nativeElement.subscriptions.loadedMetadata, 'subscribe').and.callThrough();

        scrubBarCuePoints.onPlayerReady();

        expect(ref.nativeElement.subscriptions.loadedMetadata.subscribe).toHaveBeenCalled();
    });
});
