import { MediaElementModel } from './i-media-element';
import { VgMediaDirective } from './vg-media';
import { VgAPI } from '../services/vg-api';
import { ChangeDetectorRef } from '@angular/core';
import { VgStates } from '../states/vg-states';
import { fakeAsync, tick } from '@angular/core/testing';

describe('Videogular Media', () => {
    let media: VgMediaDirective;
    // let ref: ElementRef;
    let cdRef: ChangeDetectorRef;
    let api: VgAPI;
    const elem: Partial<MediaElementModel> = {
        duration: 100,
        currentTime: 0,
        volume: 1,
        playbackRate: 1,
        buffered: {
            length: 2,
            start: () => 0,
            end: () => 50
        },
        id: 'testVideo',
        play: () => new Promise(() => undefined),
        pause: () => undefined,
        load: () => undefined,
    };

    beforeEach(() => {
        // ref = {
        //     nativeElement: elem
        // };
        cdRef = {
            detectChanges: () => undefined,
            markForCheck: () => undefined,
            detach: () => undefined,
            reattach: () => undefined,
            checkNoChanges: () => undefined
        };
        api = new VgAPI();
        media = new VgMediaDirective(api, cdRef);
        media.vgMedia = (elem as any);
    });

    it('Should load a new media if a change on dom have been happened', fakeAsync(() => {
        spyOn(elem, 'load').and.callThrough();
        spyOn(elem, 'pause').and.callThrough();

        media.onMutation([
            <any>{
                type: 'attributes',
                attributeName: 'src',
                target: {
                    src: 'my-new-file.mp4'
                }
            }
        ]);

        tick(10);

        expect(elem.load).toHaveBeenCalled();
        expect(elem.pause).toHaveBeenCalled();
        expect(elem.currentTime).toBe(0);
    }));

    it('Should not be master by default', () => {
        expect(media.vgMaster).toBeFalsy();
    });

    it('Should have a play method', () => {
        spyOn(elem, 'play');

        media.play();

        expect(elem.play).toHaveBeenCalled();
    });

    it('Should have a pause method', () => {
        spyOn(elem, 'pause');

        media.pause();

        expect(elem.pause).toHaveBeenCalled();
    });

    it('Should have setter/getter props', () => {
        expect(media.duration).toBe(100);
        expect(media.currentTime).toBe(0);
        expect(media.volume).toBe(1);
        expect(media.playbackRate).toBe(1);
        expect(media.buffered.length).toEqual(2);

        media.currentTime = 50;
        media.volume = 0.5;
        media.playbackRate = 0.5;

        expect(elem.currentTime).toBe(50);
        expect(elem.volume).toBe(0.5);
        expect(elem.playbackRate).toBe(0.5);
    });

    it('Should handle onCanPlay native event', () => {
        expect(media.canPlay).toBeFalsy();

        media.onCanPlay();

        expect(media.canPlay).toBeTruthy();
    });

    it('Should handle onCanPlayThrough native event', () => {
        expect(media.canPlayThrough).toBeFalsy();

        media.onCanPlayThrough();

        expect(media.canPlayThrough).toBeTruthy();
    });

    it('Should handle onLoadMetadata native event', () => {
        expect(media.isMetadataLoaded).toBeFalsy();

        media.onLoadMetadata();

        expect(media.isMetadataLoaded).toBeTruthy();
        expect(media.time.total).toBe(100000);
    });

    it('Should handle onWait native event', () => {
        expect(media.isWaiting).toBeFalsy();

        media.onWait();

        expect(media.isWaiting).toBeTruthy();
    });

    it('Should handle onComplete native event', () => {
        expect(media.isCompleted).toBeFalsy();

        media.state = VgStates.VG_PLAYING;
        media.onComplete();

        expect(media.isCompleted).toBeTruthy();
        expect(media.state).toBe(VgStates.VG_ENDED);
    });

    it('Should handle onStartPlaying native event', () => {
        expect(media.state).toBe(VgStates.VG_PAUSED);

        media.onStartPlaying();

        expect(media.state).toBe(VgStates.VG_PLAYING);
    });

    it('Should handle onPlay native event', () => {
        expect(media.state).toBe(VgStates.VG_PAUSED);

        media.onPlay();

        expect(media.state).toBe(VgStates.VG_PLAYING);
    });

    it('Should handle onPause native event', () => {
        media.state = VgStates.VG_PLAYING;

        media.onPause();

        expect(media.state).toBe(VgStates.VG_PAUSED);
    });

    it('Should handle onTimeUpdate native event (with buffer)', () => {
        elem.currentTime = 25;

        media.onTimeUpdate();

        expect(media.time.current).toBe(25000);
        expect(media.time.left).toBe(75000);
        expect(media.buffer.end).toBe(50000);
    });

    it('Should handle onTimeUpdate native event (without buffer)', () => {
        elem.currentTime = 25;
        (elem as any).buffered = {
            length: 0,
            start: () => 0,
            end: () => 0
        };

        media.onTimeUpdate();

        expect(media.time.current).toBe(25000);
        expect(media.time.left).toBe(75000);
        expect(media.buffer.end).toBe(0);

        (elem as any).buffered = {
            length: 2,
            start: () => 0,
            end: () => 50
        };
    });

    it('Should handle onProgress native event (with buffer)', () => {
        media.onProgress();

        expect(media.buffer.end).toBe(50000);
    });

    it('Should handle onProgress native event (without buffer)', () => {
        (elem as any).buffered = {
            length: 0,
            start: () => 0,
            end: () => 0
        };

        media.onProgress();

        expect(media.buffer.end).toBe(0);

        (elem as any).buffered = {
            length: 2,
            start: () => 0,
            end: () => 50
        };
    });
});
