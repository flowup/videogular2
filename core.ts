export * from './src/core/core';

// CustomEvent polyfill for IE9/10/11
// tslint:disable-next-line:only-arrow-functions
(function (): void {

    if ( typeof window === 'undefined' || typeof window['CustomEvent'] === 'function' ) {
        return;
    }

    function CustomEvent(event: string, params: any): CustomEvent<any> {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        const evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    }

    CustomEvent.prototype = window['Event'].prototype;

    window['CustomEvent'] = CustomEvent;
})();
