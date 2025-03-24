const path = require('path');

module.exports = {
    entry: path.join(__dirname, 'dist/index.js'),
    output: {
        path: path.resolve(__dirname, 'umd'),
        filename: "index.js",
        libraryTarget: 'umd',
        globalObject: 'this',
        library: 'VenlyConnect',
        libraryExport: 'VenlyConnect'
    },
    watch: false,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader',
                query: {
                    declaration: false,
                },
                include: [
                    path.resolve(__dirname, 'src')
                ]
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
};
