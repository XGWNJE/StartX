/**
 * 客户端图片压缩类.
 *
 * <p>这个类提供了在上传或显示图片之前, 减小图片文件大小和尺寸的功能.
 * 它通过调整图片尺寸和压缩质量来实现.
 */
class ImageCompressor {
    /**
     * 创建一个 ImageCompressor 实例.
     * @param {object} [options={}] - 压缩选项.
     * @param {number} [options.maxSizeMB=2.0] - 图片文件的最大大小 (MB). 超过此大小的图片将被压缩.
     * @param {number} [options.maxWidth=1920] - 图片的最大宽度 (像素). 宽度超过此值的图片将被缩放.
     * @param {number} [options.quality=0.8] - 压缩后图片的质量 (0.0 到 1.0 之间).
     */
    constructor(options = {}) {
        this.maxSizeMB = options.maxSizeMB || 2.0;
        this.maxWidth = options.maxWidth || 1920;
        this.quality = options.quality || 0.8;
    }

    /**
     * 压缩指定的图片文件.
     * <p>如果文件大小小于 maxSizeMB, 将不会被压缩.
     * 否则, 图片将被调整大小并以 JPEG 格式压缩.
     * @param {File} file - 需要压缩的 File 对象.
     * @returns {Promise<{compressed: boolean, dataUrl: string}>} 一个 Promise,
     * 解析后返回一个对象, 其中包含一个布尔值 `compressed` 表示是否进行了压缩,
     * 以及 `dataUrl` 表示压缩后 (或原始) 图片的 base64 编码数据.
     */
    async compress(file) {
        // If file is small enough, no compression needed, just get the dataURL
        if (file.size <= this.maxSizeMB * 1024 * 1024) {
            const dataUrl = await this._fileToDataUrl(file);
            return { compressed: false, dataUrl };
        }

        // If file is large, compression is needed
        const originalDataUrl = await this._fileToDataUrl(file);
        const image = await this._createImage(originalDataUrl);

        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');

        let width = image.width;
        let height = image.height;

        // Resize the image if its dimensions are too large
        if (width > this.maxWidth) {
            height = (this.maxWidth / width) * height;
            width = this.maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(image, 0, 0, width, height);

        // Export canvas to a new dataURL with JPEG compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', this.quality);
        
        return { compressed: true, dataUrl: compressedDataUrl };
    }

    /**
     * 将 File 对象转换为 Data URL.
     * @param {File} file - 要转换的 File 对象.
     * @returns {Promise<string>} 一个 Promise, 解析后返回文件的 Data URL.
     * @private
     */
    _fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * 从一个 URL 创建一个 Image 对象.
     * @param {string} url - 图片的 URL (或 Data URL).
     * @returns {Promise<HTMLImageElement>} 一个 Promise, 解析后返回加载完成的 Image 对象.
     * @private
     */
    _createImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
} 