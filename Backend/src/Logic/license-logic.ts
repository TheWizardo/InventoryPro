import { readFileSync } from "fs";
import { privateDecrypt, constants } from "crypto";
import config from "../Utils/config";

class LicenseLogic {
  public licenseDate: { licenseEnd: Date } = { licenseEnd: null };

  public decryptJsonMessage<T = any>(
    encryptedMessage: string | Buffer
  ): T {
    try {
      const privateKeyPath = config.assetsFolder + "/privateKey.pem"
      const privateKey = readFileSync(privateKeyPath, "utf-8");

      // Convert encrypted message into Buffer if base64 string
      const encryptedBuffer =
        typeof encryptedMessage === "string"
          ? Buffer.from(encryptedMessage, "base64")
          : encryptedMessage;

      // Decrypt using RSA private key
      const decryptedBuffer = privateDecrypt(
        {
          key: privateKey,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256"
        },
        encryptedBuffer as Uint8Array
      );

      // Convert decrypted data to string
      const decryptedString = decryptedBuffer.toString("utf8");

      // Parse JSON and return
      return JSON.parse(decryptedString);
    }
    catch {
      return { licenseEnd: "Invalid" } as T;
    }
  }

  public async fetchLicense() {
    const res = await fetch(config.licenseURL);
    const lic = await res.text();
    return lic
  }
}

const licenseLogic = new LicenseLogic()
export default licenseLogic;
