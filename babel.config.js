module.exports = function (api) {
    api.cache(true);

    return {
        // The API exposes the following:

        // Cache the returned value forever and don't call this function again.
        presets: [
            [require("@babel/preset-env"),
                {
                    "useBuiltIns": "entry",
                    "corejs": 3
                }
            ]
        ],
        plugins: [
            [
                require("@babel/plugin-transform-runtime"),
            ],
        ]
    };
}