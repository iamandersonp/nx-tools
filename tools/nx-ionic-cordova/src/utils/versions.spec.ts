import { DEV_DEPENDENCIES, RUNTIME_DEPENDENCIES } from './versions';

describe('versions', () => {
  it('targets the supported majors', () => {
    expect(RUNTIME_DEPENDENCIES['@angular/core']).toBe('^22.0.0');
    expect(RUNTIME_DEPENDENCIES['@ionic/angular']).toBe('^9.0.0');
    expect(RUNTIME_DEPENDENCIES['ionicons']).toBe('^8.1.0');
    expect(DEV_DEPENDENCIES['@ionic/angular-toolkit']).toBe('^13.0.0');
    expect(DEV_DEPENDENCIES['jest-preset-angular']).toBe('^17.0.0');
    expect(DEV_DEPENDENCIES['cordova']).toBe('^13.0.0');
    expect(DEV_DEPENDENCIES['typescript']).toBe('~6.0.0');
  });

  it('lists every package in exactly one group', () => {
    const shared = Object.keys(RUNTIME_DEPENDENCIES).filter((name) => name in DEV_DEPENDENCIES);

    expect(shared).toEqual([]);
  });
});
