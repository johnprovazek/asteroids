# Asteroids 
## Device Testing Notes

| Device                  | Browser       | Viewport Width | Viewport Height | Screen Width | Screen Height | DPR  | Default View | Alt View                         | Notes                                                |
|-------------------------|---------------|----------------|-----------------|--------------|---------------|------|--------------|----------------------------------|------------------------------------------------------|
| Windows 10              | Chrome 101    | 2560           | 1329            | 2560         | 1440          | 1.00 | 5/1/2022     | null                             |                                                      |
| Windows 10              | Edge          |                |                 |              |               |      |              |                                  |                                                      |
| Windows 10              | Firefox       |                |                 |              |               |      |              |                                  |                                                      |
| iPad Pro 11inch 3rd Gen | Safari iOS 15 | 834            | 1075            | 834          | 1194          | 2.00 | 5/1/2022     | 5/1/2022                         | No notice of not supported on mobile, font stretched |
| iPad Pro 11inch 3rd Gen | Chrome 101    | 834            | 1087            | 834          | 1194          | 2.00 | 5/1/2022     | TV bigger than screen vertically | No notice of not supported on mobile, font stretched |
| Pixel 3                 | Chrome 101    | 393            | 654             | 393          | 786           | 2.75 | 5/1/2022     | TV bigger than screen vertically |                                                      |
| iPhone 13               | Chrome 101    | 414            | 720             | 414          | 896           | 2.00 | 5/1/2022     | TV bigger than screen vertically |                                                      |
| iPhone 13               | Safari iOS 15 | 414            | 714             | 414          | 896           | 2.00 | 5/1/2022     | TV bigger than screen vertically |                                                      |


## Bugs & Improvments

- Display "Not optimized for mobile devices" on iPad.
- Fix streched font on iPad
- Test on small monitor, TV will likely be bigger than screen and cut off.
