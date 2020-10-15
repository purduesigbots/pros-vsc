import path from 'path';

module.exports = {
    entry: {
        configViewer: "./src/view/app/index.tsx",
    },
    output: {
        path: path.resolve(__dirname, "configViewer"),
        filename: "[name].js"
    },
    devTool: "eval-source-map",
    resolve: {
        extensions: [".js", ".ts", ".tsx", ".json"],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: "ts-loader",
            },
            {
                test: /\.css$/,
                use: [ { loader: "css-loader" }, { loader: "style-loader" } ],
            }
        ]
    },
    performance: {
        hints: false,
    },
};