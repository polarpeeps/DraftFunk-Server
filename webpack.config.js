const path = require('path');
const NodemonPlugin = require('nodemon-webpack-plugin');

module.exports = {
    entry:'./src/index.js',
    output:{
        filename:'bundle.js',
        path:path.resolve(__dirname,'dist')
    },
    target:'node',
    resolve: {
        fallback: {
            "kerberos": false,
            "@mongodb-js/zstd": false,
            "@aws-sdk/credential-providers": false,
            "gcp-metadata": false,
            "snappy": false,
            "socks": false,
            "aws4": false,
            // Add any other modules you want to exclude here
        },
    },
    
    module:{
        rules:[
            {
                test:/\.js$/,
                loader:'babel-loader',
                exclude:/node_modules/,
            }
        ]
    },
    devtool:'source-map',
    plugins:[
        new NodemonPlugin()
    ]
}