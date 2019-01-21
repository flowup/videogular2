import { VgUtils } from './../services/vg-utils';
import { ChangeDetectorRef, Directive, Input, OnDestroy, OnInit } from '@angular/core';
import { PlayableModel, MediaSubscriptionsModel } from './i-playable';
import { Observable, Subscription, Subject, fromEvent, timer, combineLatest } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import { VgStates } from '../states/vg-states';
import { VgAPI } from '../services/vg-api';
import { VgEvents } from '../events/vg-events';
import { MediaElementModel } from './i-media-element';
import { OffsetModel } from './offset.model';

const msFloatSub = 0.3;

@Directive({
    selector: '[vgMedia]'
})
export class VgMediaDirective implements OnInit, OnDestroy, PlayableModel {
    elem: any;

    @Input() vgMedia: MediaElementModel;
    @Input() vgMaster: boolean;
    @Input() set vgOffset(offset: OffsetModel | undefined) {
        if (!offset || (offset.start === 0 && offset.end === 0)) {
            return;
        }

        setTimeout(
            () => {
                if (!this.isMetadataLoaded) {
                    this.subscriptions.loadedMetadata.pipe(
                        filter(() => this.isMetadataLoaded),
                        take(1),
                    ).subscribe(
                        () => {
                            this.setOffset(offset);
                        }
                    );
                } else {
                    this.setOffset(offset);
                }
            },
            0
        );
    }

    offset: OffsetModel;
    // coreSrc: string;

    state: string = VgStates.VG_PAUSED;

    time: any = { current: 0, total: 0, left: 0 };
    totalTime = 0;
    buffer: any = { end: 0 };
    track: any;
    subscriptions: MediaSubscriptionsModel;

    canPlay = false;
    canPlayThrough = false;
    isMetadataLoaded = false;
    isWaiting = false;
    isCompleted = false;
    isLivestream = false;
    followsLive = false;
    segmentDuration = 10;

    isBufferDetected = false;

    checkInterval = 50;
    currentPlayPos = 0;
    lastPlayPos = 0;

    checkBufferSubscription: any;
    syncSubscription: Subscription;
    canPlayAllSubscription: any;
    playAfterSync = false;

    mutationObs: Subscription;
    canPlayObs: Subscription;
    canPlayThroughObs: Subscription;
    loadedMetadataObs: Subscription;
    waitingObs: Subscription;
    progressObs: Subscription;
    endedObs: Subscription;
    playingObs: Subscription;
    playObs: Subscription;
    pauseObs: Subscription;
    timeUpdateObs: Subscription;
    volumeChangeObs: Subscription;
    errorObs: Subscription;

    bufferDetected: Subject<boolean> = new Subject();

    playPromise: Promise<any>;

    constructor(private api: VgAPI, private ref: ChangeDetectorRef) {}

