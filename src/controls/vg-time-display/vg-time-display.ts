import { Component, Input, ElementRef, OnInit, PipeTransform, Pipe, ViewEncapsulation, OnDestroy } from '@angular/core';
import { VgAPI } from '../../core/services/vg-api';
import { Subscription } from 'rxjs';

// Workaround until we can use UTC with Angular Date Pipe
@Pipe({ name: 'vgUtc' })
export class VgUtcPipe implements PipeTransform {
    transform(value: number, format: string): string {
        if (value < 0) {
            console.error('Time shouldn\'t be negative number.');
            value = 0;
        }

        const date = new Date(value);
        let result = format;
        let ss: string|number = date.getUTCSeconds();
        let mm: string|number = date.getUTCMinutes();
        let hh: string|number = date.getUTCHours();

        if (format.includes('mmm')) {

          // tslint:disable-next-line:no-magic-numbers
          const hourToMin = hh * 60;
          mm = mm + hourToMin;

          if (ss < 10) {
            ss = '0' + ss;
          }
          if (mm < 10) {
            mm = '0' + mm;
          }

          result = result.replace(/ss/g, <string>ss);
          result = result.replace(/mmm/g, <string>mm);
          result = result.replace(/hh/g, '');

          return result;
        } else {

          if (ss < 10) {
            ss = '0' + ss;
          }
          if (mm < 10) {
            mm = '0' + mm;
          }
          if (hh < 10) {
            hh = '0' + hh;
          }

          result = result.replace(/ss/g, <string>ss);
          result = result.replace(/mm/g, <string>mm);
          result = result.replace(/hh/g, <string>hh);

          return result;
        }
    }
}

@Component({
    selector: 'vg-time-display',
    encapsulation: ViewEncapsulation.None,
    template: `
        <div
            *ngIf="target?.isLivestream && vgProperty !== 'current' && !API.offset"
            (click)="API.jumpToLive()"
            class="time-display--follow-live-btn"
        >
            <span>LIVE</span>
            <span [class.livestream-dot]="API.followsLive"></span>
        </div>
        <span *ngIf="!(target?.isLivestream && vgProperty !== 'current' && !API.offset)">
            {{ getTime() | vgUtc:vgFormat }}
        </span>
        <ng-content></ng-content>
    `,
    styles: [ `
        vg-time-display {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            display: flex;
            justify-content: center;
            height: 30px;
            width: 60px;
            cursor: pointer;
            color: white;
            line-height: 30px;
            pointer-events: none;
            font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
        }

        .livestream-dot {
            height: 40%;
            width: 20%;
            border-radius: 100%;
            background-color: red;
            margin-left: 10px;
        }

        .time-display--follow-live-btn {
            pointer-events: all;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            height: 100%;
            width: 100%;
        }
    ` ]
})
export class VgTimeDisplayComponent implements OnInit, OnDestroy {
    @Input() vgFor: string;
    @Input() vgProperty = 'current';
    @Input() vgFormat = 'mm:ss';

    elem: HTMLElement;
    target: any;

    subscriptions: Subscription[] = [];

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
        if (this.vgFor) {
            this.target = this.API.getMediaById(this.vgFor);
        } else {
            this.target = this.API.getDefaultMedia();
        }
    }

    getTime(): number {
        let t = 0;

        if (this.target) {
            t = Math.round(this.target.time[ this.vgProperty ]);
            t = isNaN(t) ? 0 : t;
        }

        return t;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
