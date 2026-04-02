import type OlMap from 'ol/Map';

let _map: OlMap | null = null;

export const mapRegistry = {
  set(map: OlMap | null) { _map = map; },
  get(): OlMap | null { return _map; },
};
