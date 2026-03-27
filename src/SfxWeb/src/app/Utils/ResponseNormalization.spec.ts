import { normalizeKeys, toPascalCase } from './ResponseNormalization';

describe('toPascalCase', () => {
  it('should return PascalCase strings unchanged', () => {
    expect(toPascalCase('Name')).toBe('Name');
    expect(toPascalCase('HealthState')).toBe('HealthState');
    expect(toPascalCase('ContinuationToken')).toBe('ContinuationToken');
  });

  it('should convert camelCase to PascalCase', () => {
    expect(toPascalCase('name')).toBe('Name');
    expect(toPascalCase('healthState')).toBe('HealthState');
    expect(toPascalCase('continuationToken')).toBe('ContinuationToken');
    expect(toPascalCase('id')).toBe('Id');
  });

  it('should convert snake_case to PascalCase', () => {
    expect(toPascalCase('health_state')).toBe('HealthState');
    expect(toPascalCase('continuation_token')).toBe('ContinuationToken');
  });

  it('should convert kebab-case to PascalCase', () => {
    expect(toPascalCase('health-state')).toBe('HealthState');
    expect(toPascalCase('continuation-token')).toBe('ContinuationToken');
  });

  it('should handle empty/null strings', () => {
    expect(toPascalCase('')).toBe('');
    expect(toPascalCase(null)).toBeNull();
    expect(toPascalCase(undefined)).toBeUndefined();
  });
});

describe('normalizeKeys', () => {
  it('should return primitives unchanged', () => {
    expect(normalizeKeys(42)).toBe(42);
    expect(normalizeKeys('hello')).toBe('hello');
    expect(normalizeKeys(true)).toBe(true);
    expect(normalizeKeys(null)).toBeNull();
    expect(normalizeKeys(undefined)).toBeUndefined();
  });

  it('should normalize top-level camelCase keys to PascalCase', () => {
    const input = { name: 'TestApp', healthState: 'Ok', id: 'abc' };
    const result = normalizeKeys<any>(input);
    expect(result.Name).toBe('TestApp');
    expect(result.HealthState).toBe('Ok');
    expect(result.Id).toBe('abc');
  });

  it('should leave PascalCase keys unchanged', () => {
    const input = { Name: 'TestApp', HealthState: 'Ok', Id: 'abc' };
    const result = normalizeKeys<any>(input);
    expect(result.Name).toBe('TestApp');
    expect(result.HealthState).toBe('Ok');
    expect(result.Id).toBe('abc');
  });

  it('should handle nested objects', () => {
    const input = {
      name: 'TestApp',
      healthEvents: [
        { sourceId: 'System.FM', property: 'State', healthState: 'Ok' }
      ]
    };
    const result = normalizeKeys<any>(input);
    expect(result.Name).toBe('TestApp');
    expect(result.HealthEvents.length).toBe(1);
    expect(result.HealthEvents[0].SourceId).toBe('System.FM');
    expect(result.HealthEvents[0].Property).toBe('State');
    expect(result.HealthEvents[0].HealthState).toBe('Ok');
  });

  it('should handle arrays at the top level', () => {
    const input = [
      { name: 'Node1', id: '1' },
      { name: 'Node2', id: '2' }
    ];
    const result = normalizeKeys<any[]>(input);
    expect(result[0].Name).toBe('Node1');
    expect(result[1].Name).toBe('Node2');
  });

  it('should handle IRawCollection-like structure', () => {
    const input = {
      continuationToken: '',
      items: [
        { name: 'App1', typeName: 'AppType', status: 'Ready' }
      ]
    };
    const result = normalizeKeys<any>(input);
    expect(result.ContinuationToken).toBe('');
    expect(result.Items.length).toBe(1);
    expect(result.Items[0].Name).toBe('App1');
    expect(result.Items[0].TypeName).toBe('AppType');
  });

  it('should handle mixed casing in the same object', () => {
    const input = {
      Name: 'Already PascalCase',
      healthState: 'camelCase',
      type_name: 'snake_case'
    };
    const result = normalizeKeys<any>(input);
    expect(result.Name).toBe('Already PascalCase');
    expect(result.HealthState).toBe('camelCase');
    expect(result.TypeName).toBe('snake_case');
  });

  it('should not alter string values', () => {
    const input = { name: 'fabric:/myApp', status: 'ready' };
    const result = normalizeKeys<any>(input);
    expect(result.Name).toBe('fabric:/myApp');
    expect(result.Status).toBe('ready');
  });
});
