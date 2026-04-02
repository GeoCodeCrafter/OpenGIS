import { describe, it, expect } from 'vitest';
import { crsService } from '../src/services/crs/CRSService';

describe('CRSService', () => {
  describe('getAll', () => {
    it('returns pre-registered CRS definitions', () => {
      const all = crsService.getAll();
      expect(all.length).toBeGreaterThanOrEqual(11);
    });
  });

  describe('get', () => {
    it('returns WGS 84 for EPSG:4326', () => {
      const crs = crsService.get('EPSG:4326');
      expect(crs).toBeDefined();
      expect(crs!.name).toBe('WGS 84');
      expect(crs!.category).toBe('geographic');
      expect(crs!.units).toBe('degrees');
    });

    it('returns Web Mercator for EPSG:3857', () => {
      const crs = crsService.get('EPSG:3857');
      expect(crs).toBeDefined();
      expect(crs!.name).toContain('Pseudo-Mercator');
      expect(crs!.category).toBe('projected');
      expect(crs!.units).toBe('meters');
    });

    it('returns undefined for unknown code', () => {
      expect(crsService.get('EPSG:99999')).toBeUndefined();
    });
  });

  describe('search', () => {
    it('finds CRS by code', () => {
      const results = crsService.search('4326');
      expect(results.some((r) => r.code === 'EPSG:4326')).toBe(true);
    });

    it('finds CRS by name', () => {
      const results = crsService.search('British');
      expect(results.some((r) => r.code === 'EPSG:27700')).toBe(true);
    });

    it('finds CRS by area', () => {
      const results = crsService.search('France');
      expect(results.some((r) => r.code === 'EPSG:2154')).toBe(true);
    });

    it('returns all for empty query', () => {
      const results = crsService.search('');
      expect(results.length).toBeGreaterThanOrEqual(11);
    });

    it('returns empty for no match', () => {
      const results = crsService.search('zzzzzzz_no_match');
      expect(results.length).toBe(0);
    });
  });

  describe('getPopular', () => {
    it('returns expected popular CRS', () => {
      const popular = crsService.getPopular();
      expect(popular.length).toBeGreaterThanOrEqual(4);
      expect(popular.some((c) => c.code === 'EPSG:4326')).toBe(true);
      expect(popular.some((c) => c.code === 'EPSG:3857')).toBe(true);
    });
  });

  describe('getByCategory', () => {
    it('filters geographic CRS', () => {
      const geo = crsService.getByCategory('geographic');
      expect(geo.length).toBeGreaterThanOrEqual(2);
      expect(geo.every((c) => c.category === 'geographic')).toBe(true);
    });

    it('filters projected CRS', () => {
      const proj = crsService.getByCategory('projected');
      expect(proj.length).toBeGreaterThanOrEqual(8);
      expect(proj.every((c) => c.category === 'projected')).toBe(true);
    });
  });

  describe('favorites and recent', () => {
    it('manages favorites', () => {
      crsService.toggleFavorite('EPSG:4326');
      expect(crsService.isFavorite('EPSG:4326')).toBe(true);
      expect(crsService.getFavorites().some((c) => c.code === 'EPSG:4326')).toBe(true);

      crsService.toggleFavorite('EPSG:4326');
      expect(crsService.isFavorite('EPSG:4326')).toBe(false);
    });

    it('manages recent', () => {
      crsService.addRecent('EPSG:32632');
      crsService.addRecent('EPSG:4326');
      const recent = crsService.getRecent();
      expect(recent[0].code).toBe('EPSG:4326');
      expect(recent[1].code).toBe('EPSG:32632');
    });

    it('deduplicates recent entries', () => {
      crsService.addRecent('EPSG:4326');
      crsService.addRecent('EPSG:3857');
      crsService.addRecent('EPSG:4326');
      const recent = crsService.getRecent();
      const count4326 = recent.filter((c) => c.code === 'EPSG:4326').length;
      expect(count4326).toBe(1);
      expect(recent[0].code).toBe('EPSG:4326');
    });
  });

  describe('register', () => {
    it('registers a new CRS', async () => {
      const crs = await crsService.register(
        'EPSG:9999',
        '+proj=longlat +datum=WGS84 +no_defs',
        'Test CRS',
      );
      expect(crs.code).toBe('EPSG:9999');
      expect(crs.name).toBe('Test CRS');
      expect(crs.category).toBe('geographic');
      expect(crsService.get('EPSG:9999')).toBeDefined();
    });
  });

  describe('transform', () => {
    it('transforms between EPSG:4326 and EPSG:3857', () => {
      // London: roughly 51.5°N, -0.12°W
      const [x, y] = crsService.transform([-0.12, 51.5], 'EPSG:4326', 'EPSG:3857');
      // Web Mercator X for 0.12W should be around -13358
      expect(x).toBeCloseTo(-13358.34, 0);
      // Web Mercator Y for 51.5N should be around 6710219
      expect(y).toBeCloseTo(6710219, -2);
    });
  });

  describe('validate', () => {
    it('validates known CRS', () => {
      const result = crsService.validate('EPSG:4326');
      expect(result.valid).toBe(true);
    });

    it('invalidates unknown CRS', () => {
      const result = crsService.validate('EPSG:00000');
      expect(result.valid).toBe(false);
    });
  });
});
