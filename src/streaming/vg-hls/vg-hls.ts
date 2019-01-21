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
    @Input() vgHlsHeaders: {[key: string]: string} = {};

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
        };

        this.config.xhrSetup = (xhr) => {
            // Send cookies
            if (this.crossorigin === 'use-credentials') {
                xhr.withCredentials = true;
            }
            for (const key of Object.keys(this.vgHlsHeaders)) {
                xhr.setRequestHeader(key, this.vgHlsHeaders[key]);
            }
        };

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
        } else if (changes['vgHlsHeaders'] && changes['vgHlsHeaders'].currentValue) {
            // Do nothing. We don't want to create a or destroy a player if the headers change.
        } else {
            this.destroyPlayer();
        }
    }

    createPlayer(): void {
        if (this.hls) {
            this.destroyPlayer();
        }

        const video: HTMLVideoElement = this.ref.nativeElement;
        // It's a HLS source
        if (this.vgHls && this.vgHls.indexOf('m3u8') > -1) {
            if (Hls.isSupported() && this.API.isPlayerReady) {
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
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = this.vgHls;
            }
        } else {
            if (this.target && !!this.target.pause) {
                this.target.pause();
                this.target.seekTime(0);
                video.src = this.vgHls;
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
