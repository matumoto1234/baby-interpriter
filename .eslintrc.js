module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": "airbnb",
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "rules": {
        "semi": ["error", "never"],
        "func-names": ["off"],
        "no-case-declarations": ["off"]
    }
};
