import { createMD5, createSHA1, createSHA256, createSHA512 } from "hash-wasm";

self.onmessage = async (e: MessageEvent) => {
  const { file, chunkSize } = e.data;

  try {
    const md5 = await createMD5();
    const sha1 = await createSHA1();
    const sha256 = await createSHA256();
    const sha512 = await createSHA512();

    md5.init();
    sha1.init();
    sha256.init();
    sha512.init();

    let offset = 0;
    
    while (offset < file.size) {
      // slice the file
      const chunk = file.slice(offset, offset + chunkSize);
      // read natively
      const buffer = await chunk.arrayBuffer();
      const uint8View = new Uint8Array(buffer);

      // update hashers sequentially (or we could try parallel if they didn't block, but WASM is synchronous inside update anyway)
      md5.update(uint8View);
      sha1.update(uint8View);
      sha256.update(uint8View);
      sha512.update(uint8View);

      offset += chunk.size;
      
      self.postMessage({
        type: "progress",
        bytesProcessed: offset,
      });
    }

    const hashes = {
      md5: md5.digest("hex"),
      sha1: sha1.digest("hex"),
      sha256: sha256.digest("hex"),
      sha512: sha512.digest("hex"),
    };

    self.postMessage({
      type: "complete",
      hashes,
    });

  } catch (error) {
    self.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
