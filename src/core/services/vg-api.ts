import { OffsetModel } from './../vg-media/offset.model';
import { Injectable, EventEmitter } from '@angular/core';
import { PlayableModel } from '../vg-media/i-playable';
import { VgStates } from '../states/vg-states';
import { VgFullscreenAPI } from './vg-fullscreen-api';

@Injectable()
export class VgAPI {
    medias: {} = {}; // TODO: refactor to Set<PlayableModel>
    videogularElement: any;
    playerReadyEvent: EventEmitter<any> = new EventEmitter(true);
    isPlayerReady = false;
    fsAPI: VgFullscreenAPI;

    onPlayerReady(fsAPI: VgFullscreenAPI): void {
        this.fsAPI = fsAPI;
        this.isPlayerReady = true;
        this.playerReadyEvent.emit(this);
    }

    getDefaultMedia(): PlayableModel {
        for (const item in this.medias) {
            if (this.medias[item]) {
                return this.medias[item];
            }
        }

        return undefined;
    }

    getMasterMedia(): PlayableModel {
        let master: any;
        for (const id in this.medias) {
            if (this.medias[id].vgMaster === 'true' || this.medias[id].vgMaster === true) {
                master = this.medias[id];
                break;
            }
        }
        return master || this.getDefaultMedia();
    }

    isMasterDefined(): boolean {
        let result = false;
        for (const id in this.medias) {
            if (this.medias[id].vgMaster === 'true' || this.medias[id].vgMaster === true) {
                result = true;
                break;
            }
        }
        return result;
    }

    getMediaById(id: string = null): PlayableModel {
        let media = this.medias[id];

        if (!id || id === '*') {
            media = this;
        }

        return media;
    }

    play(): void {
        for (const id in this.medias) {
            if (this.medias[id]) {
                this.medias[ id ].play();
            }
        }
    }

    pause(): void {
        for (const id in this.medias) {
            if (this.medias[id]) {
                this.medias[id].pause();
            }
        }
    }

    jumpToLive(): boolean {
        if (!this.isLivestream || this.followsLive) {
            return false;
        }

        const media = this.getDefaultMedia();
        this.seekTime(Number.MAX_SAFE_INTEGER);
        setTimeout(
            () => {
                // Edge doesn't respect timeout so left time is not updated => it jump to start of video
                media.time.left = 400;
                this.play();
            },
            // tslint:disable-next-line:no-magic-numbers
            250,
        );

        return true;
    }

    get duration(): number {
        return this.$$getAllProperties('duration');
    }

    get segmentDuration(): number {
        return this.$$getAllProperties('segmentDuration');
    }

    set currentTime(seconds: number) {
        this.$$setAllProperties('currentTime', seconds);
    }

    get currentTime(): number {
        return this.$$getAllProperties('currentTime');
    }

    set state(state: string) {
        this.$$setAllProperties('state', state);
    }

    get state(): string {
        return this.$$getAllProperties('state');
    }

    get muted(): boolean {
        return this.$$getAllProperties('muted');
    }

    set muted(muted: boolean) {
        this.$$setAllProperties('muted', muted);
    }

    set volume(volume: number) {
        this.$$setAllProperties('volume', volume);
    }

    get volume(): number {
        return this.$$getAllProperties('volume');
    }

    set playbackRate(rate: any) {
        this.$$setAllProperties('playbackRate', rate);
    }

    get playbackRate(): any {
        return this.$$getAllProperties('playbackRate');
    }

    get canPlay(): boolean {
        return this.$$getAllProperties('canPlay');
    }

    get canPlayThrough(): boolean {
        return this.$$getAllProperties('canPlayThrough');
    }

    get isMetadataLoaded(): boolean {
        return this.$$getAllProperties('isMetadataLoaded');
    }

    get isWaiting(): boolean {
        return this.$$getAllProperties('isWaiting');
    }

    get isCompleted(): boolean {
        return this.$$getAllProperties('isCompleted');
    }

    get isLivestream(): boolean {
        return this.$$getAllProperties('isLivestream');
    }

    get isMaster(): boolean {
        return this.$$getAllProperties('isMaster');
    }

    get offset(): OffsetModel {
        return this.$$getAllProperties('offset');
    }

    get time(): any {
        return this.$$getAllProperties('time');
    }

    get buffer(): any {
        return this.$$getAllProperties('buffer');
    }

    get buffered(): any {
        return this.$$getAllProperties('buffered');
    }

    get subscriptions(): any {
        return this.$$getAllProperties('subscriptions');
    }

    get textTracks(): any {
        return this.$$getAllProperties('textTracks');
    }

    get followsLive(): boolean {
        return this.$$getAllProperties('followsLive');
    }

    seekTime(value: number, byPercent: boolean = false): void {
        for (const id in this.medias) {
            if (this.medias[id]) {
                this.$$seek(this.medias[ id ], value, byPercent);
            }
        }
    }

    $$seek(media: PlayableModel, value: number, byPercent: boolean = false): void {
        let second: number;
        let duration: number = media.duration;

        if (byPercent) {
            if (this.isMasterDefined()) {
                const masterMedia = this.getMasterMedia();
                duration = masterMedia.duration;
            }

            if (media.offset) {
                const offsetDuration = media.offset.end - media.offset.start;
                second = (value * offsetDuration / 100) + media.offset.start;
            } else {
                second = value * duration / 100;
            }
        } else {
            second = value;
        }

        media.currentTime = second;
    }

    addTextTrack(type: string, label?: string, language?: string): void {
        for (const id in this.medias) {
            if (this.medias[id]) {
                this.$$addTextTrack(this.medias[ id ], type, label, language);
            }
        }
    }
    $$addTextTrack(media: PlayableModel, type: string, label?: string, language?: string): void {
        media.addTextTrack(type, label, language);
    }

    $$getAllProperties(property: string): any {
        const medias = {};
        let result: any;

        for (const id in this.medias) {
            if (this.medias[id]) {
                medias[ id ] = this.medias[ id ];
            }
        }

        const nMedias = Object.keys(medias).length;
        switch (nMedias) {
            case 0:
                // Return default values until vgMedia is initialized
                switch (property) {
                    case 'state':
                        result = VgStates.VG_PAUSED;
                        break;

                    case 'playbackRate':
                    case 'volume':
                        result = 1;
                        break;

                    case 'time':
                        result = {current: 0, total: 0, left: 0};
                        break;
                }
                break;

            case 1:
                // If there's only one media element then return the plain value
                const firstMediaId = Object.keys(medias)[0];
                result = medias[firstMediaId][property];
                break;

            default:
                // TODO: return 'master' value
                const master = this.getMasterMedia();
                result = medias[master.id][property];
        }

        return result;
    }

    $$setAllProperties(property: string, value: any): void {
        for (const id in this.medias) {
            if (this.medias[id]) {
                this.medias[id][property] = value;
            }
        }
    }

    registerElement(elem: HTMLElement): void {
        this.videogularElement = elem;
    }

    registerMedia(media: PlayableModel): void {
        this.medias[media.id] = media;
        this.medias[media.id].currentTime = media.offset ? media.offset.start : 0;
    }

    unregisterMedia(media: PlayableModel): void {
        // tslint:disable-next-line:no-delete no-dynamic-delete
        delete this.medias[media.id];
    }
}
