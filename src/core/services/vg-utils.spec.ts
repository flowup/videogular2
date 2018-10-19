/* tslint:disable:no-magic-numbers */
import { VgUtils } from './vg-utils';

describe('Videogular Utils', () => {
    it('Should get the highest z-index', () => {
        spyOn(window, 'getComputedStyle').and.callFake(() =>
            ({
                'z-index': 2
            }));

        const highestZ = VgUtils.getZIndex();

        expect(highestZ).toBe(3);
    });

    it('Should get if is a mobile device', () => {
        (window as any).orientation = 'true';

        const isMobileDevice = VgUtils.isMobileDevice();

        expect(isMobileDevice).toBeTruthy();
    });

    it('Should get if is an iOS device', () => {
        const isiOS = VgUtils.isiOSDevice();

        expect(isiOS).toBeFalsy();
    });

    it('Should get if is a Cordova app', () => {
        const isCordova = VgUtils.isCordova();

        expect(isCordova).toBeFalsy();
    });
});