    ngOnInit(): void {
        // this.coreSrc = this.vgMedia.src;
        if (this.vgMedia.nodeName) {
            // It's a native element
            this.elem = this.vgMedia;
        } else {
            // It's an Angular Class
            this.elem = this.vgMedia.elem;
        }

        // Just in case we're creating this vgMedia dynamically register again into API
        this.api.registerMedia(this);

        this.subscriptions = {
            // Native events
            abort: fromEvent(<any>this.elem, VgEvents.VG_ABORT),
            canPlay: fromEvent(<any>this.elem, VgEvents.VG_CAN_PLAY),
            canPlayThrough: fromEvent(<any>this.elem, VgEvents.VG_CAN_PLAY_THROUGH),
            durationChange: fromEvent(<any>this.elem, VgEvents.VG_DURATION_CHANGE),
            emptied: fromEvent(<any>this.elem, VgEvents.VG_EMPTIED),
            encrypted: fromEvent(<any>this.elem, VgEvents.VG_ENCRYPTED),
            ended: fromEvent(<any>this.elem, VgEvents.VG_ENDED),
            error: fromEvent(<any>this.elem, VgEvents.VG_ERROR),
            loadedData: fromEvent(<any>this.elem, VgEvents.VG_LOADED_DATA),
            loadedMetadata: fromEvent(<any>this.elem, VgEvents.VG_LOADED_METADATA),
            loadStart: fromEvent(<any>this.elem, VgEvents.VG_LOAD_START),
            pause: fromEvent(<any>this.elem, VgEvents.VG_PAUSE),
            play: fromEvent(<any>this.elem, VgEvents.VG_PLAY),
            playing: fromEvent(<any>this.elem, VgEvents.VG_PLAYING),
            progress: fromEvent(<any>this.elem, VgEvents.VG_PROGRESS),
            rateChange: fromEvent(<any>this.elem, VgEvents.VG_RATE_CHANGE),
            seeked: fromEvent(<any>this.elem, VgEvents.VG_SEEKED),
            seeking: fromEvent(<any>this.elem, VgEvents.VG_SEEKING),
            stalled: fromEvent(<any>this.elem, VgEvents.VG_STALLED),
            suspend: fromEvent(<any>this.elem, VgEvents.VG_SUSPEND),
            timeUpdate: fromEvent(<any>this.elem, VgEvents.VG_TIME_UPDATE),
            volumeChange: fromEvent(<any>this.elem, VgEvents.VG_VOLUME_CHANGE),
            waiting: fromEvent(<any>this.elem, VgEvents.VG_WAITING),

            // Advertisement only events
            startAds: fromEvent(<any>window, VgEvents.VG_START_ADS),
            endAds: fromEvent(<any>window, VgEvents.VG_END_ADS),

            // See changes on <source> child elements to reload the video file
            mutation: Observable.create(
                (observer: any) => {

                    const domObs = new MutationObserver((mutations) => {
                        observer.next(mutations);
                    });

                    domObs.observe(<any>this.elem, { childList: true, attributes: true });

                    return () => {
                        domObs.disconnect();
                    };
                }
            ),

            // Custom buffering detection
            bufferDetected: this.bufferDetected
        };

        this.mutationObs = this.subscriptions.mutation.subscribe(this.onMutation.bind(this));
        this.canPlayObs = this.subscriptions.canPlay.subscribe(this.onCanPlay.bind(this));
        this.canPlayThroughObs = this.subscriptions.canPlayThrough.subscribe(this.onCanPlayThrough.bind(this));
        this.loadedMetadataObs = this.subscriptions.loadedMetadata.subscribe(this.onLoadMetadata.bind(this));
        this.waitingObs = this.subscriptions.waiting.subscribe(this.onWait.bind(this));
        this.progressObs = this.subscriptions.progress.subscribe(this.onProgress.bind(this));
        this.endedObs = this.subscriptions.ended.subscribe(this.onComplete.bind(this));
        this.playingObs = this.subscriptions.playing.subscribe(this.onStartPlaying.bind(this));
        this.playObs = this.subscriptions.play.subscribe(this.onPlay.bind(this));
        this.pauseObs = this.subscriptions.pause.subscribe(this.onPause.bind(this));
        this.timeUpdateObs = this.subscriptions.timeUpdate.subscribe(this.onTimeUpdate.bind(this));
        this.volumeChangeObs = this.subscriptions.volumeChange.subscribe(this.onVolumeChange.bind(this));
        this.errorObs = this.subscriptions.error.subscribe(this.onError.bind(this));

        if (this.vgMaster) {
            this.api.playerReadyEvent.subscribe(
                () => {
                    this.prepareSync();
                }
            );
        }
    }

    prepareSync(): void {
        const canPlayAll: Observable<any>[] = [];

        for (const media in this.api.medias) {
            if (this.api.medias[ media ]) {
                canPlayAll.push(this.api.medias[ media ].subscriptions.canPlay);
            }
        }

        this.canPlayAllSubscription = combineLatest(
            canPlayAll,
            (...params) => {
                const HAVE_ENOUGH_DATA = 4;
                const allReady: boolean = params.some((event: any) => event.target.readyState === HAVE_ENOUGH_DATA);

                if (allReady && !this.syncSubscription) {
                    this.startSync();
                    this.syncSubscription.unsubscribe();
                }
            }
        ).subscribe();
    }

    startSync(): void {
        this.syncSubscription = timer(0, 1000).subscribe(
            () => {
                for (const media in this.api.medias) {
                    if (this.api.medias[ media ] !== this) {
                        const diff: number = this.api.medias[ media ].currentTime - this.currentTime;

                        if (diff < -msFloatSub || diff > msFloatSub) {
                            this.playAfterSync = (this.state === VgStates.VG_PLAYING);

                            this.pause();
                            this.api.medias[ media ].pause();
                            this.api.medias[ media ].currentTime = this.currentTime;
                        } else {
                            if (this.playAfterSync) {
                                this.play();
                                this.api.medias[ media ].play();
                                this.playAfterSync = false;
                            }
                        }
                    }
                }
            }
        );
    }

    onMutation(mutations: MutationRecord[]): void {
        // Detect changes only for source elements or src attribute
        for (let i = 0, l = mutations.length; i < l; i++) {
            const mut: MutationRecord = mutations[i];

            if (mut.type === 'attributes' && mut.attributeName === 'src') {
                // Only load src file if it's not a blob (for DASH / HLS sources)
                if (mut.target['src'] && mut.target['src'].length > 0 && mut.target['src'].indexOf('blob:') < 0) {
                    this.loadMedia();
                    break;
                }
            } else if (mut.type === 'childList' && mut.removedNodes.length && mut.removedNodes[0].nodeName.toLowerCase() === 'source') {
                this.loadMedia();
                break;
            }
        }
    }

