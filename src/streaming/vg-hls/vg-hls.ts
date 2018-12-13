import {
    Directive,
    ElementRef,
    Input,
    SimpleChanges,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    EventEmitter
} from '@angular/core';
import { VgAPI } from '../../core/services/vg-api';
import { HLSConfigModel } from './hls-config';
import { Subscription } from 'rxjs';
import { BitrateOption } from '../../core/core';
import { PlayableModel } from '../../core/vg-media/i-playable';

declare let Hls;

@Directive({
    selector: '[vgHls]',
    exportAs: 'vgHls'
})
export class VgHLSDirective implements OnInit, OnChanges, OnDestroy {
    @Input() vgHls: string;

    @Output() onGetBitrates: EventEmitter<BitrateOption[]> = new EventEmitter();

    vgFor: string;
    target: PlayableModel;
    hls: any;
    preload: boolean;
    crossorigin: string;
    config: HLSConfigModel;

    subscriptions: Subscription[] = [];

    constructor(private ref: ElementRef, public API: VgAPI) {}

    ngOnInit(): void {
        if (this.API.isPlayerReady) {
            this.onPlayerReady();
        } else {
            this.subscriptions.push(this.API.playerReadyEvent.subscribe(() => this.onPlayerReady()));
        }
    }

    onPlayerReady(): void {
        this.crossorigin = this.ref.nativeElement.getAttribute('crossorigin');
        this.preload = this.ref.nativeElement.getAttribute('preload') !== 'none';
        this.vgFor = this.ref.nativeElement.getAttribute('vgFor');

        if (this.vgFor) {
            this.target = this.API.getMediaById(this.vgFor);
        } else {
            this.target = this.API.getDefaultMedia();
        }

        this.config = <HLSConfigModel>{
            autoStartLoad: this.preload,
            liveSyncDurationCount: 1,
            startPosition: 0,
        };

        if (this.crossorigin === 'use-credentials') {
            this.config.xhrSetup = (xhr) => {
                // Send cookies
                xhr.withCredentials = true;
            };
        }

        this.createPlayer();

        if (!this.preload) {
            this.subscriptions.push(
                this.API.subscriptions.play.subscribe(
                    () => {
                        if (this.hls) {
                            this.hls.startLoad(0);
                        }
                    }
                )
            );
        }

        if (this.hls) {
            this.hls.on(
                Hls.Events.LEVEL_LOADED,
                (_, data) => {
                    this.target.totalTime = data.details.totalduration;
                    this.target.segmentDuration = data.details.targetduration;
                    if (!this.target.offset) {
                        this.target.isLivestream = data.details.live;
                    }
                }
            );
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['vgHls'] && changes['vgHls'].currentValue) {
            this.createPlayer();
        } else {
            this.destroyPlayer();
        }
    }

    createPlayer(): void {
        if (this.hls) {
            this.destroyPlayer();
        }

        // It's a HLS source
        if (this.vgHls && this.vgHls.indexOf('m3u8') > -1 && Hls.isSupported()) {
            const video: HTMLVideoElement = this.ref.nativeElement;

            this.hls = new Hls(this.config);
            this.hls.on(
                Hls.Events.MANIFEST_PARSED,
                (_, data) => {
                    const videoList = [];

                    videoList.push({
                        qualityIndex: 0,
                        width: 0,
                        height: 0,
                        bitrate: 0,
                        mediaType: 'video',
                        label: 'AUTO'
                    });

                    data.levels.forEach((item, index) => {
                        videoList.push({
                            qualityIndex: ++index,
                            width: item.width,
                            height: item.height,
                            bitrate: item.bitrate,
                            mediaType: 'video',
                            label: item.name
                        });
                    });

                    this.onGetBitrates.emit(videoList);
                }
            );

            this.hls.loadSource(this.vgHls);
            this.hls.attachMedia(video);
        } else {
            if (this.target && !!this.target.pause) {
                this.target.pause();
                this.target.seekTime(0);
                this.ref.nativeElement.src = this.vgHls;
            }
        }
    }

    setBitrate(bitrate: BitrateOption): void {
        if (this.hls) {
            this.hls.nextLevel = bitrate.qualityIndex - 1;
        }
    }

    destroyPlayer(): void {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.destroyPlayer();
    }
}
