export function getNewImageEvent(opacity) {
    const event = new CustomEvent('_update_images', {
        detail: {
            opacity
        }
    })
    window.dispatchEvent(event);
}

export function getEnableImageEvent() {
    const event = new CustomEvent('_enable_figures', {

    })
    window.dispatchEvent(event);
}

export function getDisableImageEvent() {
    const event = new CustomEvent('_disable_figures', {

    })
    window.dispatchEvent(event);
}