// tslint:disable-next-line:no-reference
///<reference path='./google.ima.ts'/>
import { Component, ElementRef, Input, HostBinding, ViewEncapsulation, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { PlayableModel } from '../core/vg-media/i-playable';
import { VgAPI } from '../core/services/vg-api';
import { VgEvents } from '../core/events/vg-events';
import { VgFullscreenAPI } from '../core/services/vg-fullscreen-api';
import { Subscription } from 'rxjs';

@Component({
    selector: 'vg-ima-ads',
    encapsulation: ViewEncapsulation.None,
    template: `<div class="vg-ima-ads"></div>`,
    styles: [ `
        vg-ima-ads {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 300;
        }
        vg-ima-ads .vg-ima-ads {
            position: absolute;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
    ` ]
})
export class VgImaAds implements OnInit, OnDestroy {
    @Input() vgFor: string;
    @Input() vgNetwork: string;
    @Input() vgUnitPath: string;
    @Input() vgCompanion: string;
    @Input() vgCompanionSize: number[];
    @Input() vgAdTagUrl: string;
    @Input() vgSkipButton: string;

    @Output() onAdStart: EventEmitter<boolean> = new EventEmitter();
    @Output() onAdStop: EventEmitter<boolean> = new EventEmitter();
    @Output() onSkipAd: EventEmitter<boolean> = new EventEmitter();

    elem: HTMLElement;
    target: PlayableModel;
    ima: Ima;
    isFullscreen = false;
    skipButton: HTMLElement;

    subscriptions: Subscription[] = [];

    @HostBinding('style.display') displayState = 'none';

    constructor(ref: ElementRef, public API: VgAPI, public fsAPI: VgFullscreenAPI) {
        this.elem = ref.nativeElement;
        this.onContentEnded = this.onContentEnded.bind(this);
    }

    ngOnInit(): void {
        if (this.API.isPlayerReady) {
            this.onPlayerReady();
        } else {
            this.subscriptions.push(this.API.playerReadyEvent.subscribe(() => this.onPlayerReady()));
        }
    }

    onPlayerReady(): void {
        if (typeof google === 'undefined') {
            this.onMissingGoogleImaLoader();
            return;
        }

        this.target = this.API.getMediaById(this.vgFor);

        this.initializations();

        this.subscriptions.push(this.target.subscriptions.ended.subscribe(this.onContentEnded.bind(this)));
        this.subscriptions.push(this.target.subscriptions.play.subscribe(this.onUpdateState.bind(this)));

        this.subscriptions.push(this.fsAPI.onChangeFullscreen.subscribe(this.onChangeFullscreen.bind(this)));

        this.ima.adsLoader.addEventListener(
            google.ima.AdsManagerLoadedEvent.type.ADS_MANAGER_LOADED,
            this.onAdsManagerLoaded.bind(this),
            false
        );
        this.ima.adsLoader.addEventListener(
            google.ima.AdErrorEvent.type.AD_ERROR,
            this.onAdError.bind(this),
            false
        );

        this.loadAds();
    }

    initializations(): void {
        this.ima = new Ima(this.elem);

        if (this.vgSkipButton) {
            this.skipButton = document.querySelector(this.vgSkipButton) as HTMLElement;
            this.skipButton.style.display = 'none';
            this.skipButton.addEventListener('click', this.onClickSkip.bind(this));
            this.elem.insertBefore(this.skipButton, this.elem.firstChild);
        }

        window.addEventListener('resize', () => {
            const w = this.API.videogularElement.offsetWidth;
            const h = this.API.videogularElement.offsetHeight;

            if (this.ima.adsManager) {
                if (this.isFullscreen) {
                    this.ima.adsManager.resize(w, h, google.ima.ViewMode.FULLSCREEN);
                } else {
                    this.ima.adsManager.resize(w, h, google.ima.ViewMode.NORMAL);
                }
            }
        });
    }

    loadAds(): void {
        if (this.vgCompanion) {
            googletag.cmd.push(
                () => {
                    const adUnitPath = `/${this.vgNetwork}/${this.vgUnitPath}`;
                    const slot: googletag.Slot = googletag.defineSlot(adUnitPath, this.vgCompanionSize, this.vgCompanion);

                    if (slot) {
                        slot.addService(googletag.companionAds());
                        slot.addService(googletag.pubads());

                        googletag
                            .companionAds()
                            .setRefreshUnfilledSlots(true);

                        googletag
                            .pubads()
                            .enableVideoAds();

                        googletag.enableServices();
                    }
                }
            );
        }
    }

    onUpdateState(event: any): void {
        switch (event.type) {
            case VgEvents.VG_PLAY:
                if (!this.ima.adsLoaded) {
                    this.API.pause();
                    this.ima.adDisplayContainer.initialize();
                    this.requestAds(this.vgAdTagUrl);
                    this.ima.adsLoaded = true;
                }
                break;
        }
    }

    requestAds(adTagUrl: string): void {
        // Show only to get computed style in pixels
        this.show();

        const adsRequest = new google.ima.AdsRequest();
        const computedStyle = window.getComputedStyle(this.elem);
        adsRequest.adTagUrl = adTagUrl;

        adsRequest.linearAdSlotWidth = parseInt(computedStyle.width, 10);
        adsRequest.linearAdSlotHeight = parseInt(computedStyle.height, 10);
        adsRequest.nonLinearAdSlotWidth = parseInt(computedStyle.width, 10);
        adsRequest.nonLinearAdSlotHeight = parseInt(computedStyle.height, 10);

        this.ima.adsLoader.requestAds(adsRequest);
    }

    onAdsManagerLoaded(evt: google.ima.AdsManagerLoadedEvent): void {
        this.show();
        this.ima.adsManager = evt.getAdsManager(this.target);
        this.processAdsManager();
    }

    processAdsManager(): void {
        const w = this.API.videogularElement.offsetWidth;
        const h = this.API.videogularElement.offsetHeight;

        // Attach the pause/resume events.
        this.ima.adsManager.addEventListener(
            google.ima.AdEvent.type.CONTENT_PAUSE_REQUESTED,
            this.onContentPauseRequested.bind(this),
            false
        );
        this.ima.adsManager.addEventListener(
            google.ima.AdEvent.type.CONTENT_RESUME_REQUESTED,
            this.onContentResumeRequested.bind(this),
            false
        );
        this.ima.adsManager.addEventListener(
            google.ima.AdEvent.type.SKIPPABLE_STATE_CHANGED,
            this.onSkippableStateChanged.bind(this),
            false
        );
        this.ima.adsManager.addEventListener(
            google.ima.AdEvent.type.ALL_ADS_COMPLETED,
            this.onAllAdsComplete.bind(this),
            false
        );
        this.ima.adsManager.addEventListener(
            google.ima.AdEvent.type.COMPLETE,
            this.onAdComplete.bind(this),
            false
        );
        this.ima.adsManager.addEventListener(
            google.ima.AdErrorEvent.type.AD_ERROR,
            this.onAdError.bind(this),
            false
        );

        this.ima.adsManager.init(w, h, google.ima.ViewMode.NORMAL);
        this.ima.adsManager.start();
    }

    onSkippableStateChanged(): void {
        const isSkippable = this.ima.adsManager.getAdSkippableState();

        if (isSkippable) {
            this.skipButton.style.display = 'block';
        } else {
            this.skipButton.style.display = 'none';
        }
    }

    onClickSkip(): void {
        this.ima.adsManager.skip();
        this.onSkipAd.emit(true);
    }

    onContentPauseRequested(): void {
        this.show();
        this.API.pause();
        this.onAdStop.emit(true);
    }

    onContentResumeRequested(): void {
        this.API.play();
        this.onAdStart.emit(true);
        this.hide();
    }

    onAdError(): void {
        if (this.ima.adsManager) {
            this.ima.adsManager.destroy();
        }
        this.hide();
        this.API.play();
        this.onAdStop.emit(true);
    }

    onAllAdsComplete(): void {
        this.hide();
        // The last ad was a post-roll
        if (this.ima.adsManager.getCuePoints().join().indexOf('-1') >= 0) {
            this.API.pause(); // it was stop() in Videogular v1
            this.onAdStop.emit(true);
        }
    }

    onAdComplete(): void {
        // TODO: Update view with current ad count
        this.ima.currentAd++;
        this.onAdStop.emit(true);
    }

    show(): void {
        window.dispatchEvent(new CustomEvent(VgEvents.VG_START_ADS));
        this.displayState = 'block';
    }

    hide(): void {
        window.dispatchEvent(new CustomEvent(VgEvents.VG_END_ADS));
        this.displayState = 'none';
    }

    onContentEnded(): void {
        this.ima.adsLoader.contentComplete();
        this.onAdStop.emit(true);
    }

    onChangeFullscreen(fsState: boolean): void {
        if (!this.fsAPI.nativeFullscreen) {
            this.isFullscreen = fsState;
        }
    }

    private onMissingGoogleImaLoader(): void {
        this.hide();
        this.API.play();
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}


export class Ima {
    adDisplayContainer: google.ima.AdDisplayContainer;
    adsLoader: google.ima.AdsLoader;
    adsManager: google.ima.AdsManager;
    adsLoaded: boolean;
    currentAd: number;

    constructor(imaAdsElement: HTMLElement) {
        this.adDisplayContainer = new google.ima.AdDisplayContainer(imaAdsElement);
        this.adsLoader = new google.ima.AdsLoader(this.adDisplayContainer);

        this.adsManager = null;
        this.adsLoaded = false;
        this.currentAd = 0;
    }
}
