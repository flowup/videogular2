import { Injectable } from '@angular/core';

@Injectable()
export class VgUtils {
    /**
     * Inspired by Paul Irish
     * https://gist.github.com/paulirish/211209
     * @returns {number}
     */
    static getZIndex(): number {
        let zIndex = 1;
        let elementZIndex: number;

        const tags = document.getElementsByTagName('*');

        for (let i = 0, l = tags.length; i < l; i++) {
            elementZIndex = parseInt(window.getComputedStyle(tags[i])['z-index'], 10);

            if (elementZIndex > zIndex) {
                zIndex = elementZIndex + 1;
            }
        }

        return zIndex;
    }

    // Very simple mobile detection, not 100% reliable
    static isMobileDevice(): boolean {
        return (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1);
    }

    static isiOSDevice(): boolean {
        return (navigator.userAgent.match(/ip(hone|ad|od)/i) && !navigator.userAgent.match(/(iemobile)[\/\s]?([\w\.]*)/i));
    }

    static isCordova(): boolean {
        return document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
    }
}
