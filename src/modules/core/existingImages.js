/*
  existingImages.js
  =================
*/

/* Copyright  2017 Yahoo Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
*/

import utils from './utils';
import AnimatedGIF from './AnimatedGIF';
import getBase64GIF from './getBase64GIF';
import error from './error';

export default function existingImages (obj = {}) {
    const self = this;
    const {
        callback,
        images,
        options
    } = obj;
    let imagesLength = obj.imagesLength;
    const skipObj = {
        'getUserMedia': true,
        'window.URL': true
    };
    const errorObj = error.validate(skipObj);
    let loadedImages = [];
    let loadedImagesLength = 0;
    let tempImage;
    let ag;

    if (errorObj.error) {
        return callback(errorObj);
    }

    // change workerPath to point to where Animated_GIF.worker.js is
    ag = new AnimatedGIF(options);

    utils.each(images, function (index, image) {
        let currentImage = image;

        if (image.src) {
            currentImage = currentImage.src;
        }
        if (utils.isElement(currentImage)) {
            if (options.crossOrigin) {
                currentImage.crossOrigin = options.crossOrigin;
            }

            loadedImages[index] = {
                img: currentImage
            };
            loadedImagesLength += 1;

            if (loadedImagesLength === imagesLength) {
                addLoadedImagesToGif();
            }
        } else if (utils.isString(currentImage)) {
            tempImage = new Image();

            if (options.crossOrigin) {
                tempImage.crossOrigin = options.crossOrigin;
            }

            (function (tempImage) {
                tempImage.onerror = function (e) {
                    let obj;

                    --imagesLength; // skips over images that error out

                    if (imagesLength === 0) {
                        obj = {};
                        obj.error = 'None of the requested images was capable of being retrieved';

                        return callback(obj);
                    }
                };

                tempImage.onload = function (e) {
                    loadedImages[index] = {
                        img: tempImage
                    }
                    if(image.text) {
                        loadedImages[index].text = image.text;
                    }
                    if(image.delay) {
                        loadedImages[index].delay = image.delay;
                    }

                    loadedImagesLength += 1;

                    if (loadedImagesLength === imagesLength) {
                        addLoadedImagesToGif();
                    }

                    utils.removeElement(tempImage);
                };

                tempImage.src = currentImage;
            }(tempImage));

            utils.setCSSAttr(tempImage, {
                position: 'fixed',
                opacity: '0'
            });

            document.body.appendChild(tempImage);
        }
    });

    function addLoadedImagesToGif () {
        utils.each(loadedImages, function (index, loadedImage) {
            if (loadedImage) {
                ag.addFrame(loadedImage.img, {
                    text: loadedImage.text,
                    delay: loadedImage.delay
                });
            }
        });

        getBase64GIF(ag, callback);
    }
};