    loadMedia(): void {
        this.vgMedia.pause();

        this.vgMedia.currentTime = 0;

        // Start buffering until we can play the media file
        this.stopBufferCheck();
        this.isBufferDetected = true;
        this.bufferDetected.next(this.isBufferDetected);

        // TODO: This is ugly, we should find something cleaner. For some reason a TimerObservable doesn't works.
        setTimeout(() => this.vgMedia.load(), 10);
    }

    // tslint:disable-next-line:cyclomatic-complexity
    play(): Promise<any> | undefined {
        // short-circuit if already playing
        if (this.playPromise || (this.state !== VgStates.VG_PAUSED && this.state !== VgStates.VG_ENDED)) {
            return undefined;
        }

        if (this.time.left <= msFloatSub * 1000) {
            this.currentTime = this.offset ? this.offset.start : 0;
        }

        this.playPromise = this.vgMedia.play();

        // browser has async play promise
        if (this.playPromise && this.playPromise.then && this.playPromise.catch) {
            this.playPromise
                .then(() => {
                    this.playPromise = null;
                })
                .catch(() => {
                    this.playPromise = null;
                    // deliberately empty for the sake of eating console noise
                });
        }

        return this.playPromise;
    }

    pause(): void {
        // browser has async play promise
        if (this.playPromise) {
            this.playPromise
                .then(() => {
                    this.vgMedia.pause();
                });
        } else {
            this.vgMedia.pause();
        }
    }

    get id(): string | undefined {
        // We should return undefined if vgMedia still doesn't exist
        let result;

        if (this.vgMedia) {
            result = this.vgMedia.id;
        }

        return result;
    }

    get duration(): number {
        let duration = this.totalTime || this.vgMedia.duration;

        if (duration === Infinity) {
            duration = this.time.total / 1000;
        }
        if (duration < 0) {
            duration = 0;
        }

        return duration;
    }

    set currentTime(seconds: number) {
        this.vgMedia.currentTime = seconds;
        // this.elem.dispatchEvent(new CustomEvent(VgEvents.VG_SEEK));
    }

    get currentTime(): number {
        return this.vgMedia.currentTime;
    }

    get muted(): boolean {
        return this.vgMedia.muted;
    }

    set muted(muted: boolean) {
        this.vgMedia.muted = muted;
    }

    set volume(volume: number) {
        this.vgMedia.volume = volume;
    }

    get volume(): number {
        return this.vgMedia.volume;
    }

    set playbackRate(rate: number) {
        this.vgMedia.playbackRate = rate;
    }

    get playbackRate(): number {
        return this.vgMedia.playbackRate;
    }

    get buffered(): TimeRanges {
        return this.vgMedia.buffered;
    }

    get textTracks(): TextTrackList {
        return this.vgMedia.textTracks;
    }

    onCanPlay(): void {
        this.isBufferDetected = false;
        this.bufferDetected.next(this.isBufferDetected);
        this.canPlay = true;
        this.ref.detectChanges();
    }

    onCanPlayThrough(): void {
        this.isBufferDetected = false;
        this.bufferDetected.next(this.isBufferDetected);
        this.canPlayThrough = true;
        this.ref.detectChanges();
    }

    onLoadMetadata(): void {
        this.isMetadataLoaded = true;

        const total = this.duration * 1000;
        if (this.duration === 0) {
            this.isLivestream = true;
        }

        this.time = {
            current: 0,
            left: 0,
            total,
        };

        this.state = VgStates.VG_PAUSED;
        if (VgUtils.isiOSDevice() && this.elem && this.elem.autoplay) {
            this.play();
        }

        this.ref.detectChanges();
    }

    onWait(): void {
        this.isWaiting = true;
        this.ref.detectChanges();
    }

    onComplete(): void {
        this.isCompleted = true;
        this.state = VgStates.VG_ENDED;
        this.ref.detectChanges();
    }

    onStartPlaying(): void {
        this.state = VgStates.VG_PLAYING;
        this.ref.detectChanges();
    }

    onPlay(): void {
        this.state = VgStates.VG_PLAYING;

        if (this.vgMaster) {
            if (!this.syncSubscription || this.syncSubscription.closed) {
                this.startSync();
            }
        }

        this.startBufferCheck();
        this.ref.detectChanges();
    }

    onPause(): void {
        this.state = VgStates.VG_PAUSED;

        if (this.vgMaster) {
            if (!this.playAfterSync) {
                this.syncSubscription.unsubscribe();
            }
        }

        this.stopBufferCheck();
        this.ref.detectChanges();
    }

