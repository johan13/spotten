import HtmlWebpackPlugin from "html-webpack-plugin";
import { Configuration } from "webpack";
import CopyPlugin from "copy-webpack-plugin";

const isProd = process.env.NODE_ENV === "production";

const config: Configuration = {
    mode: isProd ? "production" : "development",
    entry: "./src/ui/index.tsx",
    output: {
        filename: "[name].[contenthash:8].js",
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    externals: {
        "pdfkit": "PDFDocument",
        "blob-stream": "blobStream",
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "public/index.html",
        }),
        new CopyPlugin({
            patterns: [
                { from: "public", globOptions: { ignore: ["**/index.html"] } },
                { from: "node_modules/pdfkit/js/pdfkit.standalone.js" },
                { from: "node_modules/blob-stream/.js", to: "blob-stream.js" },
            ],
        }),
    ],
    performance: {
        maxAssetSize: 2048 * 1024,
        maxEntrypointSize: 512 * 1024,
    },
    devtool: isProd ? false : "eval-source-map",
};

export default config;
