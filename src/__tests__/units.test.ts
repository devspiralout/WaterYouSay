import {
  mlToDisplay,
  mlToOz,
  ozToMl,
  kgToLbs,
  lbsToKg,
  getVolumeUnitLabel,
  getQuickAddAmounts,
  formatWeight,
} from '../utils/units';

// Constants from the app
const ML_PER_OZ = 29.5735;

describe('mlToDisplay', () => {
  describe('metric system', () => {
    it('should display milliliters for small amounts', () => {
      expect(mlToDisplay(500, 'metric')).toBe('500ml');
      expect(mlToDisplay(999, 'metric')).toBe('999ml');
    });

    it('should display liters for 1000ml+', () => {
      expect(mlToDisplay(1000, 'metric')).toBe('1.0L');
      expect(mlToDisplay(1500, 'metric')).toBe('1.5L');
      expect(mlToDisplay(2500, 'metric')).toBe('2.5L');
    });

    it('should round milliliters', () => {
      expect(mlToDisplay(499.6, 'metric')).toBe('500ml');
    });
  });

  describe('imperial system', () => {
    it('should display ounces for small amounts', () => {
      expect(mlToDisplay(ML_PER_OZ, 'imperial')).toBe('1.0 oz');
      expect(mlToDisplay(ML_PER_OZ * 8, 'imperial')).toBe('8.0 oz');
    });

    it('should display cups for 32+ oz', () => {
      const thirtyTwoOz = ML_PER_OZ * 32;
      expect(mlToDisplay(thirtyTwoOz, 'imperial')).toBe('4.0 cups');
    });
  });
});

describe('mlToOz', () => {
  it('should convert milliliters to ounces', () => {
    expect(mlToOz(ML_PER_OZ)).toBeCloseTo(1, 5);
    expect(mlToOz(ML_PER_OZ * 8)).toBeCloseTo(8, 5);
  });

  it('should handle zero', () => {
    expect(mlToOz(0)).toBe(0);
  });
});

describe('ozToMl', () => {
  it('should convert ounces to milliliters', () => {
    expect(ozToMl(1)).toBeCloseTo(ML_PER_OZ, 5);
    expect(ozToMl(8)).toBeCloseTo(ML_PER_OZ * 8, 5);
  });

  it('should handle zero', () => {
    expect(ozToMl(0)).toBe(0);
  });

  it('should be inverse of mlToOz', () => {
    const ml = 500;
    expect(ozToMl(mlToOz(ml))).toBeCloseTo(ml, 5);
  });
});

describe('kgToLbs', () => {
  it('should convert kilograms to pounds', () => {
    expect(kgToLbs(1)).toBeCloseTo(2.20462, 4);
    expect(kgToLbs(70)).toBeCloseTo(154.324, 2);
  });

  it('should handle zero', () => {
    expect(kgToLbs(0)).toBe(0);
  });
});

describe('lbsToKg', () => {
  it('should convert pounds to kilograms', () => {
    expect(lbsToKg(2.20462)).toBeCloseTo(1, 4);
    expect(lbsToKg(154.324)).toBeCloseTo(70, 1);
  });

  it('should handle zero', () => {
    expect(lbsToKg(0)).toBe(0);
  });

  it('should be inverse of kgToLbs', () => {
    const kg = 70;
    expect(lbsToKg(kgToLbs(kg))).toBeCloseTo(kg, 5);
  });
});

describe('getVolumeUnitLabel', () => {
  it('should return metric labels', () => {
    expect(getVolumeUnitLabel('metric', true)).toBe('ml');
    expect(getVolumeUnitLabel('metric', false)).toBe('L');
    expect(getVolumeUnitLabel('metric')).toBe('L'); // default
  });

  it('should return imperial labels', () => {
    expect(getVolumeUnitLabel('imperial', true)).toBe('oz');
    expect(getVolumeUnitLabel('imperial', false)).toBe('cups');
    expect(getVolumeUnitLabel('imperial')).toBe('cups'); // default
  });
});

describe('getQuickAddAmounts', () => {
  it('should format amounts for metric system', () => {
    const amounts = getQuickAddAmounts('metric', [100, 250, 500]);
    expect(amounts).toEqual([
      { ml: 100, display: '100ml' },
      { ml: 250, display: '250ml' },
      { ml: 500, display: '500ml' },
    ]);
  });

  it('should format amounts for imperial system', () => {
    const amounts = getQuickAddAmounts('imperial', [100, 250, 500]);
    expect(amounts[0].ml).toBe(100);
    expect(amounts[0].display).toBe('3 oz'); // 100ml ≈ 3.4oz, rounded to 3
    expect(amounts[1].display).toBe('8 oz'); // 250ml ≈ 8.45oz, rounded to 8
    expect(amounts[2].display).toBe('17 oz'); // 500ml ≈ 16.9oz, rounded to 17
  });

  it('should use default amounts if none provided', () => {
    const amounts = getQuickAddAmounts('metric');
    expect(amounts).toHaveLength(3);
    expect(amounts[0].ml).toBe(100);
    expect(amounts[1].ml).toBe(250);
    expect(amounts[2].ml).toBe(500);
  });
});

describe('formatWeight', () => {
  it('should format weight for metric system', () => {
    expect(formatWeight(70, 'metric')).toBe('70 kg');
    expect(formatWeight(85.5, 'metric')).toBe('85.5 kg');
  });

  it('should format weight for imperial system', () => {
    expect(formatWeight(70, 'imperial')).toBe('154 lbs');
    expect(formatWeight(45, 'imperial')).toBe('99 lbs');
  });
});
