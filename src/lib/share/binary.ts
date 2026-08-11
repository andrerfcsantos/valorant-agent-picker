/**
 * Byte-level primitives for the share codec: a growable writer, a bounds-checked
 * reader, base64url conversion and a one-byte checksum.
 */

export type ShareErrorReason =
  /** Not valid base64url, truncated, or structurally impossible. */
  | "malformed"
  /** Decoded cleanly but the checksum disagrees, so a character was mangled. */
  | "corrupt"
  /** Written by a newer version of the site than this bundle understands. */
  | "unsupported-version";

export class ShareDecodeError extends Error {
  readonly reason: ShareErrorReason;

  constructor(reason: ShareErrorReason, message: string) {
    super(message);
    this.name = "ShareDecodeError";
    this.reason = reason;
  }
}

export class ByteWriter {
  private bytes: number[] = [];

  u8(value: number): void {
    this.bytes.push(value & 0xff);
  }

  raw(values: Uint8Array | number[]): void {
    for (const value of values) this.bytes.push(value & 0xff);
  }

  /** Length-prefixed blob. Throws if it does not fit in a one-byte length. */
  blob(values: Uint8Array): void {
    if (values.length > 0xff) {
      throw new RangeError(`blob too long: ${values.length} bytes`);
    }
    this.u8(values.length);
    this.raw(values);
  }

  toBytes(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

export class ByteReader {
  private offset = 0;

  constructor(private readonly bytes: Uint8Array) {}

  get remaining(): number {
    return this.bytes.length - this.offset;
  }

  u8(): number {
    if (this.offset >= this.bytes.length) {
      throw new ShareDecodeError("malformed", "unexpected end of share data");
    }
    return this.bytes[this.offset++];
  }

  raw(length: number): Uint8Array {
    if (length > this.remaining) {
      throw new ShareDecodeError("malformed", "unexpected end of share data");
    }
    const slice = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  blob(): Uint8Array {
    return this.raw(this.u8());
  }
}

/**
 * FNV-1a folded down to a single byte. Enough to catch a link that lost or
 * gained a character in transit, which would otherwise decode into a valid but
 * different result.
 */
export function checksum8(bytes: Uint8Array): number {
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return (hash ^ (hash >>> 8) ^ (hash >>> 16) ^ (hash >>> 24)) & 0xff;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new ShareDecodeError("malformed", "share data is not base64url");
  }
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded =
    padding === 0 ? normalized : normalized + "=".repeat(4 - padding);

  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new ShareDecodeError("malformed", "share data is not base64url");
  }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function encodeText(value: string): Uint8Array {
  return textEncoder.encode(value);
}

export function decodeText(bytes: Uint8Array): string {
  return textDecoder.decode(bytes);
}
