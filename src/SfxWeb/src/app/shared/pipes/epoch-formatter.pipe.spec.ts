import { EpochFormatterPipe } from './epoch-formatter.pipe';

describe('EpochFormatterPipe', () => {
  it('create an instance', () => {
    const pipe = new EpochFormatterPipe();
    expect(pipe).toBeTruthy();
  });
});
