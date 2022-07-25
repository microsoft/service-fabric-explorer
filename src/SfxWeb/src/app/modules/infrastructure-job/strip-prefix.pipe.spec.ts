import { StripPrefixPipe } from './strip-prefix.pipe';

describe('StripPrefixPipe', () => {
  it('create an instance', () => {
    const pipe = new StripPrefixPipe();
    expect(pipe).toBeTruthy();
  });
});
