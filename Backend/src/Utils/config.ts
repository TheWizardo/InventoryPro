import path from "path";

class Config {
    // public environment = "development";
    public environment = "production";
    public port = +process.env?.PORT || 6001;
    public assetsFolder = path.resolve(__dirname, "..", "Assets");
    public client = process.env?.CLIENT || "varmed";
    public licenseURL = `https://raw.githubusercontent.com/TheWizardo/TheWizardo.github.io/refs/heads/main/${this.client}_license.wiz`;
}

const config = new Config();
export default config;