# Proof-of-concept spotten.nu
## Installing and running
1. Install Node.js. (v14 is known to work)
1. Open a shell in the poc directory and run:
```shell
npm install
npm start
```
1. The output should now be written to `spot.pdf`.

## Debugging with VSCode
Add these configurations to launch.json (inside the `configurations` array):
```json
{
    "type": "pwa-node",
    "request": "launch",
    "name": "Launch Program",
    "skipFiles": [
        "<node_internals>/**"
    ],
    "cwd": "${workspaceFolder}/poc",
    "runtimeArgs": ["-r", "ts-node/register"],
    "program": "src/main.ts"
},
{
    "type": "pwa-node",
    "request": "launch",
    "name": "Launch Test",
    "skipFiles": [
        "<node_internals>/**"
    ],
    "cwd": "${workspaceFolder}/poc",
    "program": "node_modules/mocha/bin/_mocha",
    "args": [
        "-r", "ts-node/register",
        "--timeout", "999999",
        "--colors",
        "--recursive",
        "src/**/*.test.ts"
    ]
}
```
