const IMAGE = 'image';
const VIDEO = 'video';

class AssetsManager {
    constructor() {
        this.assets = {
            aimhigh: this.createAsset(IMAGE, '/assets/aimhigh/aimhigh.png'),
            aimhighRec: this.createAsset(VIDEO, '/assets/aimhigh/recording.mp4'),
            kiwiMain: this.createAsset(IMAGE, '/assets/kiwi/kiwi_bird.png'),
            kiwiBird: this.createAsset(IMAGE, '/assets/kiwi/kiwi_bird.png'),
            kiwiFruit: this.createAsset(IMAGE, '/assets/kiwi/kiwi_fruit.png'),
            kiwiRec: this.createAsset(VIDEO, '/assets/kiwi/kiwi.mp4'),
            typographyPage2: this.createAsset(IMAGE, '/assets/typography/page2.png'),
            typographyRec: this.createAsset(VIDEO, '/assets/typography/typography.mp4'),
            typography: this.createAsset(IMAGE, '/assets/typography/typography05.png'),
            typography01: this.createAsset(IMAGE, '/assets/typography/typography01.png'),
            typography02: this.createAsset(IMAGE, '/assets/typography/typography02.png'),
            typography03: this.createAsset(IMAGE, '/assets/typography/typography03.png'),
            typography04: this.createAsset(IMAGE, '/assets/typography/typography04.png'),
            typography05: this.createAsset(IMAGE, '/assets/typography/typography05.png')
        }
    }

    getAsset(name, className) {
        const asset = this.assets[name];
        asset.className = className;

        return asset;
    }

    createAsset(type, src) {
        if (type === 'image') {
            const dom = new Image();
            dom.src = src;

            return dom;
        }
        else if (type === 'video') {
            const video = document.createElement('video');
            video.src = src;

            return video;
        }
    }
}

export const Assets = new AssetsManager();
