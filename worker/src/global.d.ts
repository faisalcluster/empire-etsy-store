/**
 * Global Type Definitions for Cloudflare Workers
 */

declare global {
  function btoa(data: string): string
  function atob(data: string): string
  var crypto: typeof globalThis extends { subtle: SubtleCrypto }

  interface SubtleCrypto {
    importKey(
      format: 'raw',
      keyData: BufferSource,
      algorithm: { name: string; hash?: string },
      extractable: boolean,
      keyUsages: string[]
    ): Promise<CryptoKey>
    sign(
      algorithm: string,
      key: CryptoKey,
      data: BufferSource
    ): Promise<ArrayBuffer>
    verify(
      algorithm: string,
      key: CryptoKey,
      signature: BufferSource,
      data: BufferSource
    ): Promise<boolean>
  }
}

declare const TextEncoder: {
  prototype: TextEncoder
  new (): TextEncoder
}

interface TextEncoder {
  encode(input?: string): Uint8Array
}

export {}
