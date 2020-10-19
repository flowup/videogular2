import { VgFullscreenComponent } from './vg-fullscreen';
import { VgAPI } from '../../core/services/vg-api';
import { ElementRef } from '@angular/core';
import { VgFullscreenAPI } from '../../core/services/vg-fullscreen-api';

describe('Videogular Player', () => {
  let fullscreen: VgFullscreenComponent;
  let ref: ElementRef;
  let api: VgAPI;
  let fsAPI: VgFullscreenAPI;

  beforeEach(() => {
    ref = {
      nativeElement: {
        getAttribute: (name) => {
          return name;
        }
      }
    };

    api = new VgAPI();
    fsAPI = new VgFullscreenAPI();
    fullscreen = new VgFullscreenComponent(ref, api, fsAPI);
  });

  it('Should get media by id on init', () => {
    spyOn(api, 'getMediaById').and.callFake(() => <any>{});

    fullscreen.vgFor = 'test';
    fullscreen.onPlayerReady();

    expect(api.getMediaById).toHaveBeenCalledWith('test');
  });

  describe('onClick', () => {
    beforeEach(() => {
      spyOn(fsAPI, 'toggleFullscreen');
    });

    it('Should call toggleFullscreen with null param if target is API', () => {
      fullscreen.target = api;

      fullscreen.onClick();

      expect(fsAPI.toggleFullscreen).toHaveBeenCalledWith(null);
    });

    it('Should call toggleFullscreen with target param if target', () => {
      fullscreen.target = 'test';

      fullscreen.onClick();

      expect(fsAPI.toggleFullscreen).toHaveBeenCalledWith('test');
    });
  });
});
