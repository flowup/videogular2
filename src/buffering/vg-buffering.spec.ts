import { VgBufferingComponent } from './vg-buffering';
import { VgAPI } from '../core/services/vg-api';
import { ElementRef } from '@angular/core';

describe('Buffering', () => {
    let vgBuffering: VgBufferingComponent;
    let ref: ElementRef;
    let api: VgAPI;

    beforeEach(() => {
        ref = {
            nativeElement: {
                getAttribute: (name) => name
            }
        };

        api = new VgAPI();
        vgBuffering = new VgBufferingComponent(ref, api);
    });

    describe('onPlayerReady', () => {
        it('should subscribe to bufferDetected media events', () => {
            spyOn(api, 'getMediaById').and.returnValue({
                subscriptions: {
                    bufferDetected: {subscribe: jasmine.createSpy('bufferDetected') }
                }
            });
            vgBuffering.onPlayerReady();
            expect(vgBuffering.target.subscriptions.bufferDetected.subscribe).toHaveBeenCalled();
        });
    });

    describe('isBuffering', () => {
        it('should show if buffer is detected', () => {
            vgBuffering.onUpdateBuffer(true);
            expect(vgBuffering.isBuffering).toBe(true);
        });
        it('should hide if buffer is not detected', () => {
            vgBuffering.onUpdateBuffer(false);
            expect(vgBuffering.isBuffering).toBe(false);
        });
    });
});
