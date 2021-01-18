import * as assert from 'assert';


/**
 * Re-formats a "standard" version string (e.g: "1.2.3-alpha4") into a form that
 * is lexicographically sortable (e.g: "000001.000002.000003.alpha000004").
 *
 * @param version the version to be re-formatted, e.g: "1.2.3-alpha4"
 * 
 * @returns the re-formatted version, e.g: "000001.000002.000003.alpha000004"
 */
export function renderComparableVersion(version: string): string {
  return version
    .split(/[.+-]/)
    .map((part) => /^\d+$/.test(part)
      ? part.padStart(6, '0')
      : part.split(/(?<=[^\d])(?=\d)/)
          .map((seg) => /^\d+$/.test(seg) ? seg.padStart(6, '0') : seg)
          .join('')
    )
    .join('.');
}

// tests
function test() {
  assert.equal(renderComparableVersion('1.0.0'), '000001.000000.000000');
  assert.equal(renderComparableVersion('0.56.3'), '000000.000056.000003');
  assert.equal(renderComparableVersion('2.0.0-beta3'), '000002.000000.000000.beta000003');
}

test();