    // tslint:disable-next-line:cyclomatic-complexity
    onTimeUpdate(): void {
        const end = this.buffered.length - 1;

        let current: number;
        let total: number;
        if (this.offset) {
            current = (this.currentTime - this.offset.start) * 1000;
            total = (this.offset.end - this.offset.start) * 1000;
        } else {
            current = this.currentTime * 1000;
            if (this.isLivestream && VgUtils.isiOSDevice()) {
                if (this.followsLive && this.currentTime > this.totalTime) {
                    this.totalTime = this.currentTime + this.segmentDuration;
                } else {
                    this.totalTime = (this.time.total + this.checkInterval) / 1000;
                }
                total = this.totalTime * 1000;
            } else {
                total = this.duration * 1000;
            }
        }
        const left = total - current;

        this.time = {
            current,
            total,
            left,
        };

        if (end >= 0) {
            this.buffer = { end: this.buffered.end(end) * 1000 };
        }

        if (this.time.left <= 0) {
            this.pause();
            this.isCompleted = true;
            this.state = VgStates.VG_ENDED;
        }

        // tslint:disable-next-line:no-magic-numbers
        this.followsLive = this.api.isLivestream && !this.api.offset && left <= (this.segmentDuration + 5) * 1000;

        this.ref.detectChanges();
    }

    onProgress(): void {
        const end = this.buffered.length - 1;

        if (end >= 0) {
            this.buffer = { end: this.buffered.end(end) * 1000 };
        }
        this.ref.detectChanges();
    }

    onVolumeChange(): void {
        // TODO: Save to localstorage the current volume
        this.ref.detectChanges();
    }

    onError(): void {
        // TODO: Handle error messages
        this.ref.detectChanges();
    }

    // http://stackoverflow.com/a/23828241/779529
    bufferCheck(): void {
        const offset = 1 / this.checkInterval;
        this.currentPlayPos = this.currentTime;

        if (!this.isBufferDetected && this.currentPlayPos < (this.lastPlayPos + offset)) {
            this.isBufferDetected = true;
        }

        if (this.isBufferDetected && this.currentPlayPos > (this.lastPlayPos + offset)) {
            this.isBufferDetected = false;
        }

        // Prevent calls to bufferCheck after ngOnDestroy have been called
        if (!this.bufferDetected.closed) {
            this.bufferDetected.next(this.isBufferDetected);
        }

        this.lastPlayPos = this.currentPlayPos;
    }

    startBufferCheck(): void {
        this.checkBufferSubscription = timer(0, this.checkInterval).subscribe(
            () => {
                this.bufferCheck();
            }
        );
    }

    stopBufferCheck(): void {
        if (this.checkBufferSubscription) {
            this.checkBufferSubscription.unsubscribe();
        }

        this.isBufferDetected = false;

        this.bufferDetected.next(this.isBufferDetected);
    }

    seekTime(value: number, byPercent: boolean = false): void {
        let second: number;
        const duration = this.duration;

        if (byPercent) {
            second = value * duration / 100;
        } else {
            second = value;
        }

        this.currentTime = second;
    }

    addTextTrack(type: string, label?: string, language?: string, mode?: 'disabled' | 'hidden' | 'showing'): TextTrack {
        const newTrack: TextTrack = this.vgMedia.addTextTrack(type, label, language);

        if (mode) {
            newTrack.mode = mode;
        }
        return newTrack;
    }

    private setOffset(offset: OffsetModel): void {
        if (this.duration > 0 && this.duration < offset.end) {
            offset.end = this.duration;
        }

        if (offset.start < 0) {
            offset.start = 0;
        }

        this.offset = offset;

        this.time.total = (offset.end - offset.start) * 1000;

        if (offset.jumpToStart) {
            this.seekTime(this.offset.start);
        } else if (offset.jumpToEnd) {
            this.seekTime(this.offset.end);
        }
    }

    ngOnDestroy(): void {
        this.vgMedia.src = '';
        this.mutationObs.unsubscribe();
        this.canPlayObs.unsubscribe();
        this.canPlayThroughObs.unsubscribe();
        this.loadedMetadataObs.unsubscribe();
        this.waitingObs.unsubscribe();
        this.progressObs.unsubscribe();
        this.endedObs.unsubscribe();
        this.playingObs.unsubscribe();
        this.playObs.unsubscribe();
        this.pauseObs.unsubscribe();
        this.timeUpdateObs.unsubscribe();
        this.volumeChangeObs.unsubscribe();
        this.errorObs.unsubscribe();

        if (this.checkBufferSubscription) {
            this.checkBufferSubscription.unsubscribe();
        }

        if (this.syncSubscription) {
            this.syncSubscription.unsubscribe();
        }

        this.bufferDetected.complete();
        this.bufferDetected.unsubscribe();

        this.api.unregisterMedia(this);
    }
}
