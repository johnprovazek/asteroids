# Asteroids

## Description

This project is inspired by the classic Atari 2600 game Asteroids.
This project was developed for a computer graphics course at CSU Chico. 

Built using vanilla JavaScript and WebGL.

## Installation

If you would like to access my website it can be found at [johnprovazek.com/asteroids](https://www.johnprovazek.com/asteroids).

## Usage

- WASD to move.
- Mouse to aim.
- Left-click to shoot.
- Press Space to start

## Credits

The following resources were taken from the book "WebGL Programming
Guide: Interactive 3D Graphics Programming with WebGL" written by Kouichi Matsuda
& Rodger Lea:

- cuon-matrix.js
- cuon-utils.js
- webgl-debug.js
- webgl-utils.js

## Bugs & Improvements

- Display "Not optimized for mobile devices" on iPad.
- Fix stretched font on iPad
- Test on small monitor, TV will likely be bigger than screen and be cut off.
- Use a linter and a style guide

## Device Tests

| Device                  | Browser       | Viewport Width | Viewport Height | Screen Width | Screen Height | DPR  | Default View | Alt View                         | Notes                                                |
|-------------------------|---------------|----------------|-----------------|--------------|---------------|------|--------------|----------------------------------|------------------------------------------------------|
| Windows 10              | Chrome 101    | 2560           | 1329            | 2560         | 1440          | 1.00 | 5/1/2022     | null                             |                                                      |
| Windows 10              | Edge 101      | 2560           | 1329            | 2560         | 2560          | 1.00 | 5/1/2022     | null                             |                                                      |
| Windows 10              | Firefox 99    | 2560           | 1315            | 2560         | 2560          | 1.00 | 5/1/2022     | null                             |                                                      |
| iPad Pro 11inch 3rd Gen | Safari iOS 15 | 834            | 1075            | 834          | 1194          | 2.00 | 5/1/2022     | 5/1/2022                         | No notice of not supported on mobile, font stretched |
| iPad Pro 11inch 3rd Gen | Chrome 101    | 834            | 1087            | 834          | 1194          | 2.00 | 5/1/2022     | TV bigger than screen vertically | No notice of not supported on mobile, font stretched |
| Pixel 3                 | Chrome 101    | 393            | 654             | 393          | 786           | 2.75 | 5/1/2022     | TV bigger than screen vertically |                                                      |
| iPhone 13               | Chrome 101    | 414            | 720             | 414          | 896           | 2.00 | 5/1/2022     | TV bigger than screen vertically |                                                      |
| iPhone 13               | Safari iOS 15 | 414            | 714             | 414          | 896           | 2.00 | 5/1/2022     | TV bigger than screen vertically |                                                      |