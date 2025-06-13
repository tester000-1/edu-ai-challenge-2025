/**
 * Type-Safe Schema Validation Library
 * 
 * A comprehensive validation library for JavaScript that provides:
 * - Type-safe validator functions for primitive types
 * - Complex structure validation (arrays, nested objects)
 * - Optional field support
 * - Custom validation rules and error messages
 * - Chainable validator methods
 * - Immutable validation patterns
 * - Performance optimized with caching
 * - Modern JavaScript best practices
 * 
 * @author Martin
 * @version 2.0.0
 */

'use strict';

/**
 * Custom validation error class with enhanced error information
 */
class ValidationError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} field - Field path where error occurred
   * @param {*} value - The invalid value
   * @param {string} code - Error code for programmatic handling
   */
  constructor(message, field, value, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.code = code;
    
    // Maintain proper stack trace for V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      field: this.field,
      value: this.value,
      code: this.code
    };
  }
}

/**
 * Enhanced validation result with comprehensive functionality
 */
class ValidationResult {
  #isValid;
  #errors;
  #value;
  #metadata;

  /**
   * @param {boolean} isValid - Whether validation passed
   * @param {ValidationError[]} errors - Array of validation errors
   * @param {*} value - Validated/transformed value
   * @param {Object} metadata - Additional metadata about validation
   */
  constructor(isValid, errors = [], value = undefined, metadata = {}) {
    this.#isValid = Boolean(isValid);
    this.#errors = Object.freeze([...errors]);
    this.#value = value;
    this.#metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  /**
   * Whether the validation passed
   * @returns {boolean}
   */
  get isValid() {
    return this.#isValid;
  }

  /**
   * Array of validation errors
   * @returns {ValidationError[]}
   */
  get errors() {
    return this.#errors;
  }

  /**
   * The validated value
   * @returns {*}
   */
  get value() {
    return this.#value;
  }

  /**
   * Validation metadata
   * @returns {Object}
   */
  get metadata() {
    return this.#metadata;
  }

  /**
   * Get error messages as strings
   * @returns {string[]}
   */
  get errorMessages() {
    return this.#errors.map(error => error.message);
  }

  /**
   * Get first error message
   * @returns {string|null}
   */
  get firstError() {
    return this.#errors.length > 0 ? this.#errors[0].message : null;
  }

  /**
   * Throws if validation failed
   * @throws {ValidationError} First validation error
   */
  throwIfInvalid() {
    if (!this.#isValid && this.#errors.length > 0) {
      throw this.#errors[0];
    }
  }

  /**
   * Convert result to JSON representation
   * @returns {Object}
   */
  toJSON() {
    return {
      isValid: this.#isValid,
      errors: this.#errors.map(error => error.toJSON()),
      value: this.#value,
      metadata: this.#metadata
    };
  }
}

/**
 * Utility functions for validation operations
 */
class ValidationUtils {
  // Private static cache for regex patterns
  static #regexCache = new Map();

  /**
   * Common regex patterns for validation
   */
  static get PATTERNS() {
    return Object.freeze({
      EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      URL: /^https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w._~!$&'()*+,;=:@-]|%[\da-f]{2})*)*(?:\?(?:[\w._~!$&'()*+,;=:@/?-]|%[\da-f]{2})*)?(?:#(?:[\w._~!$&'()*+,;=:@/?-]|%[\da-f]{2})*)?$/i,
      UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
      POSTAL_CODE_US: /^\d{5}(-\d{4})?$/,
      CREDIT_CARD: /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/
    });
  }

  /**
   * Get cached regex or compile and cache new one
   * @param {RegExp|string} pattern - Regex pattern
   * @returns {RegExp} Compiled regex
   */
  static getRegex(pattern) {
    if (pattern instanceof RegExp) return pattern;
    
    if (!this.#regexCache.has(pattern)) {
      this.#regexCache.set(pattern, new RegExp(pattern));
    }
    return this.#regexCache.get(pattern);
  }

  /**
   * Deep clone value to prevent mutation
   * @param {*} value - Value to clone
   * @returns {*} Cloned value
   */
  static deepClone(value) {
    if (value === null || typeof value !== 'object') return value;
    if (value instanceof Date) return new Date(value);
    if (value instanceof RegExp) return new RegExp(value);
    if (Array.isArray(value)) return value.map(item => this.deepClone(item));
    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [key, this.deepClone(val)])
      );
    }
    return value;
  }

  /**
   * Check if value is empty (null, undefined, empty string, empty array, empty object)
   * @param {*} value - Value to check
   * @returns {boolean} True if empty
   */
  static isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Type checking utilities
   */
  static isString(value) { return typeof value === 'string'; }
  static isNumber(value) { return typeof value === 'number' && !isNaN(value); }
  static isBoolean(value) { return typeof value === 'boolean'; }
  static isDate(value) { return value instanceof Date && !isNaN(value.getTime()); }
  static isArray(value) { return Array.isArray(value); }
  static isObject(value) { return typeof value === 'object' && value !== null && !Array.isArray(value); }
  static isFunction(value) { return typeof value === 'function'; }
}

/**
 * Enhanced base validator class with immutable patterns
 */
class Validator {
  #isOptional = false;
  #customMessage = null;
  #transformers = [];
  #conditions = [];
  #metadata = {};

  /**
   * Create a new validator instance
   * @param {Object} config - Initial configuration
   */
  constructor(config = {}) {
    Object.assign(this, config);
  }

  /**
   * Marks this validator as optional (returns new instance)
   * @returns {Validator} New validator instance
   */
  optional() {
    return this._clone({ isOptional: true });
  }

  /**
   * Sets a custom error message (returns new instance)
   * @param {string} message - Custom error message
   * @returns {Validator} New validator instance
   */
  withMessage(message) {
    if (!ValidationUtils.isString(message)) {
      throw new TypeError('Custom message must be a string');
    }
    return this._clone({ customMessage: message });
  }

