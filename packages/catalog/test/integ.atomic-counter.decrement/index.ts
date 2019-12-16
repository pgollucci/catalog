import { tryDecrement } from './client';

export async function handler() {
  if (await tryDecrement()) {
    console.log('success');
  } else {
    console.log('failure');
  }
}