import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, DoCheck } from '@angular/core';
import { VgEvents } from '../events/vg-events';
import { Observable ,  Subscription, fromEvent } from 'rxjs';

@Directive({
    selector: '[vgCuePoints]'
})
export class VgCuePointsDirective implements OnInit, OnDestroy, DoCheck {
    @Output('onEnterCuePoint') onEnterCuePoint: EventEmitter<any> = new EventEmitter();
    @Output('onUpdateCuePoint') onUpdateCuePoint: EventEmitter<any> = new EventEmitter();
    @Output('onExitCuePoint') onExitCuePoint: EventEmitter<any> = new EventEmitter();
    @Output('onCompleteCuePoint') onCompleteCuePoint: EventEmitter<any> = new EventEmitter();

    subscriptions: Subscription[] = [];
    cuesSubscriptions: Subscription[] = [];

    onLoad$: Observable<any>;
    onEnter$: Observable<any>;
    onExit$: Observable<any>;

    totalCues = 0;

    constructor(public ref: ElementRef) {
    }

    ngOnInit(): void {
        this.onLoad$ = fromEvent(this.ref.nativeElement, VgEvents.VG_LOAD);
        this.subscriptions.push(this.onLoad$.subscribe(this.onLoad.bind(this)));
    }

    onLoad(event: any): void {
        const cues: TextTrackCue[] = event.target.track.cues;

        this.ref.nativeElement.cues = cues;

        this.updateCuePoints(cues);
    }

    updateCuePoints(cues: TextTrackCue[]): void {
        this.cuesSubscriptions.forEach(s => s.unsubscribe());

        for (let i = 0, l = cues.length; i < l; i++) {
            this.onEnter$ = fromEvent(cues[ i ], VgEvents.VG_ENTER);
            this.cuesSubscriptions.push(this.onEnter$.subscribe(this.onEnter.bind(this)));

            this.onExit$ = fromEvent(cues[ i ], VgEvents.VG_EXIT);
            this.cuesSubscriptions.push(this.onExit$.subscribe(this.onExit.bind(this)));
        }
    }

    onEnter(event: any): void {
        this.onEnterCuePoint.emit(event.target);
    }

    onExit(event: any): void {
        this.onExitCuePoint.emit(event.target);
    }

    ngDoCheck(): void {
        if (this.ref.nativeElement.cues) {
            const changes = this.totalCues !== this.ref.nativeElement.track.cues.length;

            if (changes) {
                this.totalCues = this.ref.nativeElement.track.cues.length;
                this.ref.nativeElement.cues = this.ref.nativeElement.track.cues;
                this.updateCuePoints(this.ref.nativeElement.track.cues);
            }
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
