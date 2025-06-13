/**
 * Comprehensive Unit Tests for Type-Safe Validation Library
 * 
 * Tests cover all core functionality including:
 * - Primitive type validators (String, Number, Boolean, Date)
 * - Complex type validators (Array, Object)
 * - ValidationContainer functionality
 * - Error handling and edge cases
 * - Transform and conditional validation features
 * 
 * @author Martin
 * @version 2.0.0
 */

// Import the validation library
const {
  Schema,
  Validator,
  StringValidator,
  NumberValidator,
  BooleanValidator,
  DateValidator,
  ArrayValidator,
  ObjectValidator,
  ValidationError,
  ValidationResult,
  ValidationUtils,
  ValidationContainer
} = require('./schema.js');

// Simple test framework
class TestFramework {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  describe(name, fn) {
    console.log(`\n🔍 ${name}`);
    fn();
  }

  it(description, testFn) {
    this.results.total++;
    try {
      testFn();
      this.results.passed++;
      console.log(`  ✅ ${description}`);
    } catch (error) {
      this.results.failed++;
      console.log(`  ❌ ${description}`);
      console.log(`     Error: ${error.message}`);
    }
  }

  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
    }
  }

  assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(`${message}\nExpected: true\nActual: ${condition}`);
    }
  }

  assertFalse(condition, message = '') {
    if (condition) {
      throw new Error(`${message}\nExpected: false\nActual: ${condition}`);
    }
  }

  assertThrows(fn, expectedError = Error, message = '') {
    try {
      fn();
      throw new Error(`${message}\nExpected function to throw ${expectedError.name}`);
    } catch (error) {
      if (!(error instanceof expectedError)) {
        throw new Error(`${message}\nExpected: ${expectedError.name}\nActual: ${error.constructor.name}`);
      }
    }
  }

  assertArrayEqual(actual, expected, message = '') {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      throw new Error(`${message}\nBoth values must be arrays`);
    }
    if (actual.length !== expected.length) {
      throw new Error(`${message}\nArray lengths differ. Expected: ${expected.length}, Actual: ${actual.length}`);
    }
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) {
        throw new Error(`${message}\nArrays differ at index ${i}. Expected: ${expected[i]}, Actual: ${actual[i]}`);
      }
    }
  }

  run() {
    console.log('\n📊 Test Results:');
    console.log(`Total: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Coverage: ${((this.results.passed / this.results.total) * 100).toFixed(2)}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed.');
    }
  }
}

const test = new TestFramework();

// =============================================================================
// VALIDATION ERROR TESTS
// =============================================================================

test.describe('ValidationError', () => {
  test.it('should create validation error with all properties', () => {
    const error = new ValidationError('Test message', 'field.path', 'value', 'TEST_CODE');
    test.assertEqual(error.message, 'Test message');
    test.assertEqual(error.field, 'field.path');
    test.assertEqual(error.value, 'value');
    test.assertEqual(error.code, 'TEST_CODE');
    test.assertEqual(error.name, 'ValidationError');
  });

  test.it('should have default error code', () => {
    const error = new ValidationError('Test', 'field', 'value');
    test.assertEqual(error.code, 'VALIDATION_ERROR');
  });

  test.it('should serialize to JSON correctly', () => {
    const error = new ValidationError('Test', 'field', 'value', 'CODE');
    const json = error.toJSON();
    test.assertEqual(json.message, 'Test');
    test.assertEqual(json.field, 'field');
    test.assertEqual(json.value, 'value');
    test.assertEqual(json.code, 'CODE');
  });
});

// =============================================================================
// VALIDATION RESULT TESTS
// =============================================================================

test.describe('ValidationResult', () => {
  test.it('should create valid result', () => {
    const result = new ValidationResult(true, [], 'value', { meta: 'data' });
    test.assertTrue(result.isValid);
    test.assertEqual(result.errors.length, 0);
    test.assertEqual(result.value, 'value');
    test.assertEqual(result.metadata.meta, 'data');
  });

  test.it('should create invalid result with errors', () => {
    const error = new ValidationError('Test error', 'field', 'value');
    const result = new ValidationResult(false, [error], 'value');
    test.assertFalse(result.isValid);
    test.assertEqual(result.errors.length, 1);
    test.assertEqual(result.errors[0].message, 'Test error');
  });

  test.it('should get error messages', () => {
    const errors = [
      new ValidationError('Error 1', 'field1', 'value1'),
      new ValidationError('Error 2', 'field2', 'value2')
    ];
    const result = new ValidationResult(false, errors, null);
    test.assertArrayEqual(result.errorMessages, ['Error 1', 'Error 2']);
  });

  test.it('should get first error', () => {
    const errors = [
      new ValidationError('First error', 'field1', 'value1'),
      new ValidationError('Second error', 'field2', 'value2')
    ];
    const result = new ValidationResult(false, errors, null);
    test.assertEqual(result.firstError, 'First error');
  });

  test.it('should return null for first error when no errors', () => {
    const result = new ValidationResult(true, [], 'value');
    test.assertEqual(result.firstError, null);
  });

  test.it('should throw on invalid result', () => {
    const error = new ValidationError('Test error', 'field', 'value');
    const result = new ValidationResult(false, [error], 'value');
    test.assertThrows(() => result.throwIfInvalid(), ValidationError);
  });

  test.it('should not throw on valid result', () => {
    const result = new ValidationResult(true, [], 'value');
    result.throwIfInvalid(); // Should not throw
  });
});

// =============================================================================
// VALIDATION UTILS TESTS
// =============================================================================

test.describe('ValidationUtils', () => {
  test.it('should check string types correctly', () => {
    test.assertTrue(ValidationUtils.isString('test'));
    test.assertFalse(ValidationUtils.isString(123));
    test.assertFalse(ValidationUtils.isString(null));
  });

  test.it('should check number types correctly', () => {
    test.assertTrue(ValidationUtils.isNumber(123));
    test.assertTrue(ValidationUtils.isNumber(3.14));
    test.assertFalse(ValidationUtils.isNumber(NaN));
    test.assertFalse(ValidationUtils.isNumber('123'));
  });

  test.it('should check boolean types correctly', () => {
    test.assertTrue(ValidationUtils.isBoolean(true));
    test.assertTrue(ValidationUtils.isBoolean(false));
    test.assertFalse(ValidationUtils.isBoolean(1));
    test.assertFalse(ValidationUtils.isBoolean('true'));
  });

  test.it('should check date types correctly', () => {
    test.assertTrue(ValidationUtils.isDate(new Date()));
    test.assertFalse(ValidationUtils.isDate(new Date('invalid')));
    test.assertFalse(ValidationUtils.isDate('2023-01-01'));
  });

  test.it('should check array types correctly', () => {
    test.assertTrue(ValidationUtils.isArray([]));
    test.assertTrue(ValidationUtils.isArray([1, 2, 3]));
    test.assertFalse(ValidationUtils.isArray({}));
    test.assertFalse(ValidationUtils.isArray('array'));
  });

  test.it('should check object types correctly', () => {
    test.assertTrue(ValidationUtils.isObject({}));
    test.assertTrue(ValidationUtils.isObject({ key: 'value' }));
    test.assertFalse(ValidationUtils.isObject([]));
    test.assertFalse(ValidationUtils.isObject(null));
  });

  test.it('should check empty values correctly', () => {
    test.assertTrue(ValidationUtils.isEmpty(null));
    test.assertTrue(ValidationUtils.isEmpty(undefined));
    test.assertTrue(ValidationUtils.isEmpty(''));
    test.assertTrue(ValidationUtils.isEmpty('   '));
    test.assertTrue(ValidationUtils.isEmpty([]));
    test.assertTrue(ValidationUtils.isEmpty({}));
    test.assertFalse(ValidationUtils.isEmpty('text'));
    test.assertFalse(ValidationUtils.isEmpty([1]));
    test.assertFalse(ValidationUtils.isEmpty({ key: 'value' }));
    test.assertFalse(ValidationUtils.isEmpty(0));
    test.assertFalse(ValidationUtils.isEmpty(false));
  });

  test.it('should deep clone values correctly', () => {
    const original = { a: 1, b: { c: 2 }, d: [3, 4] };
    const cloned = ValidationUtils.deepClone(original);
    test.assertEqual(cloned.a, 1);
    test.assertEqual(cloned.b.c, 2);
    test.assertArrayEqual(cloned.d, [3, 4]);
    
    // Modify clone and ensure original is unchanged
    cloned.b.c = 999;
    test.assertEqual(original.b.c, 2);
  });

  test.it('should handle regex caching', () => {
    const pattern = '^test$';
    const regex1 = ValidationUtils.getRegex(pattern);
    const regex2 = ValidationUtils.getRegex(pattern);
    test.assertTrue(regex1 === regex2); // Should return cached version
  });
});

// =============================================================================
// STRING VALIDATOR TESTS
// =============================================================================

test.describe('StringValidator', () => {
  test.it('should validate basic strings', () => {
    const validator = Schema.string();
    const result = validator.validate('test');
    test.assertTrue(result.isValid);
    test.assertEqual(result.value, 'test');
  });

  test.it('should reject non-strings', () => {
    const validator = Schema.string();
    const result = validator.validate(123);
    test.assertFalse(result.isValid);
    test.assertTrue(result.errors[0].code === 'TYPE_ERROR');
  });

  test.it('should validate minimum length', () => {
    const validator = Schema.string().minLength(3);
    test.assertTrue(validator.validate('abc').isValid);
    test.assertTrue(validator.validate('abcd').isValid);
    test.assertFalse(validator.validate('ab').isValid);
  });

  test.it('should validate maximum length', () => {
    const validator = Schema.string().maxLength(5);
    test.assertTrue(validator.validate('abc').isValid);
    test.assertTrue(validator.validate('abcde').isValid);
    test.assertFalse(validator.validate('abcdef').isValid);
  });

  test.it('should validate patterns', () => {
    const validator = Schema.string().pattern(/^[a-z]+$/);
    test.assertTrue(validator.validate('abc').isValid);
    test.assertFalse(validator.validate('ABC').isValid);
    test.assertFalse(validator.validate('123').isValid);
  });

  test.it('should trim strings', () => {
    const validator = Schema.string().trim();
    const result = validator.validate('  hello  ');
    test.assertTrue(result.isValid);
    test.assertEqual(result.value, 'hello');
  });

  test.it('should convert to lowercase', () => {
    const validator = Schema.string().toLowerCase();
    const result = validator.validate('HELLO');
    test.assertTrue(result.isValid);
    test.assertEqual(result.value, 'hello');
  });

  test.it('should convert to uppercase', () => {
    const validator = Schema.string().toUpperCase();
    const result = validator.validate('hello');
    test.assertTrue(result.isValid);
    test.assertEqual(result.value, 'HELLO');
  });

  test.it('should validate email format', () => {
    const validator = Schema.string().email();
    test.assertTrue(validator.validate('test@example.com').isValid);
    test.assertFalse(validator.validate('invalid-email').isValid);
  });

  test.it('should validate URL format', () => {
    const validator = Schema.string().url();
    test.assertTrue(validator.validate('https://example.com').isValid);
    test.assertFalse(validator.validate('not-a-url').isValid);
  });

  test.it('should validate UUID format', () => {
    const validator = Schema.string().uuid();
    test.assertTrue(validator.validate('550e8400-e29b-41d4-a716-446655440000').isValid);
    test.assertFalse(validator.validate('invalid-uuid').isValid);
  });

  test.it('should handle optional strings', () => {
    const validator = Schema.string().optional();
    test.assertTrue(validator.validate(undefined).isValid);
    test.assertTrue(validator.validate('test').isValid);
  });

  test.it('should allow empty strings when configured', () => {
    const validator = Schema.string().allowEmpty();
    test.assertTrue(validator.validate('').isValid);
  });
});

// =============================================================================
// NUMBER VALIDATOR TESTS
// =============================================================================

test.describe('NumberValidator', () => {
  test.it('should validate basic numbers', () => {
    const validator = Schema.number();
    test.assertTrue(validator.validate(123).isValid);
    test.assertTrue(validator.validate(3.14).isValid);
    test.assertFalse(validator.validate('123').isValid);
  });

  test.it('should validate minimum values', () => {
    const validator = Schema.number().min(10);
    test.assertTrue(validator.validate(10).isValid);
    test.assertTrue(validator.validate(15).isValid);
    test.assertFalse(validator.validate(5).isValid);
  });

  test.it('should validate maximum values', () => {
    const validator = Schema.number().max(100);
    test.assertTrue(validator.validate(50).isValid);
    test.assertTrue(validator.validate(100).isValid);
    test.assertFalse(validator.validate(150).isValid);
  });

  test.it('should validate integers', () => {
    const validator = Schema.number().integer();
    test.assertTrue(validator.validate(42).isValid);
    test.assertFalse(validator.validate(3.14).isValid);
  });

  test.it('should validate positive numbers', () => {
    const validator = Schema.number().positive();
    test.assertTrue(validator.validate(1).isValid);
    test.assertFalse(validator.validate(0).isValid);
    test.assertFalse(validator.validate(-1).isValid);
  });

  test.it('should validate negative numbers', () => {
    const validator = Schema.number().negative();
    test.assertTrue(validator.validate(-1).isValid);
    test.assertFalse(validator.validate(0).isValid);
    test.assertFalse(validator.validate(1).isValid);
  });

  test.it('should validate multiples', () => {
    const validator = Schema.number().multipleOf(5);
    test.assertTrue(validator.validate(10).isValid);
    test.assertTrue(validator.validate(15).isValid);
    test.assertFalse(validator.validate(7).isValid);
  });

  test.it('should handle finite numbers', () => {
    const validator = Schema.number();
    test.assertFalse(validator.validate(Infinity).isValid);
    test.assertFalse(validator.validate(-Infinity).isValid);
  });

  test.it('should allow infinite numbers when configured', () => {
    const validator = Schema.number().allowInfinite();
    test.assertTrue(validator.validate(Infinity).isValid);
    test.assertTrue(validator.validate(-Infinity).isValid);
  });
});

// =============================================================================
// BOOLEAN VALIDATOR TESTS
// =============================================================================

test.describe('BooleanValidator', () => {
  test.it('should validate basic booleans', () => {
    const validator = Schema.boolean();
    test.assertTrue(validator.validate(true).isValid);
    test.assertTrue(validator.validate(false).isValid);
  });

  test.it('should convert truthy/falsy values by default', () => {
    const validator = Schema.boolean();
    test.assertTrue(validator.validate(1).isValid);
    test.assertEqual(validator.validate(1).value, true);
    test.assertTrue(validator.validate(0).isValid);
    test.assertEqual(validator.validate(0).value, false);
  });

  test.it('should require strict booleans when configured', () => {
    const validator = Schema.boolean().strict();
    test.assertTrue(validator.validate(true).isValid);
    test.assertFalse(validator.validate(1).isValid);
  });
});

// =============================================================================
// DATE VALIDATOR TESTS
// =============================================================================

test.describe('DateValidator', () => {
  test.it('should validate basic dates', () => {
    const validator = Schema.date();
    test.assertTrue(validator.validate(new Date()).isValid);
    test.assertTrue(validator.validate('2023-01-01').isValid);
  });

  test.it('should reject invalid dates', () => {
    const validator = Schema.date();
    test.assertFalse(validator.validate('invalid-date').isValid);
    test.assertFalse(validator.validate(123).isValid);
  });

  test.it('should validate minimum dates', () => {
    const validator = Schema.date().min(new Date('2023-01-01'));
    test.assertTrue(validator.validate(new Date('2023-06-01')).isValid);
    test.assertFalse(validator.validate(new Date('2022-01-01')).isValid);
  });

  test.it('should validate maximum dates', () => {
    const validator = Schema.date().max(new Date('2023-12-31'));
    test.assertTrue(validator.validate(new Date('2023-06-01')).isValid);
    test.assertFalse(validator.validate(new Date('2024-01-01')).isValid);
  });

  test.it('should require strict Date objects when configured', () => {
    const validator = Schema.date().strict();
    test.assertTrue(validator.validate(new Date()).isValid);
    test.assertFalse(validator.validate('2023-01-01').isValid);
  });
});

// =============================================================================
// ARRAY VALIDATOR TESTS
// =============================================================================

test.describe('ArrayValidator', () => {
  test.it('should validate basic arrays', () => {
    const validator = Schema.array(Schema.string());
    test.assertTrue(validator.validate(['a', 'b', 'c']).isValid);
    test.assertFalse(validator.validate('not-array').isValid);
  });

  test.it('should validate array items', () => {
    const validator = Schema.array(Schema.number());
    test.assertTrue(validator.validate([1, 2, 3]).isValid);
    test.assertFalse(validator.validate([1, 'two', 3]).isValid);
  });

  test.it('should validate minimum array length', () => {
    const validator = Schema.array(Schema.string()).minLength(2);
    test.assertTrue(validator.validate(['a', 'b']).isValid);
    test.assertFalse(validator.validate(['a']).isValid);
  });

  test.it('should validate maximum array length', () => {
    const validator = Schema.array(Schema.string()).maxLength(2);
    test.assertTrue(validator.validate(['a', 'b']).isValid);
    test.assertFalse(validator.validate(['a', 'b', 'c']).isValid);
  });

  test.it('should validate unique arrays', () => {
    const validator = Schema.array(Schema.string()).unique();
    test.assertTrue(validator.validate(['a', 'b', 'c']).isValid);
    test.assertFalse(validator.validate(['a', 'b', 'a']).isValid);
  });

  test.it('should compact arrays', () => {
    const validator = Schema.array(Schema.string()).compact();
    const result = validator.validate(['a', null, 'b', undefined, 'c']);
    test.assertTrue(result.isValid);
    test.assertArrayEqual(result.value, ['a', 'b', 'c']);
  });
});

// =============================================================================
// OBJECT VALIDATOR TESTS
// =============================================================================

test.describe('ObjectValidator', () => {
  test.it('should validate basic objects', () => {
    const validator = Schema.object({
      name: Schema.string(),
      age: Schema.number()
    });
    test.assertTrue(validator.validate({ name: 'John', age: 30 }).isValid);
    test.assertFalse(validator.validate('not-object').isValid);
  });

  test.it('should validate object properties', () => {
    const validator = Schema.object({
      name: Schema.string(),
      age: Schema.number()
    });
    test.assertTrue(validator.validate({ name: 'John', age: 30 }).isValid);
    test.assertFalse(validator.validate({ name: 'John', age: 'thirty' }).isValid);
  });

  test.it('should handle optional properties', () => {
    const validator = Schema.object({
      name: Schema.string(),
      age: Schema.number().optional()
    });
    test.assertTrue(validator.validate({ name: 'John' }).isValid);
    test.assertTrue(validator.validate({ name: 'John', age: 30 }).isValid);
  });

  test.it('should strip unknown properties when configured', () => {
    const validator = Schema.object({
      name: Schema.string()
    }).stripUnknown();
    const result = validator.validate({ name: 'John', extra: 'data' });
    test.assertTrue(result.isValid);
    test.assertEqual(result.value.name, 'John');
    test.assertTrue(result.value.extra === undefined);
  });

  test.it('should enforce strict mode', () => {
    const validator = Schema.object({
      name: Schema.string()
    }).strict();
    test.assertTrue(validator.validate({ name: 'John' }).isValid);
    test.assertFalse(validator.validate({ name: 'John', extra: 'data' }).isValid);
  });
});

// =============================================================================
// ADVANCED VALIDATOR TESTS
// =============================================================================

test.describe('Advanced Validators', () => {
  test.it('should validate union types', () => {
    const validator = Schema.union(Schema.string(), Schema.number());
    test.assertTrue(validator.validate('hello').isValid);
    test.assertTrue(validator.validate(42).isValid);
    test.assertFalse(validator.validate(true).isValid);
  });

  test.it('should validate literal values', () => {
    const validator = Schema.literal('admin', 'user', 'guest');
    test.assertTrue(validator.validate('admin').isValid);
    test.assertTrue(validator.validate('user').isValid);
    test.assertFalse(validator.validate('superuser').isValid);
  });

  test.it('should handle conditional validation', () => {
    const validator = Schema.number()
      .when(value => value > 10, Schema.number().max(100));
    test.assertTrue(validator.validate(5).isValid);
    test.assertTrue(validator.validate(50).isValid);
    test.assertFalse(validator.validate(150).isValid);
  });

  test.it('should handle transformations', () => {
    const validator = Schema.string()
      .transform(value => value.toUpperCase());
    const result = validator.validate('hello');
    test.assertTrue(result.isValid);
    test.assertEqual(result.value, 'HELLO');
  });

  test.it('should handle custom error messages', () => {
    const validator = Schema.string().minLength(5).withMessage('Too short!');
    const result = validator.validate('hi');
    test.assertFalse(result.isValid);
    test.assertEqual(result.errors[0].message, 'Too short!');
  });
});

// =============================================================================
// VALIDATION CONTAINER TESTS
// =============================================================================

test.describe('ValidationContainer', () => {
  test.it('should create container with options', () => {
    const container = new ValidationContainer({
      strictMode: true,
      cacheResults: true
    });
    test.assertTrue(container.options.strictMode);
    test.assertTrue(container.options.cacheResults);
  });

  test.it('should register and retrieve validators', () => {
    const container = new ValidationContainer();
    const emailValidator = Schema.string().email();
    container.register('email', emailValidator);
    
    test.assertTrue(container.hasValidator('email'));
    const retrieved = container.getValidator('email');
    test.assertTrue(retrieved === emailValidator);
  });

  test.it('should list registered validators', () => {
    const container = new ValidationContainer();
    container.register('email', Schema.string().email());
    container.register('number', Schema.number());
    
    const validators = container.listValidators();
    test.assertTrue(validators.includes('email'));
    test.assertTrue(validators.includes('number'));
  });

  test.it('should validate using registered validators', () => {
    const container = new ValidationContainer();
    container.register('email', Schema.string().email());
    
    test.assertTrue(container.validate('email', 'test@example.com').isValid);
    test.assertFalse(container.validate('email', 'invalid-email').isValid);
  });

  test.it('should perform batch validation', () => {
    const container = new ValidationContainer();
    container.register('email', Schema.string().email());
    container.register('number', Schema.number());
    
    const validations = [
      { validator: 'email', value: 'test@example.com', path: 'email' },
      { validator: 'number', value: 42, path: 'age' }
    ];
    
    const result = container.validateBatch(validations);
    test.assertTrue(result.isValid);
  });

  test.it('should validate objects with schema mapping', () => {
    const container = new ValidationContainer();
    container.register('email', Schema.string().email());
    container.register('number', Schema.number());
    
    const schema = { email: 'email', age: 'number' };
    const data = { email: 'test@example.com', age: 30 };
    
    const result = container.validateObject(schema, data);
    test.assertTrue(result.isValid);
  });

  test.it('should create validator groups', () => {
    const container = new ValidationContainer();
    container.register('email', Schema.string().email());
    container.register('number', Schema.number());
    
    container.createGroup('user', {
      email: 'email',
      age: 'number'
    });
    
    test.assertTrue(container.hasValidator('user'));
  });

  test.it('should track validation statistics', () => {
    const container = new ValidationContainer();
    container.register('email', Schema.string().email());
    
    container.validate('email', 'valid@example.com');
    container.validate('email', 'invalid-email');
    
    const stats = container.getStats();
    test.assertEqual(stats.totalValidations, 2);
    test.assertEqual(stats.successfulValidations, 1);
    test.assertEqual(stats.failedValidations, 1);
  });

  test.it('should create child containers', () => {
    const parent = new ValidationContainer({ strictMode: false });
    parent.register('email', Schema.string().email());
    
    const child = parent.createChild({ strictMode: true });
    
    test.assertTrue(child.hasValidator('email'));
    test.assertTrue(child.options.strictMode);
    test.assertFalse(parent.options.strictMode);
  });

  test.it('should handle caching when enabled', () => {
    const container = new ValidationContainer({ cacheResults: true });
    container.register('email', Schema.string().email());
    
    // First validation
    container.validate('email', 'test@example.com');
    // Second validation (should hit cache)
    container.validate('email', 'test@example.com');
    
    const stats = container.getStats();
    test.assertTrue(stats.cacheHits > 0);
  });

  test.it('should throw errors when configured', () => {
    const container = new ValidationContainer({ throwOnError: true });
    container.register('email', Schema.string().email());
    
    test.assertThrows(() => {
      container.validate('email', 'invalid-email');
    }, ValidationError);
  });

  test.it('should export container configuration', () => {
    const container = new ValidationContainer({ strictMode: true });
    container.register('email', Schema.string().email());
    
    const exported = container.export();
    test.assertTrue(exported.options.strictMode);
    test.assertTrue(exported.validators.includes('email'));
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

test.describe('Error Handling', () => {
  test.it('should handle invalid validator registration', () => {
    const container = new ValidationContainer();
    
    test.assertThrows(() => {
      container.register('', Schema.string());
    }, TypeError);
    
    test.assertThrows(() => {
      container.register('test', 'not-a-validator');
    }, TypeError);
  });

  test.it('should handle missing validators', () => {
    const container = new ValidationContainer();
    
    test.assertThrows(() => {
      container.getValidator('nonexistent');
    }, Error);
  });

  test.it('should handle invalid constructor parameters', () => {
    test.assertThrows(() => {
      Schema.string().minLength(-1);
    }, TypeError);
    
    test.assertThrows(() => {
      Schema.number().min('not-a-number');
    }, TypeError);
  });

  test.it('should handle transform errors gracefully', () => {
    const validator = Schema.string().transform(() => {
      throw new Error('Transform failed');
    });
    
    const result = validator.validate('test');
    test.assertFalse(result.isValid);
    test.assertTrue(result.errors[0].code === 'TRANSFORM_ERROR');
  });
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

test.describe('Performance', () => {
  test.it('should handle large arrays efficiently', () => {
    const validator = Schema.array(Schema.number());
    const largeArray = Array.from({ length: 1000 }, (_, i) => i);
    
    const startTime = Date.now();
    const result = validator.validate(largeArray);
    const endTime = Date.now();
    
    test.assertTrue(result.isValid);
    test.assertTrue(endTime - startTime < 1000); // Should complete in under 1 second
  });

  test.it('should handle complex nested objects', () => {
    const validator = Schema.object({
      users: Schema.array(Schema.object({
        name: Schema.string(),
        email: Schema.string().email(),
        profile: Schema.object({
          age: Schema.number(),
          address: Schema.object({
            street: Schema.string(),
            city: Schema.string()
          })
        })
      }))
    });
    
    const complexData = {
      users: Array.from({ length: 100 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        profile: {
          age: 20 + (i % 50),
          address: {
            street: `Street ${i}`,
            city: `City ${i}`
          }
        }
      }))
    };
    
    const startTime = Date.now();
    const result = validator.validate(complexData);
    const endTime = Date.now();
    
    test.assertTrue(result.isValid);
    test.assertTrue(endTime - startTime < 2000); // Should complete in under 2 seconds
  });
});

// =============================================================================
// RUN ALL TESTS
// =============================================================================

console.log('🧪 Running Type-Safe Validation Library Tests...\n');
test.run(); 