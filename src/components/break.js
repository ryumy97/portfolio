export function getBreak(className) {
    const breakDOM = document.createElement('div');
    breakDOM.className = `break ${className}`;

    return breakDOM;
}