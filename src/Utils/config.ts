import path from "path";

class Config {
    public environment = "development";
    // public environment = "production";
    public port = +process.env?.PORT || 6001;
    public dataFolder = path.resolve(__dirname, "..", "Assets", "Data");
}

const config = new Config();
export default config;