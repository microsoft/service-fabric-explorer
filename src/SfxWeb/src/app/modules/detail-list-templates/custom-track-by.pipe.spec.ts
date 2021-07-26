import { CustomTrackByPipe } from './custom-track-by.pipe';

describe('CustomTrackByPipe', () => {
  it('create an instance', () => {
    const pipe = new CustomTrackByPipe();
    expect(pipe).toBeTruthy();
  });
});
