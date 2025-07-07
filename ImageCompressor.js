class ImageCompressor {
    constructor(options = {}) {
        this.maxSizeMB = options.maxSizeMB || 2.0;
        this.maxWidth = options.maxWidth || 1920;
        this.quality = options.quality || 0.8;
    }

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

    _fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    _createImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
} 