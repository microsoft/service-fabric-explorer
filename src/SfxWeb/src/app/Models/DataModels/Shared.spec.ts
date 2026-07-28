import { compareUpgradeDomainNames } from './Shared';

describe('compareUpgradeDomainNames', () => {
    fit('sorts numeric portions of upgrade domain names numerically', () => {
        const names = ['UD_1', 'UD_10', 'UD_2'];

        expect(names.sort(compareUpgradeDomainNames)).toEqual(['UD_1', 'UD_2', 'UD_10']);
    });
});
