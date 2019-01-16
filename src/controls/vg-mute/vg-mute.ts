import { VgUtils } from './../../core/services/vg-utils';
import { Component, Input, ElementRef, HostListener, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { VgAPI } from '../../core/services/vg-api';
import { Subscription } from 'rxjs';

@Component({
    selector: 'vg-mute',
    encapsulation: ViewEncapsulation.None,
    template: `
        <div class="icon"
             [class.vg-icon-volume_up]="getVolume() >= 0.75 && !muted()"
             [class.vg-icon-volume_down]="getVolume() >= 0.25 && getVolume() < 0.75"
             [class.vg-icon-volume_mute]="getVolume() > 0 && getVolume() < 0.25"
             [class.vg-icon-volume_off]="getVolume() === 0 || muted()"
             tabindex="0"
             role="button"
             aria-label="mute button"
             [attr.aria-valuetext]="ariaValue">
        </div>`,
    styles: [ `
        vg-mute {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            display: flex;
            justify-content: center;
            height: 50px;
            width: 50px;
            cursor: pointer;
            color: white;
            line-height: 50px;
        }

        vg-mute .icon {
            pointer-events: none;
        }
    ` ]
})
export class VgMuteComponent implements OnInit, OnDestroy {
    @Input() vgFor: string;
    elem: HTMLVideoElement;
    target: any;

    currentVolume: number;

    subscriptions: Subscription[] = [];

    ariaValue = 'unmuted';

    constructor(ref: ElementRef, public API: VgAPI) {
        this.elem = ref.nativeElement;
    }

    ngOnInit(): void {
        if (this.API.isPlayerReady) {
            this.onPlayerReady();
        } else {
            this.subscriptions.push(this.API.playerReadyEvent.subscribe(() => this.onPlayerReady()));
        }
    }

    onPlayerReady(): void {
        this.target = this.API.getMediaById(this.vgFor);
        this.currentVolume = this.target.volume;
    }

    @HostListener('click')
    onClick(): void {
        this.changeMuteState();
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        // On press Enter (13) or Space (32)
        // TODO: Remove keycode
        /* tslint:disable-next-line:no-magic-numbers */
        if (event.keyCode === 13 || event.keyCode === 32) {
            event.preventDefault();
            this.changeMuteState();
        }
    }

    changeMuteState(): void {
        const volume = this.getVolume();

        // iOS doesn't allow to change volume of media via HTML controls
        if (this.target && VgUtils.isiOSDevice()) {
            this.target.muted = !this.target.muted;
            return;
        }

        if (volume === 0) {
            if (this.target.volume === 0 && this.currentVolume === 0) {
                this.currentVolume = 1;
            }

            this.target.volume = this.currentVolume;
            if (this.target) {
                this.target.muted = false;
            }
        } else {
            this.currentVolume = volume;
            this.target.volume = 0;
            if (this.target) {
                this.target.muted = true;
            }
        }

    }

    getVolume(): number {
        const volume = this.target ? this.target.volume : 0;
        this.ariaValue = volume ? 'unmuted' : 'muted';
        return volume;
    }

    muted(): boolean {
        return this.target ? this.target.muted : false;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