  /**
   * Adds a transform function (returns new instance)
   * @param {Function} transformer - Transform function
   * @returns {Validator} New validator instance
   */
  transform(transformer) {
    if (!ValidationUtils.isFunction(transformer)) {
      throw new TypeError('Transformer must be a function');
    }
    return this._clone({ 
      transformers: [...this.#transformers, transformer] 
    });
  }

  /**
   * Adds conditional validation (returns new instance)
   * @param {Function} condition - Condition function
   * @param {Validator} validator - Validator to apply
   * @returns {Validator} New validator instance
   */
  when(condition, validator) {
    if (!ValidationUtils.isFunction(condition)) {
      throw new TypeError('Condition must be a function');
    }
    if (!(validator instanceof Validator)) {
      throw new TypeError('Validator must be an instance of Validator');
    }
    return this._clone({
      conditions: [...this.#conditions, { condition, validator }]
    });
  }

  /**
   * Adds metadata (returns new instance)
   * @param {string} key - Metadata key
   * @param {*} value - Metadata value
   * @returns {Validator} New validator instance
   */
  meta(key, value) {
    return this._clone({
      metadata: { ...this.#metadata, [key]: value }
    });
  }

  /**
   * Validates a value
   * @param {*} value - Value to validate
   * @param {string} fieldPath - Path to the field being validated
   * @param {Object} context - Validation context
   * @returns {ValidationResult} Validation result
   */
  validate(value, fieldPath = '', context = {}) {
    try {
      // Handle optional fields
      if (ValidationUtils.isEmpty(value) && value !== false && value !== 0) {
        if (this.#isOptional) {
          return new ValidationResult(true, [], undefined, this.#metadata);
        }
        return new ValidationResult(
          false,
          [new ValidationError(
            this.#customMessage || 'Field is required',
            fieldPath,
            value,
            'REQUIRED'
          )],
          value,
          this.#metadata
        );
      }

      // Run main validation
      const result = this._validate(value, fieldPath, context);
      if (!result.isValid) {
        return result;
      }

      let validatedValue = result.value;

      // Apply conditional validations
      for (const { condition, validator } of this.#conditions) {
        if (condition(validatedValue, context)) {
          const conditionalResult = validator.validate(validatedValue, fieldPath, context);
          if (!conditionalResult.isValid) {
            return conditionalResult;
          }
          validatedValue = conditionalResult.value;
        }
      }

      // Apply transformers
      for (const transformer of this.#transformers) {
        try {
          validatedValue = transformer(validatedValue, context);
        } catch (error) {
          return new ValidationResult(
            false,
            [new ValidationError(
              `Transform error: ${error.message}`,
              fieldPath,
              validatedValue,
              'TRANSFORM_ERROR'
            )],
            value,
            this.#metadata
          );
        }
      }

      return new ValidationResult(true, [], validatedValue, this.#metadata);
    } catch (error) {
      return new ValidationResult(
        false,
        [new ValidationError(
          `Validation error: ${error.message}`,
          fieldPath,
          value,
          'INTERNAL_ERROR'
        )],
        value,
        this.#metadata
      );
    }
  }

  /**
   * Parse and return validated value (throws on failure)
   * @param {*} value - Value to validate
   * @param {string} fieldPath - Path to the field being validated
   * @param {Object} context - Validation context
   * @returns {*} Validated value
   * @throws {ValidationError} If validation fails
   */
  parse(value, fieldPath = '', context = {}) {
    const result = this.validate(value, fieldPath, context);
    result.throwIfInvalid();
    return result.value;
  }

  /**
   * Create a clone with new configuration
   * @param {Object} newConfig - New configuration to merge
   * @returns {Validator} New validator instance
   * @protected
   */
  _clone(newConfig = {}) {
    const Constructor = this.constructor;
    const clone = new Constructor();
    
    // Copy private fields
    clone.#isOptional = newConfig.isOptional ?? this.#isOptional;
    clone.#customMessage = newConfig.customMessage ?? this.#customMessage;
    clone.#transformers = newConfig.transformers ?? [...this.#transformers];
    clone.#conditions = newConfig.conditions ?? [...this.#conditions];
    clone.#metadata = newConfig.metadata ?? { ...this.#metadata };

    // Copy public properties
    for (const key of Object.getOwnPropertyNames(this)) {
      if (!key.startsWith('#') && key !== 'constructor') {
        clone[key] = ValidationUtils.deepClone(this[key]);
      }
    }

    return clone;
  }

  /**
   * Internal validation method to be implemented by subclasses
   * @param {*} value - Value to validate
   * @param {string} fieldPath - Path to the field being validated
   * @param {Object} context - Validation context
   * @returns {ValidationResult} Validation result
   * @protected
   */
  _validate(value, fieldPath, context) {
    throw new Error('_validate method must be implemented by subclasses');
  }

  /**
   * Create a validation error with proper context
   * @param {string} message - Error message
   * @param {string} fieldPath - Field path
   * @param {*} value - Invalid value
   * @param {string} code - Error code
   * @returns {ValidationError} Validation error
   * @protected
   */
  _createError(message, fieldPath, value, code = 'VALIDATION_ERROR') {
    const finalMessage = this.#customMessage || message;
    return new ValidationError(finalMessage, fieldPath, value, code);
  }
}

/**
 * Enhanced String validator with comprehensive string validation
 */
class StringValidator extends Validator {
  constructor() {
    super();
    this._minLength = null;
    this._maxLength = null;
    this._pattern = null;
    this._allowEmpty = false;
    this._trim = false;
    this._toLowerCase = false;
    this._toUpperCase = false;
  }

  /**
   * Sets minimum length requirement (returns new instance)
   * @param {number} length - Minimum length
   * @returns {StringValidator} New validator instance
   */
  minLength(length) {
    if (!Number.isInteger(length) || length < 0) {
      throw new TypeError('minLength must be a non-negative integer');
    }
    return this._clone({ minLength: length });
  }

  /**
   * Sets maximum length requirement (returns new instance)
   * @param {number} length - Maximum length
   * @returns {StringValidator} New validator instance
   */
  maxLength(length) {
    if (!Number.isInteger(length) || length < 0) {
      throw new TypeError('maxLength must be a non-negative integer');
    }
    return this._clone({ maxLength: length });
  }

  /**
   * Sets pattern requirement (returns new instance)
   * @param {RegExp|string} pattern - Regular expression pattern
   * @returns {StringValidator} New validator instance
   */
  pattern(pattern) {
    return this._clone({ pattern: ValidationUtils.getRegex(pattern) });
  }

  /**
   * Allows empty strings (returns new instance)
   * @returns {StringValidator} New validator instance
   */
  allowEmpty() {
    return this._clone({ allowEmpty: true });
  }

  /**
   * Automatically trims whitespace (returns new instance)
   * @returns {StringValidator} New validator instance
   */
  trim() {
    return this._clone({ trim: true });
  }

  /**
   * Converts to lowercase (returns new instance)
   * @returns {StringValidator} New validator instance
   */
  toLowerCase() {
    return this._clone({ toLowerCase: true });
  }

  /**
   * Converts to uppercase (returns new instance)
   * @returns {StringValidator} New validator instance
   */
  toUpperCase() {
    return this._clone({ toUpperCase: true });
  }

  /**
   * Validates email format (returns new instance)
   * @returns {StringValidator} New validator instance
   */
  email() {
    return this.pattern(ValidationUtils.PATTERNS.EMAIL)
               .withMessage('Must be a valid email address');
  }

  /**
   * Validates URL format (returns new instance)
   * @returns {StringValidator} New validator instance
   */
  url() {
    return this.pattern(ValidationUtils.PATTERNS.URL)
               .withMessage('Must be a valid URL');
  }

  /**
   * Validates UUID format (returns new instance)
   * @returns {StringValidator} New validator instance
   */
  uuid() {
    return this.pattern(ValidationUtils.PATTERNS.UUID)
               .withMessage('Must be a valid UUID');
  }

  /**
   * Clone with new configuration
   * @param {Object} newConfig - New configuration
   * @returns {StringValidator} New validator instance
   * @protected
   */
  _clone(newConfig = {}) {
    const clone = super._clone(newConfig);
    clone._minLength = newConfig.minLength ?? this._minLength;
    clone._maxLength = newConfig.maxLength ?? this._maxLength;
    clone._pattern = newConfig.pattern ?? this._pattern;
    clone._allowEmpty = newConfig.allowEmpty ?? this._allowEmpty;
    clone._trim = newConfig.trim ?? this._trim;
    clone._toLowerCase = newConfig.toLowerCase ?? this._toLowerCase;
    clone._toUpperCase = newConfig.toUpperCase ?? this._toUpperCase;
    return clone;
  }

  /**
   * Validates string values
   * @param {*} value - Value to validate
   * @param {string} fieldPath - Path to the field being validated
   * @param {Object} context - Validation context
   * @returns {ValidationResult} Validation result
   * @protected
   */
  _validate(value, fieldPath, context) {
    const errors = [];
    let stringValue = value;

    // Type check and conversion
    if (!ValidationUtils.isString(value)) {
      if (value != null && ValidationUtils.isFunction(value.toString)) {
        stringValue = value.toString();
      } else {
        return new ValidationResult(
          false,
          [this._createError('Must be a string', fieldPath, value, 'TYPE_ERROR')],
          value
        );
      }
    }

    // Apply transformations
    if (this._trim) stringValue = stringValue.trim();
    if (this._toLowerCase) stringValue = stringValue.toLowerCase();
    if (this._toUpperCase) stringValue = stringValue.toUpperCase();

    // Empty check
    if (!this._allowEmpty && stringValue.length === 0) {
      errors.push(this._createError('Cannot be empty', fieldPath, stringValue, 'EMPTY_STRING'));
    }

    // Length validations
    if (this._minLength !== null && stringValue.length < this._minLength) {
      errors.push(this._createError(
        `Must be at least ${this._minLength} character${this._minLength === 1 ? '' : 's'} long`,
        fieldPath,
        stringValue,
        'MIN_LENGTH'
      ));
    }

    if (this._maxLength !== null && stringValue.length > this._maxLength) {
      errors.push(this._createError(
        `Must be at most ${this._maxLength} character${this._maxLength === 1 ? '' : 's'} long`,
        fieldPath,
        stringValue,
        'MAX_LENGTH'
      ));
    }

    // Pattern validation
    if (this._pattern && !this._pattern.test(stringValue)) {
      errors.push(this._createError(
        'Does not match required pattern',
        fieldPath,
        stringValue,
        'PATTERN_MISMATCH'
      ));
    }

    return new ValidationResult(errors.length === 0, errors, stringValue);
  }
}

/**
 * Enhanced Number validator with comprehensive numeric validation
 */
class NumberValidator extends Validator {
  constructor() {
    super();
    this._min = null;
    this._max = null;
    this._integer = false;
    this._positive = false;
    this._negative = false;
    this._finite = true;
    this._multipleOf = null;
  }

  /**
   * Sets minimum value (returns new instance)
   * @param {number} value - Minimum value
   * @returns {NumberValidator} New validator instance
   */
  min(value) {
    if (!ValidationUtils.isNumber(value) || !Number.isFinite(value)) {
      throw new TypeError('min value must be a finite number');
    }
    return this._clone({ min: value });
  }

  /**
   * Sets maximum value (returns new instance)
   * @param {number} value - Maximum value
   * @returns {NumberValidator} New validator instance
   */
  max(value) {
    if (!ValidationUtils.isNumber(value) || !Number.isFinite(value)) {
      throw new TypeError('max value must be a finite number');
    }
    return this._clone({ max: value });
  }

  /**
   * Requires integer (returns new instance)
   * @returns {NumberValidator} New validator instance
   */
  integer() {
    return this._clone({ integer: true });
  }

  /**
   * Requires positive number (returns new instance)
   * @returns {NumberValidator} New validator instance
   */
  positive() {
    return this._clone({ positive: true });
  }

  /**
   * Requires negative number (returns new instance)
   * @returns {NumberValidator} New validator instance
   */
  negative() {
    return this._clone({ negative: true });
  }

  /**
   * Allows infinite values (returns new instance)
   * @returns {NumberValidator} New validator instance
   */
  allowInfinite() {
    return this._clone({ finite: false });
  }

  /**
   * Requires multiple of value (returns new instance)
   * @param {number} value - Divisor value
   * @returns {NumberValidator} New validator instance
   */
  multipleOf(value) {
    if (!ValidationUtils.isNumber(value) || !Number.isFinite(value) || value <= 0) {
      throw new TypeError('multipleOf value must be a positive finite number');
    }
    return this._clone({ multipleOf: value });
  }

  /**
   * Clone with new configuration
   * @param {Object} newConfig - New configuration
   * @returns {NumberValidator} New validator instance
   * @protected
   */
  _clone(newConfig = {}) {
    const clone = super._clone(newConfig);
    clone._min = newConfig.min ?? this._min;
    clone._max = newConfig.max ?? this._max;
    clone._integer = newConfig.integer ?? this._integer;
    clone._positive = newConfig.positive ?? this._positive;
    clone._negative = newConfig.negative ?? this._negative;
    clone._finite = newConfig.finite ?? this._finite;
    clone._multipleOf = newConfig.multipleOf ?? this._multipleOf;
    return clone;
  }

  /**
   * Validates numeric values
   * @param {*} value - Value to validate
   * @param {string} fieldPath - Path to the field being validated
   * @param {Object} context - Validation context
   * @returns {ValidationResult} Validation result
   * @protected
   */
  _validate(value, fieldPath, context) {
    const errors = [];
    let numValue = value;

    // Type conversion and validation
    if (ValidationUtils.isString(value)) {
      numValue = Number(value);
    }

    if (!ValidationUtils.isNumber(numValue)) {
      return new ValidationResult(
        false,
        [this._createError('Must be a valid number', fieldPath, value, 'TYPE_ERROR')],
        value
      );
    }

    // Finite check
    if (this._finite && !Number.isFinite(numValue)) {
      errors.push(this._createError('Must be a finite number', fieldPath, numValue, 'NOT_FINITE'));
    }

    // Integer check
    if (this._integer && !Number.isInteger(numValue)) {
      errors.push(this._createError('Must be an integer', fieldPath, numValue, 'NOT_INTEGER'));
    }

    // Sign checks
    if (this._positive && numValue <= 0) {
      errors.push(this._createError('Must be positive', fieldPath, numValue, 'NOT_POSITIVE'));
    }

    if (this._negative && numValue >= 0) {
      errors.push(this._createError('Must be negative', fieldPath, numValue, 'NOT_NEGATIVE'));
    }

    // Range validations
    if (this._min !== null && numValue < this._min) {
      errors.push(this._createError(
        `Must be at least ${this._min}`,
        fieldPath,
        numValue,
        'MIN_VALUE'
      ));
    }

    if (this._max !== null && numValue > this._max) {
      errors.push(this._createError(
        `Must be at most ${this._max}`,
        fieldPath,
        numValue,
        'MAX_VALUE'
      ));
    }

    // Multiple check
    if (this._multipleOf !== null && numValue % this._multipleOf !== 0) {
      errors.push(this._createError(
        `Must be a multiple of ${this._multipleOf}`,
        fieldPath,
        numValue,
        'NOT_MULTIPLE'
      ));
    }

    return new ValidationResult(errors.length === 0, errors, numValue);
  }
}

/**
 * Enhanced Boolean validator
 */
class BooleanValidator extends Validator {
  constructor() {
    super();
    this._strict = false;
  }

  /**
   * Requires strict boolean type (returns new instance)
   * @returns {BooleanValidator} New validator instance
   */
  strict() {
    return this._clone({ strict: true });
  }

  /**
   * Clone with new configuration
   * @param {Object} newConfig - New configuration
   * @returns {BooleanValidator} New validator instance
   * @protected
   */
  _clone(newConfig = {}) {
    const clone = super._clone(newConfig);
    clone._strict = newConfig.strict ?? this._strict;
    return clone;
  }

  /**
   * Validates boolean values
   * @param {*} value - Value to validate
   * @param {string} fieldPath - Path to the field being validated
   * @param {Object} context - Validation context
   * @returns {ValidationResult} Validation result
   * @protected
   */
  _validate(value, fieldPath, context) {
    if (this._strict) {
      if (!ValidationUtils.isBoolean(value)) {
        return new ValidationResult(
          false,
          [this._createError('Must be a boolean', fieldPath, value, 'TYPE_ERROR')],
          value
        );
      }
      return new ValidationResult(true, [], value);
    }

    // Convert truthy/falsy values
    const boolValue = Boolean(value);
    return new ValidationResult(true, [], boolValue);
  }
}

/**
 * Enhanced Date validator
 */
class DateValidator extends Validator {
  constructor() {
    super();
    this._min = null;
    this._max = null;
    this._allowString = true;
  }

  /**
   * Sets minimum date (returns new instance)
   * @param {Date|string|number} date - Minimum date
   * @returns {DateValidator} New validator instance
   */
  min(date) {
    const dateObj = new Date(date);
    if (!ValidationUtils.isDate(dateObj)) {
      throw new TypeError('min date must be a valid date');
    }
    return this._clone({ min: dateObj });
  }

  /**
   * Sets maximum date (returns new instance)
   * @param {Date|string|number} date - Maximum date
   * @returns {DateValidator} New validator instance
   */
  max(date) {
    const dateObj = new Date(date);
    if (!ValidationUtils.isDate(dateObj)) {
      throw new TypeError('max date must be a valid date');
    }
    return this._clone({ max: dateObj });
  }

  /**
   * Requires strict Date objects (returns new instance)
   * @returns {DateValidator} New validator instance
   */
  strict() {
    return this._clone({ allowString: false });
  }

  /**
   * Clone with new configuration
   * @param {Object} newConfig - New configuration
   * @returns {DateValidator} New validator instance
   * @protected
   */
  _clone(newConfig = {}) {
    const clone = super._clone(newConfig);
    clone._min = newConfig.min ?? this._min;
    clone._max = newConfig.max ?? this._max;
    clone._allowString = newConfig.allowString ?? this._allowString;
    return clone;
  }

  /**
   * Validates date values
   * @param {*} value - Value to validate
   * @param {string} fieldPath - Path to the field being validated
   * @param {Object} context - Validation context
   * @returns {ValidationResult} Validation result
   * @protected
   */
  _validate(value, fieldPath, context) {
    const errors = [];
    let dateValue = value;

    // Type conversion
    if (!ValidationUtils.isDate(dateValue)) {
      if (!this._allowString) {
        return new ValidationResult(
          false,
          [this._createError('Must be a Date object', fieldPath, value, 'TYPE_ERROR')],
          value
        );
      }
      dateValue = new Date(value);
    }

    // Validity check
    if (!ValidationUtils.isDate(dateValue)) {
      return new ValidationResult(
        false,
        [this._createError('Must be a valid date', fieldPath, value, 'INVALID_DATE')],
        value
      );
    }

    // Range validations
    if (this._min && dateValue < this._min) {
      errors.push(this._createError(
        `Must be after ${this._min.toISOString()}`,
        fieldPath,
        dateValue,
        'MIN_DATE'
      ));
    }

    if (this._max && dateValue > this._max) {
      errors.push(this._createError(
        `Must be before ${this._max.toISOString()}`,
        fieldPath,
        dateValue,
        'MAX_DATE'
      ));
    }

    return new ValidationResult(errors.length === 0, errors, dateValue);
  }
}

/**
 * Enhanced Array validator for comprehensive array validation
 */
class ArrayValidator extends Validator {
  constructor(itemValidator) {
    super();
    this._itemValidator = itemValidator;
    this._minLength = null;
    this._maxLength = null;
    this._unique = false;
    this._compact = false;
  }

  /**
   * Sets minimum array length (returns new instance)
   * @param {number} length - Minimum length
   * @returns {ArrayValidator} New validator instance
   */
  minLength(length) {
    if (!Number.isInteger(length) || length < 0) {
      throw new TypeError('minLength must be a non-negative integer');
    }
    return this._clone({ minLength: length });
  }

  /**
   * Sets maximum array length (returns new instance)
   * @param {number} length - Maximum length
   * @returns {ArrayValidator} New validator instance
   */
  maxLength(length) {
    if (!Number.isInteger(length) || length < 0) {
      throw new TypeError('maxLength must be a non-negative integer');
    }
    return this._clone({ maxLength: length });
  }

  /**
   * Requires all items to be unique (returns new instance)
   * @returns {ArrayValidator} New validator instance
   */
  unique() {
    return this._clone({ unique: true });
  }

  /**
   * Removes null/undefined items (returns new instance)
   * @returns {ArrayValidator} New validator instance
   */
  compact() {
    return this._clone({ compact: true });
  }

  /**
   * Clone with new configuration
   * @param {Object} newConfig - New configuration
   * @returns {ArrayValidator} New validator instance
   * @protected
   */
  _clone(newConfig = {}) {
    const clone = super._clone(newConfig);
    clone._itemValidator = newConfig.itemValidator ?? this._itemValidator;
    clone._minLength = newConfig.minLength ?? this._minLength;
    clone._maxLength = newConfig.maxLength ?? this._maxLength;
    clone._unique = newConfig.unique ?? this._unique;
    clone._compact = newConfig.compact ?? this._compact;
    return clone;
  }

  /**
   * Validates array values and their elements
   * @param {*} value - Value to validate
   * @param {string} fieldPath - Path to the field being validated
   * @param {Object} context - Validation context
   * @returns {ValidationResult} Validation result
   * @protected
   */
  _validate(value, fieldPath, context) {
    const errors = [];

    // Type check
    if (!ValidationUtils.isArray(value)) {
      return new ValidationResult(
        false,
        [this._createError('Must be an array', fieldPath, value, 'TYPE_ERROR')],
        value
      );
    }

    let arrayValue = [...value]; // Create copy to avoid mutation

    // Apply compact if needed
    if (this._compact) {
      arrayValue = arrayValue.filter(item => item != null);
    }

    // Length validations
    if (this._minLength !== null && arrayValue.length < this._minLength) {
      errors.push(this._createError(
        `Must have at least ${this._minLength} item${this._minLength === 1 ? '' : 's'}`,
        fieldPath,
        arrayValue,
        'MIN_LENGTH'
      ));
    }

    if (this._maxLength !== null && arrayValue.length > this._maxLength) {
      errors.push(this._createError(
        `Must have at most ${this._maxLength} item${this._maxLength === 1 ? '' : 's'}`,
        fieldPath,
        arrayValue,
        'MAX_LENGTH'
      ));
    }

    // Unique validation
    if (this._unique) {
      const seen = new Set();
      const duplicates = [];
      
      for (let i = 0; i < arrayValue.length; i++) {
        const item = arrayValue[i];
        const serialized = JSON.stringify(item);
        
        if (seen.has(serialized)) {
          duplicates.push(i);
        } else {
          seen.add(serialized);
        }
      }
      
      if (duplicates.length > 0) {
        errors.push(this._createError(
          'All items must be unique',
          fieldPath,
          arrayValue,
          'NOT_UNIQUE'
        ));
      }
    }

    // Validate each item
    const validatedItems = [];
    for (let i = 0; i < arrayValue.length; i++) {
      const item = arrayValue[i];
      const itemPath = `${fieldPath}[${i}]`;
      const itemResult = this._itemValidator.validate(item, itemPath, context);
      
      if (!itemResult.isValid) {
        errors.push(...itemResult.errors);
      } else {
        validatedItems.push(itemResult.value);
      }
    }

    return new ValidationResult(
      errors.length === 0,
      errors,
      errors.length === 0 ? validatedItems : value
    );
  }
}

/**
 * Enhanced Object validator for comprehensive object validation
 */
class ObjectValidator extends Validator {
  constructor(schema) {
    super();
    this._schema = schema;
    this._strict = false;
    this._stripUnknown = false;
  }

  /**
   * Requires exact schema match (returns new instance)
   * @returns {ObjectValidator} New validator instance
   */
  strict() {
    return this._clone({ strict: true });
  }

  /**
   * Removes unknown properties (returns new instance)
   * @returns {ObjectValidator} New validator instance
   */
  stripUnknown() {
    return this._clone({ stripUnknown: true });
  }

  /**
   * Clone with new configuration
   * @param {Object} newConfig - New configuration
   * @returns {ObjectValidator} New validator instance
   * @protected
   */
  _clone(newConfig = {}) {
    const clone = super._clone(newConfig);
    clone._schema = newConfig.schema ?? this._schema;
    clone._strict = newConfig.strict ?? this._strict;
    clone._stripUnknown = newConfig.stripUnknown ?? this._stripUnknown;
    return clone;
  }

  /**
   * Validates object values against the defined schema
   * @param {*} value - Value to validate
   * @param {string} fieldPath - Path to the field being validated
   * @param {Object} context - Validation context
   * @returns {ValidationResult} Validation result
   * @protected
   */
  _validate(value, fieldPath, context) {
    const errors = [];

    // Type check
    if (!ValidationUtils.isObject(value)) {
      return new ValidationResult(
        false,
        [this._createError('Must be an object', fieldPath, value, 'TYPE_ERROR')],
        value
      );
    }

    const validatedObject = {};
    const processedKeys = new Set();

    // Validate each field in the schema
    for (const [key, validator] of Object.entries(this._schema)) {
      processedKeys.add(key);
      const fieldValue = value[key];
      const currentPath = fieldPath ? `${fieldPath}.${key}` : key;
      const fieldResult = validator.validate(fieldValue, currentPath, context);

      if (!fieldResult.isValid) {
        errors.push(...fieldResult.errors);
      } else if (fieldResult.value !== undefined) {
        validatedObject[key] = fieldResult.value;
      }
    }

    // Handle unknown properties
    const unknownKeys = Object.keys(value).filter(key => !processedKeys.has(key));
    
    if (unknownKeys.length > 0) {
      if (this._strict) {
        errors.push(this._createError(
          `Unknown properties: ${unknownKeys.join(', ')}`,
          fieldPath,
          value,
          'UNKNOWN_PROPERTIES'
        ));
      } else if (!this._stripUnknown) {
        // Include unknown properties in result
        for (const key of unknownKeys) {
          validatedObject[key] = ValidationUtils.deepClone(value[key]);
        }
      }
    }

    return new ValidationResult(
      errors.length === 0,
      errors,
      errors.length === 0 ? validatedObject : value
    );
  }
}

/**
 * Enhanced Schema factory class with advanced validator creation
 * 
 * Provides static methods to create type-safe validators for various data types.
 * All methods return validator instances that can be chained with additional
 * validation rules and modifiers.
 * 
 * @example
 * // Simple validators
 * const stringValidator = Schema.string();
 * const numberValidator = Schema.number();
 * 
 * // Complex validators with rules
 * const emailValidator = Schema.string()
 *   .email()
 *   .withMessage('Please enter a valid email address');
 * 
 * // Object validators
 * const userValidator = Schema.object({
 *   name: Schema.string().minLength(2).maxLength(50),
 *   age: Schema.number().min(0).max(120).optional(),
 *   email: emailValidator
 * });
 */
class Schema {
  /**
   * Creates a string validator
   * @returns {StringValidator} String validator instance
   */
  static string() {
    return new StringValidator();
  }
  
  /**
   * Creates a number validator
   * @returns {NumberValidator} Number validator instance
   */
  static number() {
    return new NumberValidator();
  }
  
  /**
   * Creates a boolean validator
   * @returns {BooleanValidator} Boolean validator instance
   */
  static boolean() {
    return new BooleanValidator();
  }
  
  /**
   * Creates a date validator
   * @returns {DateValidator} Date validator instance
   */
  static date() {
    return new DateValidator();
  }
  
  /**
   * Creates an object validator with the specified schema
   * @param {Object.<string, Validator>} schema - Object schema definition
   * @returns {ObjectValidator} Object validator instance
   */
  static object(schema) {
    if (!ValidationUtils.isObject(schema)) {
      throw new TypeError('Schema must be an object');
    }
    return new ObjectValidator(schema);
  }
  
  /**
   * Creates an array validator for arrays of the specified type
   * @param {Validator} itemValidator - Validator for array items
   * @returns {ArrayValidator} Array validator instance
   */
  static array(itemValidator) {
    if (!(itemValidator instanceof Validator)) {
      throw new TypeError('Item validator must be an instance of Validator');
    }
    return new ArrayValidator(itemValidator);
  }

  /**
   * Creates a union validator (accepts any of the provided validators)
   * @param {...Validator} validators - Array of validators
   * @returns {Validator} Union validator instance
   */
  static union(...validators) {
    if (validators.length === 0) {
      throw new TypeError('Union must have at least one validator');
    }
    
    return new (class UnionValidator extends Validator {
      constructor() {
        super();
        this._validators = validators;
      }

      _validate(value, fieldPath, context) {
        const allErrors = [];
        
        for (const validator of this._validators) {
          const result = validator.validate(value, fieldPath, context);
          if (result.isValid) {
            return new ValidationResult(true, [], result.value);
          }
          allErrors.push(...result.errors);
        }

        return new ValidationResult(
          false,
          [this._createError(
            'Value does not match any of the allowed types',
            fieldPath,
            value,
            'UNION_MISMATCH'
          )],
          value
        );
      }
    })();
  }

  /**
   * Creates a literal validator (accepts only specific values)
   * @param {...*} values - Allowed literal values
   * @returns {Validator} Literal validator instance
   */
  static literal(...values) {
    if (values.length === 0) {
      throw new TypeError('Literal must have at least one value');
    }

    return new (class LiteralValidator extends Validator {
      constructor() {
        super();
        this._values = values;
      }

      _validate(value, fieldPath, context) {
        if (!this._values.includes(value)) {
          return new ValidationResult(
            false,
            [this._createError(
              `Must be one of: ${this._values.map(v => JSON.stringify(v)).join(', ')}`,
              fieldPath,
              value,
              'LITERAL_MISMATCH'
            )],
            value
          );
        }

        return new ValidationResult(true, [], value);
      }
    })();
  }
}

/**
 * ValidationContainer - A comprehensive container class for the validation library
 * 
 * Provides a centralized interface for creating, managing, and executing validations
 * with additional features like validator registry, batch processing, and configuration.
 * 
 * @example
 * const validator = new ValidationContainer({
 *   strictMode: true,
 *   throwOnError: false
 * });
 * 
 * // Register reusable validators
 * validator.register('email', validator.schema.string().email());
 * validator.register('positiveNumber', validator.schema.number().positive());
 * 
 * // Use registered validators
 * const result = validator.validate('email', 'john@example.com');
 */
class ValidationContainer {
  /**
   * Create a new validation container
   * @param {Object} options - Configuration options
   * @param {boolean} options.strictMode - Enable strict validation mode
   * @param {boolean} options.throwOnError - Throw errors instead of returning results
   * @param {Object} options.defaultContext - Default validation context
   * @param {boolean} options.cacheResults - Enable result caching
   */
  constructor(options = {}) {
    this.options = {
      strictMode: false,
      throwOnError: false,
      defaultContext: {},
      cacheResults: false,
      ...options
    };

    // Validator registry for reusable validators
    this._validators = new Map();
    
    // Result cache for performance
    this._cache = new Map();
    
    // Validation statistics
    this._stats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      cacheHits: 0
    };

    // Expose the Schema class for direct access
    this.schema = Schema;
  }

  /**
   * Register a named validator for reuse
   * @param {string} name - Validator name
   * @param {Validator} validator - Validator instance
   * @returns {ValidationContainer} Returns this container for chaining
   */
  register(name, validator) {
    if (!name || typeof name !== 'string') {
      throw new TypeError('Validator name must be a non-empty string');
    }
    if (!(validator instanceof Validator)) {
      throw new TypeError('Validator must be an instance of Validator');
    }
    
    this._validators.set(name, validator);
    return this;
  }

  /**
   * Get a registered validator by name
   * @param {string} name - Validator name
   * @returns {Validator} Validator instance
   * @throws {Error} If validator not found
   */
  getValidator(name) {
    if (!this._validators.has(name)) {
      throw new Error(`Validator '${name}' not found. Available validators: ${Array.from(this._validators.keys()).join(', ')}`);
    }
    return this._validators.get(name);
  }

  /**
   * Check if a validator is registered
   * @param {string} name - Validator name
   * @returns {boolean} True if validator exists
   */
  hasValidator(name) {
    return this._validators.has(name);
  }

  /**
   * List all registered validator names
   * @returns {string[]} Array of validator names
   */
  listValidators() {
    return Array.from(this._validators.keys());
  }

  /**
   * Validate a value using a registered validator
   * @param {string} validatorName - Name of registered validator
   * @param {*} value - Value to validate
   * @param {string} fieldPath - Field path for error reporting
   * @param {Object} context - Additional validation context
   * @returns {ValidationResult} Validation result
   */
  validate(validatorName, value, fieldPath = '', context = {}) {
    const validator = this.getValidator(validatorName);
    const finalContext = { ...this.options.defaultContext, ...context };
    
    // Check cache if enabled
    if (this.options.cacheResults) {
      const cacheKey = this._getCacheKey(validatorName, value, fieldPath, finalContext);
      if (this._cache.has(cacheKey)) {
        this._stats.cacheHits++;
        return this._cache.get(cacheKey);
      }
    }

    // Perform validation
    this._stats.totalValidations++;
    const result = validator.validate(value, fieldPath, finalContext);
    
    // Update statistics
    if (result.isValid) {
      this._stats.successfulValidations++;
    } else {
      this._stats.failedValidations++;
    }

    // Cache result if enabled
    if (this.options.cacheResults) {
      const cacheKey = this._getCacheKey(validatorName, value, fieldPath, finalContext);
      this._cache.set(cacheKey, result);
    }

    // Throw error if configured to do so
    if (this.options.throwOnError && !result.isValid) {
      throw result.errors[0] || new ValidationError('Validation failed', fieldPath, value);
    }

    return result;
  }

  /**
   * Validate multiple values using registered validators
   * @param {Array} validations - Array of {validator, value, path} objects
   * @param {Object} context - Shared validation context
   * @returns {ValidationResult} Combined validation result
   */
  validateBatch(validations, context = {}) {
    const results = [];
    const allErrors = [];
    let allValid = true;

    for (const { validator: validatorName, value, path = '' } of validations) {
      try {
        const result = this.validate(validatorName, value, path, context);
        results.push({ path, value: result.value, isValid: result.isValid });
        
        if (!result.isValid) {
          allValid = false;
          allErrors.push(...result.errors);
        }
      } catch (error) {
        allValid = false;
        allErrors.push(new ValidationError(
          `Batch validation error: ${error.message}`,
          path,
          value,
          'BATCH_ERROR'
        ));
      }
    }

    return new ValidationResult(allValid, allErrors, results);
  }

  /**
   * Validate an object against a schema of registered validators
   * @param {Object} schema - Schema mapping field names to validator names
   * @param {Object} data - Data object to validate
   * @param {Object} context - Validation context
   * @returns {ValidationResult} Validation result
   */
  validateObject(schema, data, context = {}) {
    const validations = [];
    
    for (const [fieldName, validatorName] of Object.entries(schema)) {
      validations.push({
        validator: validatorName,
        value: data[fieldName],
        path: fieldName
      });
    }

    return this.validateBatch(validations, context);
  }

  /**
   * Create a validator group for complex validations
   * @param {string} groupName - Group name
   * @param {Object} schema - Schema mapping field names to validator names
   * @returns {ValidationContainer} Returns this container for chaining
   */
  createGroup(groupName, schema) {
    const groupValidator = this.schema.object(
      Object.fromEntries(
        Object.entries(schema).map(([key, validatorName]) => [
          key,
          this.getValidator(validatorName)
        ])
      )
    );
    
    this.register(groupName, groupValidator);
    return this;
  }

  /**
   * Get validation statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this._stats,
      successRate: this._stats.totalValidations > 0 
        ? (this._stats.successfulValidations / this._stats.totalValidations * 100).toFixed(2) + '%'
        : '0%',
      cacheHitRate: this._stats.totalValidations > 0
        ? (this._stats.cacheHits / this._stats.totalValidations * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Clear validation cache
   * @returns {ValidationContainer} Returns this container for chaining
   */
  clearCache() {
    this._cache.clear();
    return this;
  }

  /**
   * Reset statistics
   * @returns {ValidationContainer} Returns this container for chaining
   */
  resetStats() {
    this._stats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      cacheHits: 0
    };
    return this;
  }

  /**
   * Create a child container with inherited configuration
   * @param {Object} overrideOptions - Options to override
   * @returns {ValidationContainer} New child container
   */
  createChild(overrideOptions = {}) {
    const childOptions = { ...this.options, ...overrideOptions };
    const child = new ValidationContainer(childOptions);
    
    // Copy registered validators to child
    for (const [name, validator] of this._validators) {
      child.register(name, validator);
    }
    
    return child;
  }

  /**
   * Generate cache key for result caching
   * @param {string} validatorName - Validator name
   * @param {*} value - Value being validated
   * @param {string} fieldPath - Field path
   * @param {Object} context - Validation context
   * @returns {string} Cache key
   * @private
   */
  _getCacheKey(validatorName, value, fieldPath, context) {
    return JSON.stringify({
      validator: validatorName,
      value,
      path: fieldPath,
      context
    });
  }

  /**
   * Export container configuration and validators
   * @returns {Object} Exportable configuration
   */
  export() {
    return {
      options: this.options,
      validators: Array.from(this._validators.keys()),
      stats: this.getStats()
    };
  }
}

// =============================================================================
// COMPREHENSIVE USAGE EXAMPLES
// =============================================================================

/**
 * Enhanced address validation schema
 */
const addressSchema = Schema.object({
  street: Schema.string()
    .trim()
    .minLength(1)
    .maxLength(100)
    .withMessage('Street address must be 1-100 characters'),
  city: Schema.string()
    .trim()
    .minLength(1)
    .maxLength(50)
    .withMessage('City name must be 1-50 characters'),
  postalCode: Schema.string()
    .trim()
    .pattern(ValidationUtils.PATTERNS.POSTAL_CODE_US)
    .withMessage('Postal code must be in format 12345 or 12345-1234'),
  country: Schema.string()
    .trim()
    .minLength(2)
    .maxLength(3)
    .toUpperCase()
    .withMessage('Country code must be 2-3 characters')
}).strict();

/**
 * Comprehensive user validation schema
 */
const userSchema = Schema.object({
  id: Schema.string()
    .trim()
    .uuid()
    .withMessage('User ID must be a valid UUID'),
  name: Schema.string()
    .trim()
    .minLength(2)
    .maxLength(50)
    .pattern(/^[a-zA-Z\s\-']+$/)
    .withMessage('Name must contain only letters, spaces, hyphens, and apostrophes'),
  email: Schema.string()
    .trim()
    .toLowerCase()
    .email()
    .withMessage('Please enter a valid email address'),
  age: Schema.number()
    .integer()
    .min(0)
    .max(120)
    .optional()
    .withMessage('Age must be a whole number between 0 and 120'),
  isActive: Schema.boolean()
    .withMessage('Active status must be true or false'),
  role: Schema.literal('admin', 'user', 'moderator')
    .withMessage('Role must be admin, user, or moderator'),
  tags: Schema.array(Schema.string().trim().toLowerCase())
    .minLength(1)
    .maxLength(10)
    .unique()
    .withMessage('Must have 1-10 unique tags'),
  address: addressSchema.optional(),
  metadata: Schema.object({})
    .stripUnknown()
    .optional(),
  createdAt: Schema.date()
    .min(new Date('2020-01-01'))
    .max(new Date('2030-12-31'))
    .optional()
    .withMessage('Created date must be between 2020 and 2030')
}).stripUnknown();

// =============================================================================
// DEMONSTRATION WITH SAMPLE DATA
// =============================================================================

/**
 * Valid user data demonstrating transformations
 */
const validUserData = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "John O'Doe",
  email: "JOHN.DOE@EXAMPLE.COM",
  age: 30,
  isActive: true,
  role: "admin",
  tags: ["DEVELOPER", "designer", " Team-Lead "],
  address: {
    street: "  123 Main Street  ",
    city: " San Francisco ",
    postalCode: "94105-1234",
    country: "usa"
  },
  createdAt: "2023-01-15T10:30:00Z",
  extraField: "This will be stripped"
};

/**
 * Invalid user data for comprehensive error testing
 */
const invalidUserData = {
  id: "invalid-uuid",
  name: "J123",
  email: "invalid-email",
  age: -5.5,
  isActive: "yes",
  role: "superuser",
  tags: ["dev", "dev", ""],
  address: {
    street: "",
    city: "A".repeat(60),
    postalCode: "123",
    country: "INVALID_COUNTRY_CODE"
  },
  createdAt: "invalid-date"
};

// Comprehensive validation demonstration
console.log('=== ENHANCED TYPE-SAFE VALIDATION RESULTS ===\n');

try {
  console.log('Valid User Data:');
  const validResult = userSchema.validate(validUserData);
  console.log('Is Valid:', validResult.isValid);
  if (validResult.isValid) {
    console.log('Transformed Data:', JSON.stringify(validResult.value, null, 2));
  } else {
    console.log('Errors:', validResult.errorMessages);
  }
  console.log();

  console.log('Invalid User Data:');
  const invalidResult = userSchema.validate(invalidUserData);
  console.log('Is Valid:', invalidResult.isValid);
  if (!invalidResult.isValid) {
    console.log('Detailed Errors:');
    invalidResult.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. [${error.code}] ${error.field}: ${error.message}`);
    });
  }
  console.log();

  // Demonstrate parse method
  console.log('Parse method demonstration:');
  try {
    const parsedData = userSchema.parse(validUserData);
    console.log('Parse successful - data transformed and validated');
  } catch (error) {
    console.log('Parse failed:', error.message);
  }

  // Demonstrate advanced features
  console.log('\nAdvanced Features Demo:');
  
  // Union type validation
  const stringOrNumber = Schema.union(Schema.string(), Schema.number());
  console.log('Union validation (string):', stringOrNumber.validate("hello").isValid);
  console.log('Union validation (number):', stringOrNumber.validate(42).isValid);
  console.log('Union validation (boolean):', stringOrNumber.validate(true).isValid);

  // Conditional validation
  const conditionalValidator = Schema.number()
    .when((value) => value > 10, Schema.number().max(100))
    .withMessage('Numbers greater than 10 must be at most 100');
  
  console.log('Conditional validation (5):', conditionalValidator.validate(5).isValid);
  console.log('Conditional validation (50):', conditionalValidator.validate(50).isValid);
  console.log('Conditional validation (150):', conditionalValidator.validate(150).isValid);

} catch (error) {
  console.error('Unexpected error:', error);
}

// =============================================================================
// VALIDATION CONTAINER USAGE EXAMPLES
// =============================================================================

/**
 * Create a new validation container instance with configuration
 */
const validationContainer = new ValidationContainer({
  strictMode: true,
  cacheResults: true,
  defaultContext: { 
    locale: 'en-US',
    timezone: 'UTC'
  }
});

// Register common validators for reuse
validationContainer
  .register('email', Schema.string().trim().toLowerCase().email())
  .register('password', Schema.string().minLength(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/))
  .register('positiveInteger', Schema.number().integer().positive())
  .register('uuid', Schema.string().uuid())
  .register('phone', Schema.string().pattern(ValidationUtils.PATTERNS.PHONE))
  .register('url', Schema.string().url())
  .register('nonEmptyString', Schema.string().trim().minLength(1));

// Register complex address validator
validationContainer.register('address', Schema.object({
  street: Schema.string().trim().minLength(1).maxLength(100),
  city: Schema.string().trim().minLength(1).maxLength(50),
  postalCode: Schema.string().pattern(ValidationUtils.PATTERNS.POSTAL_CODE_US),
  country: Schema.string().trim().toUpperCase().minLength(2).maxLength(3)
}));

// Create a user validation group using registered validators
validationContainer.createGroup('user', {
  email: 'email',
  password: 'password',
  age: 'positiveInteger'
});

console.log('\n=== VALIDATION CONTAINER DEMONSTRATION ===\n');

// Test individual validators
console.log('Individual Validation Tests:');
console.log('Valid email:', validationContainer.validate('email', ' JOHN@EXAMPLE.COM ').isValid);
console.log('Invalid email:', validationContainer.validate('email', 'invalid-email').isValid);
console.log('Valid password:', validationContainer.validate('password', 'Password123').isValid);
console.log('Invalid password:', validationContainer.validate('password', '123').isValid);

// Test batch validation
console.log('\nBatch Validation Test:');
const batchValidations = [
  { validator: 'email', value: 'user@example.com', path: 'user.email' },
  { validator: 'password', value: 'SecurePass123', path: 'user.password' },
  { validator: 'positiveInteger', value: 25, path: 'user.age' }
];

const batchResult = validationContainer.validateBatch(batchValidations);
console.log('Batch validation result:', {
  isValid: batchResult.isValid,
  errorCount: batchResult.errors.length,
  validItemsCount: batchResult.value.filter(item => item.isValid).length
});

// Test object validation using schema mapping
console.log('\nObject Validation Test:');
const userValidationSchema = {
  email: 'email',
  password: 'password',
  age: 'positiveInteger'
};

const testUserData = {
  email: ' admin@company.com ',
  password: 'SuperSecure123',
  age: 30
};

const objectResult = validationContainer.validateObject(userValidationSchema, testUserData);
console.log('Object validation result:', {
  isValid: objectResult.isValid,
  validatedItemsCount: objectResult.value.filter(item => item.isValid).length
});

// Demonstrate container statistics
console.log('\nValidation Statistics:');
console.log(validationContainer.getStats());

// Show registered validators
console.log('\nRegistered Validators:', validationContainer.listValidators());

// Demonstrate child container creation
console.log('\nChild Container Demo:');
const childContainer = validationContainer.createChild({
  throwOnError: true,
  cacheResults: false
});

console.log('Child has same validators:', childContainer.hasValidator('email'));
console.log('Child options differ:', childContainer.options.throwOnError !== validationContainer.options.throwOnError);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
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
  };
}
