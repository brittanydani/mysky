import { SHADOW_TRIGGERS_22, TRIGGER_TAXONOMY_22 } from '../triggerTaxonomy22';

describe('triggerTaxonomy22', () => {
  describe('SHADOW_TRIGGERS_22', () => {
    it('has 22 triggers', () => {
      expect(SHADOW_TRIGGERS_22).toHaveLength(22);
    });

    it('all are strings', () => {
      SHADOW_TRIGGERS_22.forEach((t) => expect(typeof t).toBe('string'));
    });

    it('includes core triggers', () => {
      expect(SHADOW_TRIGGERS_22).toContain('abandonment');
      expect(SHADOW_TRIGGERS_22).toContain('shame');
      expect(SHADOW_TRIGGERS_22).toContain('betrayal');
      expect(SHADOW_TRIGGERS_22).toContain('grief');
    });
  });

  describe('TRIGGER_TAXONOMY_22', () => {
    it('has definition for every trigger in SHADOW_TRIGGERS_22', () => {
      SHADOW_TRIGGERS_22.forEach((trigger) => {
        expect(TRIGGER_TAXONOMY_22[trigger]).toBeDefined();
      });
    });

    it('each definition has required fields', () => {
      Object.values(TRIGGER_TAXONOMY_22).forEach((def) => {
        expect(typeof def.id).toBe('string');
        expect(typeof def.label).toBe('string');
        expect(typeof def.coreDefinition).toBe('string');
        expect(Array.isArray(def.commonMotifs)).toBe(true);
        expect(Array.isArray(def.commonFeels)).toBe(true);
        expect(typeof def.defaultValence).toBe('string');
        expect(typeof def.defaultActivation).toBe('string');
        expect(Array.isArray(def.typicalAttachment)).toBe(true);
        expect(Array.isArray(def.typicalNervousSystem)).toBe(true);
        expect(Array.isArray(def.subThemes)).toBe(true);
        expect(typeof def.interpretationFrame).toBe('string');
      });
    });
  });
});
