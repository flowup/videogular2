import { EventEmitter, Injectable, QueryList } from '@angular/core';
import { VgUtils } from './vg-utils';
import { VgMediaDirective } from '../vg-media/vg-media';
import { Subscription, fromEvent } from 'rxjs';

@Injectable()
export class VgFullscreenAPI {
    polyfill: any;
    onchange: string;
    onerror: string;
    nativeFullscreen = true;
    isFullscreen = false;
    isAvailable: boolean;
    videogularElement: HTMLElement;
    medias: QueryList<VgMediaDirective>;

    fsChangeSubscription: Subscription;
    onChangeFullscreen: EventEmitter<any> = new EventEmitter();

    init(elem: HTMLElement, medias: QueryList<VgMediaDirective>): void {
        this.videogularElement = elem;
        this.medias = medias;

        // tslint:disable-next-line:variable-name
        const APIs = {
            w3: {
                enabled: 'fullscreenEnabled',
                element: 'fullscreenElement',
                request: 'requestFullscreen',
                exit: 'exitFullscreen',
                onchange: 'fullscreenchange',
                onerror: 'fullscreenerror'
            },
            newWebkit: {
                enabled: 'webkitFullscreenEnabled',
                element: 'webkitFullscreenElement',
                request: 'webkitRequestFullscreen',
                exit: 'webkitExitFullscreen',
                onchange: 'webkitfullscreenchange',
                onerror: 'webkitfullscreenerror'
            },
            oldWebkit: {
                enabled: 'webkitIsFullScreen',
                element: 'webkitCurrentFullScreenElement',
                request: 'webkitRequestFullScreen',
                exit: 'webkitCancelFullScreen',
                onchange: 'webkitfullscreenchange',
                onerror: 'webkitfullscreenerror'
            },
            moz: {
                enabled: 'mozFullScreen',
                element: 'mozFullScreenElement',
                request: 'mozRequestFullScreen',
                exit: 'mozCancelFullScreen',
                onchange: 'mozfullscreenchange',
                onerror: 'mozfullscreenerror'
            },
            ios: {
                enabled: 'webkitFullscreenEnabled',
                element: 'webkitFullscreenElement',
                request: 'webkitEnterFullscreen',
                exit: 'webkitExitFullscreen',
                onchange: 'webkitendfullscreen', // Hack for iOS: webkitfullscreenchange it's not firing
                onerror: 'webkitfullscreenerror'
            },
            ms: {
                enabled: 'msFullscreenEnabled',
                element: 'msFullscreenElement',
                request: 'msRequestFullscreen',
                exit: 'msExitFullscreen',
                onchange: 'MSFullscreenChange',
                onerror: 'MSFullscreenError'
            }
        };

        for (const browser in APIs) {
            if (APIs[ browser ].enabled in document) {
                this.polyfill = APIs[ browser ];
                break;
            }
        }

        if (VgUtils.isiOSDevice()) {
            this.polyfill = APIs.ios;
        }

        this.isAvailable = (this.polyfill != null);

        if (this.polyfill == null) {
            return;
        }

        let fsElemDispatcher;

        switch (this.polyfill.onchange) {
            // Mozilla dispatches the fullscreen change event from document, not the element
            // See: https://bugzilla.mozilla.org/show_bug.cgi?id=724816#c3
            case 'mozfullscreenchange':
                fsElemDispatcher = document;
                break;

            // iOS dispatches the fullscreen change event from video element
            case 'webkitendfullscreen':
                fsElemDispatcher = this.medias.toArray()[ 0 ].elem;
                break;

            // HTML5 implementation dispatches the fullscreen change event from the element
            default:
                fsElemDispatcher = elem;
        }

        this.fsChangeSubscription = fromEvent(fsElemDispatcher, this.polyfill.onchange).subscribe(() => {
            this.onFullscreenChange();
        });
    }

    onFullscreenChange(): void {
        this.isFullscreen = !!document[ this.polyfill.element ];
        this.onChangeFullscreen.emit(this.isFullscreen);
    }

    toggleFullscreen(element: any = null): void {
        if (this.isFullscreen) {
            this.exit();
        } else {
            this.request(element);
        }
    }

    request(elem: any): void {
        if (!elem) {
            elem = this.videogularElement;
        }

        this.isFullscreen = true;
        this.onChangeFullscreen.emit(true);

        // Perform native full screen support
        if (this.isAvailable && this.nativeFullscreen) {
            // Fullscreen for mobile devices
            if (VgUtils.isMobileDevice()) {
                // We should make fullscreen the video object if it doesn't have native fullscreen support
                // Fallback! We can't set vg-player on fullscreen, only video/audio objects
                if ((!this.polyfill.enabled && elem === this.videogularElement) || VgUtils.isiOSDevice()) {
                    elem = this.medias.toArray()[ 0 ].elem;
                }

                this.enterElementInFullScreen(elem);
            } else {
                this.enterElementInFullScreen(this.videogularElement);
            }
        }
    }

    enterElementInFullScreen(elem: any): void {
        elem[ this.polyfill.request ]();
    }

    exit(): void {
        this.isFullscreen = false;
        this.onChangeFullscreen.emit(false);

        // Exit from native fullscreen
        if (this.isAvailable && this.nativeFullscreen) {
            document[ this.polyfill.exit ]();
        }
    }
}
